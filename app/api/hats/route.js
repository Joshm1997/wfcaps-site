// app/api/hats/route.js

import { NextResponse } from "next/server";

// Make sure we're on the Node runtime so Buffer works
export const runtime = "nodejs";

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_SELLER_ID = process.env.EBAY_SELLER_ID;

// Throw a clear error if env vars are missing
function assertEnv() {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET || !EBAY_SELLER_ID) {
    throw new Error(
      "Missing one of EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, or EBAY_SELLER_ID environment variables."
    );
  }
}

// Get an OAuth access token from eBay using client_credentials
async function getEbayAccessToken() {
  assertEnv();

  const credentials = Buffer.from(
    `${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenResponse = await fetch(
    "https://api.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        // This basic scope is always valid and avoids invalid_scope errors
        scope: "https://api.ebay.com/oauth/api_scope",
      }),
    }
  );

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    console.error("Error getting eBay token:", text);
    throw new Error("Failed to get eBay access token");
  }

  const data = await tokenResponse.json();
  return data.access_token;
}

// GET /api/hats
export async function GET() {
  try {
    const token = await getEbayAccessToken();

    // Build Browse API search query
    const params = new URLSearchParams({
      q: "hat",
      limit: "100",
      // Filter results to your seller
      // Syntax: sellers:{seller1|seller2}
      filter: `sellers:{${EBAY_SELLER_ID}}`,
    });

    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error fetching hats from eBay:", text);
      return NextResponse.json(
        { error: "Failed to fetch hats from eBay" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Unhandled error in /api/hats:", err);
    return NextResponse.json(
      { error: "Internal server error talking to eBay" },
      { status: 500 }
    );
  }
}
