async function fetchHats() {
  // This asks our own API on the same site: /api/hats
  const res = await fetch("/api/hats", {
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    return { hats: [] };
  }
  return res.json();
}

export default async function Page() {
  const data = await fetchHats();
  const hats = data.hats || [];

  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: "#0b0b10",
        color: "#f5f5f7",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          padding: "1.5rem 1rem",
          textAlign: "center",
          borderBottom: "1px solid #222",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>WF Caps</h1>
        <p
          style={{
            marginTop: "0.4rem",
            fontSize: "0.95rem",
            color: "#aaa",
          }}
        >
          Local Wichita Falls hat catalog. No shipping, no fees – message me for
          pickup.
        </p>
      </header>

      <main
        style={{
          maxWidth: "1100px",
          margin: "1.5rem auto 3rem",
          padding: "0 1rem",
        }}
      >
        {hats.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              margin: "1.5rem 0",
              color: "#aaa",
              fontSize: "0.95rem",
            }}
          >
            No hats found right now or there was an error loading data. Try
            again later.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.2rem",
            }}
          >
            {hats.map((h) => (
              <article
                key={h.id}
                style={{
                  background: "#13131a",
                  borderRadius: "1rem",
                  padding: "0.8rem",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <img
                  src={h.image || ""}
                  alt={h.title || "Hat"}
                  style={{
                    width: "100%",
                    borderRadius: "0.8rem",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    background: "#1f1f28",
                  }}
                />
                <div
                  style={{
                    marginTop: "0.7rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {h.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.95rem",
                      marginTop: "0.15rem",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {h.price
                        ? `${h.currency || "$"}${h.price}`
                        : "See price on eBay"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#bbb",
                      }}
                    >
                      {h.quantity != null ? `Qty: ${h.quantity}` : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    <a
                      href={h.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        borderRadius: "999px",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textAlign: "center",
                        textDecoration: "none",
                        background: "#4b4df5",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      View on eBay
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "#777",
          }}
        >
          Inventory, prices & quantities are pulled live from eBay and update as
          items sell.
        </p>
      </main>
    </div>
  );
}
