import { fmt } from "../utils/helpers";

export default function SuccessPage({order, setPage}) {
  if (!order) { setPage("home"); return null; }
  return (
    <div className="succ-wrap">
      <span className="succ-icon">🎉</span>
      <h2>Order Placed!</h2>
      <p>Thank you for supporting Cheriyal artisans. Your order has been confirmed and will be shipped soon.</p>
      <div className="succ-card">
        <div className="succ-row"><span>Order ID</span><span>{order.id}</span></div>
        <div className="succ-row"><span>Items</span><span>{order.items.length} item{order.items.length>1?"s":""}</span></div>
        <div className="succ-row"><span>Total Paid</span><span>{fmt(order.total)}</span></div>
        <div className="succ-row"><span>Shipping to</span><span>{order.addr.city}, {order.addr.state}</span></div>
        <div className="succ-row"><span>Delivery</span><span>{order.ship==="express"?"2–3 days":"5–7 days"}</span></div>
      </div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn-sf" onClick={() => setPage("shop")}>Continue Shopping</button>
        <button className="btn-out" onClick={() => setPage("profile")}>View Orders</button>
      </div>
    </div>
  );
}
