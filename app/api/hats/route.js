import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get an OAuth access token using client_credentials
async function getEbayAccessToken() {
  const clientId = assertEnv("EBAY_CLIENT_ID", process.env.EBAY_CLIENT_ID);
  const clientSecret = assertEnv("EBAY_CLIENT_SECRET", process.env.EBAY_CLIENT_SECRET);

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: [
        "https://api.ebay.com/oauth/api_scope",
        "https://api.ebay.com/oauth/api_scope/buy.browse.readonly",
      ].join(" "),
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("EBAY TOKEN ERROR:", text);
    throw new Error(`Failed to get eBay token: ${text}`);
  }

  const data = JSON.parse(text);
  return data.access_token;
}

export async function GET() {
  try {
    const seller = assertEnv("EBAY_SELLER_ID", process.env.EBAY_SELLER_ID);

    const token = await getEbayAccessToken();

    const params = new URLSearchParams({
      q: "hat",
      seller,
      limit: "100",
    });

    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("EBAY BROWSE ERROR:", text);
      return NextResponse.json(
        { error: "EBAY_BROWSE_FAILED", details: text },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);

    const items =
      data.itemSummaries?.map((item) => ({
        id: item.itemId,
        title: item.title,
        price: item.price?.value,
        currency: item.price?.currency,
        image: item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl ?? null,
        url: item.itemWebUrl,
        condition: item.condition,
        quantity: item.quantity ?? item.estimatedAvailableQuantity ?? null,
        seller: item.seller?.username,
      })) ?? [];

    return NextResponse.json({ items });
  } catch (err) {
    console.error("EBAY ROUTE ERROR:", err);
    return NextResponse.json(
      {
        error: "EBAY_ROUTE_ERROR",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
