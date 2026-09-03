import { useRef, useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { fmt } from "../utils/helpers";

const STORE_FALLBACK = {
  storeName: "Telugu Seemalo",
  tagline:   "Authentic Cheriyal Craft",
  email:     "hello@teluguseemalo.in",
  phone:     "+91 9876 543 210",
  address:   "Karimnagar, Telangana, India",
  gstNumber: "",
  returnDays: 7,
};

// ── Shared invoice stylesheet (used by both the on-screen preview and print) ──
const INVOICE_CSS = `
  .inv-doc { --ink:#1c1408; --mut:#6B4C38; --soft:#9a8672; --line:#ece0d2;
    --accent:#E8620A; --wash:#fbf6f0;
    font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;
    color:var(--ink); background:#fff; max-width:820px; margin:0 auto; }
  .inv-doc * { box-sizing:border-box; }

  .inv-top { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; padding-bottom:22px; }
  .inv-brand-name { font-family:Georgia,'Times New Roman',serif; font-size:1.7rem; font-weight:700;
    letter-spacing:.01em; color:var(--accent); line-height:1; }
  .inv-brand-tag { font-size:.74rem; letter-spacing:.16em; text-transform:uppercase; color:var(--soft); margin-top:7px; }
  .inv-brand-meta { font-size:.78rem; color:var(--mut); line-height:1.7; margin-top:12px; }

  .inv-title { text-align:right; }
  .inv-title h1 { font-size:1.05rem; letter-spacing:.22em; text-transform:uppercase; font-weight:700; margin:0 0 8px; }
  .inv-title .num { font-size:1rem; font-weight:700; color:var(--accent); }
  .inv-title .date { font-size:.8rem; color:var(--mut); margin-top:3px; }
  .inv-badge { display:inline-block; margin-top:9px; padding:3px 12px; border-radius:999px;
    font-size:.7rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
  .inv-badge.processing { background:#FFF3DC; color:#B7770D; }
  .inv-badge.shipped    { background:#EAF2FF; color:#1A5276; }
  .inv-badge.delivered  { background:#E8F5EC; color:#2D7D46; }
  .inv-badge.cancelled  { background:#FDECEA; color:#C0392B; }

  .inv-rule { height:3px; background:var(--accent); border-radius:2px; }

  .inv-parties { display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:0; margin:24px 0 4px;
    border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  .inv-party { padding:16px 18px; }
  .inv-party + .inv-party { border-left:1px solid var(--line); }
  .inv-party h4 { font-size:.68rem; letter-spacing:.14em; text-transform:uppercase; color:var(--soft);
    margin:0 0 8px; font-weight:700; }
  .inv-party .body { font-size:.86rem; line-height:1.65; color:var(--ink); }
  .inv-party .body .soft { color:var(--mut); }
  .inv-party strong { font-weight:700; }

  table.inv-items { width:100%; border-collapse:collapse; margin:26px 0 0; }
  table.inv-items thead th { background:var(--ink); color:#fff; font-size:.68rem; letter-spacing:.08em;
    text-transform:uppercase; font-weight:700; padding:11px 14px; text-align:left; }
  table.inv-items thead th.r { text-align:right; }
  table.inv-items thead th.c { text-align:center; }
  table.inv-items tbody td { padding:13px 14px; border-bottom:1px solid var(--line); font-size:.88rem; vertical-align:top; }
  table.inv-items tbody td.r { text-align:right; white-space:nowrap; }
  table.inv-items tbody td.c { text-align:center; }
  table.inv-items tbody tr:nth-child(even) td { background:var(--wash); }
  table.inv-items .idx { color:var(--soft); font-size:.8rem; }
  table.inv-items .pname { font-weight:600; }
  table.inv-items .amt { font-weight:700; }

  .inv-summary { display:flex; justify-content:flex-end; margin-top:18px; }
  .inv-totals { width:300px; }
  .inv-totals .row { display:flex; justify-content:space-between; font-size:.86rem; padding:7px 0;
    color:var(--mut); border-bottom:1px solid var(--line); }
  .inv-totals .row.pos { color:#2D7D46; font-weight:600; }
  .inv-totals .row.neg { color:#2D7D46; font-weight:600; }
  .inv-totals .row.tax { color:#B7770D; }
  .inv-totals .grand { display:flex; justify-content:space-between; align-items:baseline;
    margin-top:10px; padding-top:12px; border-top:2px solid var(--ink); }
  .inv-totals .grand .lbl { font-size:.8rem; letter-spacing:.1em; text-transform:uppercase; font-weight:700; }
  .inv-totals .grand .val { font-size:1.25rem; font-weight:800; }
  .inv-totals .note { font-size:.72rem; color:var(--mut); text-align:right; margin-top:7px; font-style:italic; }

  .inv-foot { display:flex; justify-content:space-between; gap:28px; align-items:flex-end;
    margin-top:34px; padding-top:18px; border-top:1px solid var(--line); }
  .inv-foot .thanks { font-size:.82rem; color:var(--mut); line-height:1.75; max-width:60%; }
  .inv-foot .thanks strong { color:var(--ink); display:block; margin-bottom:3px; }
  .inv-foot .seal { text-align:right; font-size:.72rem; color:var(--soft); line-height:1.6; }
  .inv-foot .seal .k { font-family:Georgia,serif; font-size:1rem; color:var(--accent); font-weight:700; }

  @media print {
    body { margin:0; }
    .inv-doc { max-width:none; padding:0 !important; }
  }
`;

export default function InvoiceModal({ order, onClose }) {
  const ref = useRef();
  const [store, setStore] = useState(STORE_FALLBACK);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then(s => { if (s.exists()) setStore(v => ({ ...v, ...s.data() })); })
      .catch(() => {});
  }, []);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Invoice ${order.id}</title>
      <style>body{margin:0;padding:40px;background:#fff;}${INVOICE_CSS}</style>
      </head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (!order) return null;

  const subtotal     = order.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
  const couponRows   = order.coupons?.length
    ? order.coupons
    : (order.coupon ? [{ code: order.coupon.code, discount: order.coupon.discount }] : []);
  const discount     = couponRows.reduce((s, c) => s + (c.discount || 0), 0);
  const taxableAmt    = subtotal - discount;
  const exclusiveTax = order.tax && !order.tax.inclusive ? (order.tax.amount || 0) : 0;
  const inclusiveTax = order.tax &&  order.tax.inclusive  ? (order.tax.amount || 0) : 0;
  const shippingFee  = order.total - taxableAmt - exclusiveTax;
  const walletApplied = order.walletApplied || 0;

  const status = order.status || "Processing";
  const badgeCls = { Delivered:"delivered", Shipped:"shipped", Cancelled:"cancelled" }[status] || "processing";

  const date = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  const payLabel =
    order.paymentStatus === "paid"   ? "Paid online · Razorpay" :
    order.paymentStatus === "wallet" ? "Paid via Wallet" :
    walletApplied > 0                ? `Wallet ${fmt(walletApplied)} + online` :
                                       "Cash on delivery";

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(20,12,4,.55)",zIndex:4000,
        display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
      <div
        onClick={e => e.stopPropagation()}
        style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:860,
          boxShadow:"0 24px 70px rgba(20,12,4,.35)",overflow:"hidden"}}>

        {/* Toolbar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px 22px",borderBottom:"1px solid #efe6da",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.15rem",fontWeight:700,color:"#1c1408",margin:0,letterSpacing:".01em"}}>
            Invoice Preview
          </h2>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose}
              style={{padding:"8px 18px",border:"1.5px solid #e2d3c0",borderRadius:9,background:"#fff",
                color:"#6B4C38",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}>
              Close
            </button>
            <button onClick={handlePrint}
              style={{padding:"8px 18px",border:"none",borderRadius:9,background:"#E8620A",
                color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div style={{maxHeight:"78vh",overflow:"auto",background:"#f3ece2",padding:"26px 22px"}}>
          <style>{INVOICE_CSS}</style>
          <div ref={ref} className="inv-doc" style={{padding:"38px 40px",boxShadow:"0 8px 30px rgba(20,12,4,.12)",borderRadius:10}}>

            {/* Header */}
            <div className="inv-top">
              <div>
                <div className="inv-brand-name">{store.storeName}</div>
                <div className="inv-brand-tag">{store.tagline}</div>
                <div className="inv-brand-meta">
                  {store.address}<br/>
                  {store.email}&nbsp;&nbsp;·&nbsp;&nbsp;{store.phone}
                  {store.gstNumber && <><br/>GSTIN: {store.gstNumber}</>}
                </div>
              </div>
              <div className="inv-title">
                <h1>Invoice</h1>
                <div className="num">{order.id}</div>
                <div className="date">{date}</div>
                <span className={`inv-badge ${badgeCls}`}>{status}</span>
              </div>
            </div>

            <div className="inv-rule"/>

            {/* Parties */}
            <div className="inv-parties">
              <div className="inv-party">
                <h4>Billed To</h4>
                <div className="body">
                  <strong>{order.addr?.name}</strong><br/>
                  {order.addr?.line1}<br/>
                  <span className="soft">{order.addr?.city}, {order.addr?.state} – {order.addr?.pin}</span><br/>
                  <span className="soft">{order.addr?.phone}</span>
                  {order.userEmail && <><br/><span className="soft">{order.userEmail}</span></>}
                </div>
              </div>
              <div className="inv-party">
                <h4>Shipping</h4>
                <div className="body">
                  <strong>{order.ship === "express" ? "Express Delivery" : "Standard Delivery"}</strong><br/>
                  <span className="soft">Est. {order.ship === "express" ? "2–3" : "5–7"} business days</span><br/>
                  <span className="soft">Fee: {shippingFee <= 0 ? "Free" : fmt(shippingFee)}</span>
                </div>
              </div>
              <div className="inv-party">
                <h4>Payment</h4>
                <div className="body">
                  <strong>{payLabel}</strong>
                  {order.razorpayPaymentId && <><br/><span className="soft">{order.razorpayPaymentId}</span></>}
                  {order.amountToPay != null && order.amountToPay > 0 && (
                    <><br/><span className="soft">Balance: {fmt(order.amountToPay)}</span></>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <table className="inv-items">
              <thead>
                <tr>
                  <th style={{width:36}}>#</th>
                  <th>Product</th>
                  <th>Size / Colour</th>
                  <th className="c" style={{width:56}}>Qty</th>
                  <th className="r" style={{width:96}}>Rate</th>
                  <th className="r" style={{width:104}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="idx">{i + 1}</td>
                    <td className="pname">{item.name}</td>
                    <td className="soft" style={{color:"#6B4C38"}}>
                      {[item.selSize, item.selColor].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="c">{item.qty}</td>
                    <td className="r">{fmt(item.price)}</td>
                    <td className="r amt">{fmt(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="inv-summary">
              <div className="inv-totals">
                <div className="row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {couponRows.filter(c => (c.discount || 0) > 0).map(c => (
                  <div key={c.code} className="row neg"><span>Coupon ({c.code})</span><span>− {fmt(c.discount)}</span></div>
                ))}
                {exclusiveTax > 0 && (
                  <div className="row tax"><span>{order.tax.label} ({order.tax.rate}%)</span><span>+ {fmt(exclusiveTax)}</span></div>
                )}
                <div className="row">
                  <span>Shipping ({order.ship === "express" ? "Express" : "Standard"})</span>
                  <span>{shippingFee <= 0 ? "Free" : fmt(shippingFee)}</span>
                </div>
                {walletApplied > 0 && (
                  <div className="row neg"><span>Wallet</span><span>− {fmt(walletApplied)}</span></div>
                )}
                <div className="grand">
                  <span className="lbl">{walletApplied > 0 ? "Amount Payable" : "Total"}</span>
                  <span className="val">{fmt(walletApplied > 0 ? Math.max(0, order.total - walletApplied) : order.total)}</span>
                </div>
                {inclusiveTax > 0 && (
                  <div className="note">Inclusive of {order.tax.label} ({order.tax.rate}%): {fmt(inclusiveTax)}</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="inv-foot">
              <div className="thanks">
                <strong>Thank you for supporting Cheriyal artisans.</strong>
                Queries: {store.email} · {store.phone}<br/>
                Returns accepted within {store.returnDays || 7} days of delivery. This is a computer-generated invoice.
              </div>
              <div className="seal">
                <div className="k">{store.storeName}</div>
                {store.address}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
