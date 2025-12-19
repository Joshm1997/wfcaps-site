import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// 1) Get an OAuth access token using client_credentials
async function getEbayAccessToken(): Promise<string> {
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
      // Include general + browse scope. If your keyset doesn’t have browse, keep just api_scope.
      scope: [
        "https://api.ebay.com/oauth/api_scope",
        "https://api.ebay.com/oauth/api_scope/buy.browse.readonly",
      ].join(" "),
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Error getting eBay token:", text);
    throw new Error(`Failed to get eBay token: ${text}`);
  }

  const data = JSON.parse(text);
  return data.access_token as string;
}

export async function GET() {
  try {
    // IMPORTANT: this should be your eBay *username*, e.g. "GracefullySaving"
    const seller = assertEnv("EBAY_SELLER_ID", process.env.EBAY_SELLER_ID);

    // 2) Get access token
    const token = await getEbayAccessToken();

    // 3) Call Browse API for this seller's hats
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
      console.error("eBay Browse API error:", text);
      return NextResponse.json(
        {
          error: "eBay Browse API failed",
          details: text,
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);

    const items =
      data.itemSummaries?.map((item: any) => ({
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
  } catch (err: any) {
    console.error("Unhandled error in /api/hats:", err);
    return NextResponse.json(
      {
        error: err?.message ?? "Unknown error in /api/hats",
      },
      { status: 500 }
    );
  }
}
