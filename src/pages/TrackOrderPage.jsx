import { useState, useEffect } from "react";
import { fmt } from "../utils/helpers";
import { getOrderById, getOrdersByUser } from "../firebase/orderService";
import InvoiceModal from "../components/InvoiceModal";

const STEPS = [
  { key:"Processing", label:"Order Placed",  icon:"📋", desc:"We've received your order and are preparing it." },
  { key:"Shipped",    label:"Shipped",        icon:"🚚", desc:"Your order is on its way." },
  { key:"Delivered",  label:"Delivered",      icon:"✅", desc:"Your order has been delivered." },
];
const STATUS_ORDER = { Processing:0, Shipped:1, Delivered:2, Cancelled:-1 };

const STATUS_COLOR = {
  Delivered: { bg:"#E8F5EC", color:"#2D7D46" },
  Shipped:   { bg:"#EAF2FF", color:"#1A5276" },
  Processing:{ bg:"#FFF3DC", color:"#B7770D" },
  Cancelled: { bg:"#FDECEA", color:"#C0392B" },
};

export default function TrackOrderPage({ user, setPage }) {
  const [query, setQuery]         = useState("");
  const [result, setResult]       = useState(null);
  const [notFound, setNotFound]   = useState(false);
  const [searching, setSearching] = useState(false);
  const [myOrders, setMyOrders]   = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [invoice, setInvoice]     = useState(null);

  useEffect(() => {
    if (!user) return;
    setMyLoading(true);
    getOrdersByUser(user.uid, user.email).then(o => { setMyOrders(o.slice(0, 5)); setMyLoading(false); });
  }, [user]);

  const search = async (e, id) => {
    e?.preventDefault();
    const orderId = (id || query).trim();
    if (!orderId) return;
    setSearching(true);
    setResult(null);
    setNotFound(false);
    const order = await getOrderById(orderId);
    if (order) { setResult(order); setQuery(order.id); }
    else setNotFound(true);
    setSearching(false);
  };

  const statusIdx = result ? STATUS_ORDER[result.status] : -1;

  return (
    <div className="track-wrap">
      <button className="pd-back" onClick={() => setPage(user ? "profile" : "home")}>← Back</button>

      <div style={{textAlign:"center",marginBottom:36}}>
        <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"2rem",fontWeight:700,marginBottom:8}}>Track Your Order</h2>
        <p style={{color:"var(--mt)"}}>Enter your order ID to get real-time status updates.</p>
      </div>

      {/* Search box */}
      <form onSubmit={search} style={{display:"flex",gap:10,marginBottom:32}}>
        <input className="track-input" placeholder="e.g. TS240520"
          value={query} onChange={e => setQuery(e.target.value.toUpperCase())}/>
        <button type="submit" className="btn-sf" style={{padding:"12px 24px",borderRadius:10,whiteSpace:"nowrap"}}
          disabled={searching}>
          {searching ? "Searching…" : "Track →"}
        </button>
      </form>

      {notFound && (
        <div style={{background:"#FDECEA",border:"1px solid #F5C6CB",borderRadius:10,padding:"14px 18px",color:"#C0392B",fontSize:".9rem",marginBottom:24}}>
          ❌ No order found with ID <strong>{query}</strong>. Please check and try again.
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)",marginBottom:28}}>
          {/* Order header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontSize:".8rem",color:"var(--mt)",marginBottom:4,textTransform:"uppercase",letterSpacing:".08em"}}>Order ID</div>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.5rem",fontWeight:700}}>{result.id}</div>
              <div style={{fontSize:".82rem",color:"var(--mt)",marginTop:4}}>
                {result.createdAt?.toDate
                  ? result.createdAt.toDate().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})
                  : "—"}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{padding:"5px 14px",borderRadius:20,fontSize:".8rem",fontWeight:700,
                background:(STATUS_COLOR[result.status]||STATUS_COLOR.Processing).bg,
                color:(STATUS_COLOR[result.status]||STATUS_COLOR.Processing).color}}>
                {result.status}
              </span>
              <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.3rem",fontWeight:700,marginTop:8}}>{fmt(result.total)}</div>
            </div>
          </div>

          {/* Timeline */}
          {result.status === "Cancelled" ? (
            <div style={{background:"#FDECEA",border:"1px solid #F5C6CB",borderRadius:10,padding:"14px 18px",color:"#C0392B",fontSize:".9rem",marginBottom:24}}>
              ❌ This order was <strong>cancelled</strong>.
            </div>
          ) : (
            <div style={{marginBottom:24}}>
              <div style={{position:"relative",display:"flex",alignItems:"flex-start"}}>
                {/* Connector line */}
                <div style={{position:"absolute",top:18,left:"calc(50% / 3)",right:"calc(50% / 3)",height:3,background:"var(--bd)",zIndex:0}}/>
                <div style={{position:"absolute",top:18,left:"calc(50% / 3)",width:`${Math.max(0, statusIdx) * 50}%`,height:3,background:"var(--sf)",zIndex:1,transition:"width .6s"}}/>
                {STEPS.map((step, i) => {
                  const done    = i < statusIdx;
                  const current = i === statusIdx;
                  return (
                    <div key={step.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:2}}>
                      <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",border:"2.5px solid",
                        borderColor: done || current ? "var(--sf)" : "var(--bd)",
                        background: done ? "var(--sf)" : current ? "#fff" : "#fff",
                        color: done ? "#fff" : current ? "var(--sf)" : "var(--mt)",
                        boxShadow: current ? "0 0 0 5px rgba(232,98,10,.15)" : "none",
                        transition:"all .4s",
                      }}>
                        {done ? "✓" : step.icon}
                      </div>
                      <div style={{fontSize:".76rem",fontWeight:700,marginTop:8,textAlign:"center",
                        color: done || current ? "var(--sf)" : "var(--mt)"}}>
                        {step.label}
                      </div>
                      {current && (
                        <div style={{fontSize:".72rem",color:"var(--mt)",textAlign:"center",marginTop:4,maxWidth:100,lineHeight:1.4}}>
                          {step.desc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ShipRocket live tracking */}
          {result.shiprocket?.awb && (
            <div style={{background:"#FFF8F4",border:"1.5px solid #F5C9A0",borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:".88rem",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,color:"#E8620A"}}>🚀 Shipment Tracking</span>
              <span style={{color:"#6B4C38"}}>AWB: <strong style={{fontFamily:"monospace"}}>{result.shiprocket.awb}</strong></span>
              <span style={{color:"#6B4C38"}}>Courier: <strong>{result.shiprocket.courierName}</strong></span>
              <a href={result.shiprocket.trackingUrl} target="_blank" rel="noreferrer"
                style={{marginLeft:"auto",padding:"6px 16px",background:"#E8620A",color:"#fff",borderRadius:8,fontWeight:700,textDecoration:"none",fontSize:".82rem"}}>
                Track Live →
              </a>
            </div>
          )}

          {/* Fallback tracking number */}
          {result.tracking && !result.shiprocket?.awb && (
            <div style={{background:"#EAF2FF",border:"1px solid #BCD4F0",borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:".88rem"}}>
              <strong style={{color:"#1A5276"}}>📮 Tracking Number:</strong> <span style={{fontFamily:"monospace",fontWeight:700}}>{result.tracking}</span>
            </div>
          )}

          {/* Delivery address */}
          <div style={{background:"#F8F4F0",borderRadius:8,padding:"12px 16px",fontSize:".83rem",color:"var(--mt)",marginBottom:16}}>
            <strong style={{color:"var(--dk)"}}>📍 Delivering to:</strong><br/>
            {result.addr?.name}, {result.addr?.line1}<br/>
            {result.addr?.city}, {result.addr?.state} – {result.addr?.pin}<br/>
            📞 {result.addr?.phone}
            <span style={{marginLeft:12,color:"var(--mt)"}}>· {result.ship === "express" ? "Express (2–3 days)" : "Standard (5–7 days)"}</span>
          </div>

          {/* Items */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:".78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--mt)",marginBottom:10}}>Items Ordered</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(result.items || []).map((item, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid var(--bd)"}}>
                  <div style={{width:40,height:40,background:"linear-gradient(135deg,#FDF0E5,#FFF5EC)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>
                    {item.emoji}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:".88rem"}}>{item.name}</div>
                    {(item.selSize || item.selColor) && (
                      <div style={{fontSize:".75rem",color:"var(--mt)"}}>{[item.selSize,item.selColor].filter(Boolean).join(" · ")}</div>
                    )}
                  </div>
                  <div style={{fontWeight:700,fontSize:".88rem"}}>{fmt(item.price)} × {item.qty}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn-sf" style={{padding:"8px 18px",borderRadius:9,fontSize:".85rem"}}
              onClick={() => setInvoice(result)}>
              🧾 Download Invoice
            </button>
            {user && (
              <button className="btn-sf" style={{background:"none",border:"1.5px solid var(--bd)",color:"var(--mt)",padding:"8px 18px",borderRadius:9,fontSize:".85rem"}}
                onClick={() => setPage("profile")}>
                ← My Orders
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent orders (logged-in users) */}
      {user && myOrders.length > 0 && !result && (
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
          <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",marginBottom:16}}>Your Recent Orders</h3>
          {myLoading ? (
            <div style={{color:"var(--mt)",textAlign:"center",padding:20}}>Loading…</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {myOrders.map(o => {
                const st = STATUS_COLOR[o.status] || STATUS_COLOR.Processing;
                const date = o.createdAt?.toDate
                  ? o.createdAt.toDate().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
                  : "—";
                return (
                  <div key={o.docId} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--bd)",cursor:"pointer"}}
                    onClick={() => search(null, o.id)}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:".9rem",marginBottom:3}}>{o.id}</div>
                      <div style={{fontSize:".8rem",color:"var(--mt)"}}>{date} · {fmt(o.total)}</div>
                    </div>
                    <span style={{fontSize:".75rem",fontWeight:700,padding:"2px 10px",borderRadius:12,background:st.bg,color:st.color}}>{o.status}</span>
                    <span style={{color:"var(--sf)",fontSize:".85rem",fontWeight:700}}>Track →</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)}/>}
    </div>
  );
}
