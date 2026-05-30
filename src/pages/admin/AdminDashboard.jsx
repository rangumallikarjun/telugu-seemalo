import { useState, useEffect } from "react";
import { getOrders } from "../../firebase/orderService";
import { getAllUsers } from "../../firebase/userService";
import { getProducts } from "../../firebase/productService";
import { seedProducts } from "../../firebase/seedService";
import { fmt } from "../../utils/helpers";

const STATUS_COLORS = { Processing:"badge-processing", Shipped:"badge-shipped", Delivered:"badge-delivered" };

export default function AdminDashboard() {
  const [orders, setOrders]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getOrders(), getAllUsers(), getProducts()]).then(([o, u, p]) => {
      setOrders(o); setUsers(u); setProducts(p); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    const result = await seedProducts();
    if (result.alreadySeeded) setSeedMsg(`Already seeded (${result.count} products in database).`);
    else setSeedMsg(`✓ Seeded ${result.seeded} products to Firestore!`);
    const p = await getProducts();
    setProducts(p);
    setSeeding(false);
  };

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;

  return (
    <div className="admin-content">
      {products.length === 0 && (
        <div className="seed-banner">
          <p><strong>Database is empty.</strong> Seed the Firestore database with the 12 starter products to get going.</p>
          <button className="admin-btn admin-btn-primary" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Seeding…" : "🌱 Seed Products"}
          </button>
          {seedMsg && <p style={{width:"100%",color:"#2D7D46",fontWeight:600}}>{seedMsg}</p>}
        </div>
      )}

      <div className="stat-grid">
        {[
          { icon:"💰", val: fmt(revenue),       label:"Total Revenue",  color:"#E8620A" },
          { icon:"📦", val: orders.length,       label:"Total Orders",   color:"#1A5276" },
          { icon:"🏺", val: products.length,     label:"Products",       color:"#2D7D46" },
          { icon:"👥", val: users.length,        label:"Registered Users",color:"#C9901A"},
        ].map(s => (
          <div key={s.label} className="stat-card" style={{"--lc": s.color}}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-val">{s.val}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Recent Orders</h3>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
        </div>
        {orders.length === 0 ? (
          <div className="admin-empty"><span>📦</span><p>No orders yet.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {orders.slice(0,10).map(o => (
                <tr key={o.docId}>
                  <td><strong>{o.id}</strong></td>
                  <td>{o.addr?.name || "—"}</td>
                  <td>{o.items?.length ?? 0} item(s)</td>
                  <td>{fmt(o.total)}</td>
                  <td><span className={`badge ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span></td>
                  <td style={{fontSize:".78rem",color:"#6B4C38"}}>
                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
