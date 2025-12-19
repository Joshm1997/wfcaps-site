import { NextResponse } from "next/server";

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
      // General public data scope – enough for Browse
      scope: "https://api.ebay.com/oauth/api_scope",
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
        quantity: item.quantity,
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
