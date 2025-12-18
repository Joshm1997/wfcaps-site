import { NextResponse } from "next/server";

const EBAY_SELLER = process.env.EBAY_SELLER_ID;

async function getEbayAccessToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope:
        "https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/buy.browse",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error getting eBay token:", text);
    throw new Error("Failed to get eBay token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET() {
  try {
    const token = await getEbayAccessToken();

    const params = new URLSearchParams({
      seller: EBAY_SELLER,
      q: "hat",
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

    if (!response.ok) {
      const text = await response.text();
      console.error("Error from eBay Browse API:", text);
      return NextResponse.json(
        { error: "Failed to fetch hats from eBay" },
        { status: 500 }
      );
    }

    const data = await response.json();

    const hats = (data.itemSummaries || []).map((item) => ({
      id: item.itemId,
      title: item.title,
      price: item.price?.value,
      currency: item.price?.currency,
      quantity: item.availableQuantity,
      image: item.image?.imageUrl,
      url: item.itemWebUrl,
    }));

    return NextResponse.json({ hats });
  } catch (err) {
    console.error("Error in /api/hats:", err);
    return NextResponse.json(
      { error: "Server error fetching hats" },
      { status: 500 }
    );
  }
}
