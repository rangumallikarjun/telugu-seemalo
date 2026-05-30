import { useState, useEffect } from "react";
import { getProducts } from "../firebase/productService";
import { CATS } from "../data/products";
import ProductCard from "../components/ProductCard";
import { fmt } from "../utils/helpers";
import { getRecentlyViewed } from "../utils/recentlyViewed";

const PER_PAGE = 30;

export default function ShopPage({ onOpen, onAdd }) {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [cat, setCat]             = useState("All");
  const [q, setQ]                 = useState("");
  const [page, setPage]           = useState(1);
  const [viewAll, setViewAll]     = useState(false);

  useEffect(() => {
    getProducts().then(p => { setProducts(p); setLoading(false); });
  }, []);

  // Reset to page 1 whenever filter/search/category changes
  useEffect(() => { setPage(1); setViewAll(false); }, [cat, q]);

  const filtered = products.filter(p =>
    (cat === "All" || p.category === cat) &&
    (q === "" || p.name?.toLowerCase().includes(q.toLowerCase()))
  );

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const displayed   = viewAll ? filtered : filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasMore     = !viewAll && filtered.length > PER_PAGE;

  const recentIds = getRecentlyViewed();
  const recentProducts = recentIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 10);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const goPage = (n) => { setPage(n); scrollToTop(); };

  return (
    <div className="sec">
      <div className="sec-hd">
        <h2>Our Collection</h2>
        <div className="divider" />
        <p>Authentic GI-Tagged Cheriyal crafts from Karimnagar, Telangana</p>
      </div>
      <div style={{ maxWidth: 440, margin: "0 auto 24px" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
          style={{ width: "100%", padding: "10px 16px", border: "1.5px solid var(--bd)", borderRadius: 24, fontSize: ".92rem", fontFamily: "DM Sans,sans-serif", outline: "none" }} />
      </div>
      <div className="cat-row">
        {CATS.map(c => <button key={c} className={`cpill ${cat === c ? "act" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <div style={{ fontSize: ".82rem", color: "var(--mt)", marginBottom: 18, textAlign: "right" }}>
          {viewAll
            ? `Showing all ${filtered.length} products`
            : `Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} products`}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--mt)" }}>Loading products…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--mt)" }}>No products found.</div>
      ) : (
        <>
          <div className="pgrid">
            {displayed.map((p, i) => (
              <ProductCard key={p.docId || p.id} p={p} onOpen={onOpen} onAdd={() => onAdd(p)}
                delay={(i % 8) * 90} />
            ))}
          </div>

          {/* Pagination + View All */}
          {hasMore && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 36 }}>
              {/* Page numbers */}
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={() => goPage(page - 1)} disabled={page === 1}
                    style={{ padding: "7px 14px", border: "1.5px solid var(--bd)", borderRadius: 9, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: "var(--mt)", fontSize: ".85rem", fontFamily: "DM Sans,sans-serif", opacity: page === 1 ? .45 : 1 }}>
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => goPage(n)}
                      style={{ width: 36, height: 36, border: n === page ? "none" : "1.5px solid var(--bd)", borderRadius: 9, background: n === page ? "var(--sf)" : "#fff", color: n === page ? "#fff" : "var(--mt)", fontWeight: n === page ? 700 : 400, cursor: "pointer", fontSize: ".88rem", fontFamily: "DM Sans,sans-serif" }}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                    style={{ padding: "7px 14px", border: "1.5px solid var(--bd)", borderRadius: 9, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: "var(--mt)", fontSize: ".85rem", fontFamily: "DM Sans,sans-serif", opacity: page === totalPages ? .45 : 1 }}>
                    Next →
                  </button>
                </div>
              )}

              {/* View All */}
              <button onClick={() => { setViewAll(true); scrollToTop(); }}
                style={{ padding: "9px 28px", border: "1.5px solid var(--bd)", borderRadius: 24, background: "#fff", cursor: "pointer", fontSize: ".88rem", fontWeight: 600, color: "var(--mt)", fontFamily: "DM Sans,sans-serif", transition: "all .18s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--sf)"; e.currentTarget.style.color = "var(--sf)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.color = "var(--mt)"; }}>
                View All {filtered.length} Products
              </button>
            </div>
          )}

          {/* Collapse back when viewing all */}
          {viewAll && filtered.length > PER_PAGE && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={() => { setViewAll(false); setPage(1); scrollToTop(); }}
                style={{ padding: "9px 28px", border: "1.5px solid var(--bd)", borderRadius: 24, background: "#fff", cursor: "pointer", fontSize: ".88rem", fontWeight: 600, color: "var(--mt)", fontFamily: "DM Sans,sans-serif" }}>
                Show Less
              </button>
            </div>
          )}
        </>
      )}

      {/* Recently Viewed */}
      {recentProducts.length >= 2 && (
        <div className="rv-strip">
          <h4>Recently Viewed</h4>
          <div className="rv-scroll">
            {recentProducts.map(p => (
              <div key={p.id} className="rv-card" onClick={() => onOpen(p)}>
                <div className="rv-img">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : p.emoji}
                </div>
                <div className="rv-info">
                  <div className="rv-name">{p.name}</div>
                  <div className="rv-price">{fmt(p.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
