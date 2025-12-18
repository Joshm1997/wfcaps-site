export const metadata = {
  title: "WF Caps – Local Hat Catalog",
  description: "Browse my current eBay hat inventory in Wichita Falls.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
