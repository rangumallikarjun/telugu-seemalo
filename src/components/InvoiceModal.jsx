import { useRef } from "react";
import { fmt } from "../utils/helpers";

export default function InvoiceModal({ order, onClose }) {
  const ref = useRef();

  const handlePrint = () => {
    const content = ref.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
      <head>
        <title>Invoice ${order.id}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
          .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #E8620A; }
          .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
          .inv-party-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #6B4C38; margin-bottom: 8px; }
          .inv-party-body { font-size: .9rem; line-height: 1.8; color: #2D1E12; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #18100A; color: #fff; padding: 10px 12px; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; }
          thead th:last-child { text-align: right; }
          tbody td { padding: 11px 12px; border-bottom: 1px solid #F0E8DF; font-size: .88rem; color: #2D1E12; vertical-align: middle; }
          tbody td:last-child { text-align: right; font-weight: 600; }
          tbody tr:last-child td { border-bottom: none; }
          tbody tr:nth-child(even) td { background: #FDFAF7; }
          .totals { margin-left: auto; width: 280px; }
          .totals-row { display: flex; justify-content: space-between; font-size: .88rem; padding: 6px 0; color: #6B4C38; border-bottom: 1px solid #F0E8DF; }
          .totals-row.discount { color: #2D7D46; }
          .totals-row.tax-excl { color: #B7770D; }
          .totals-row.grand { font-size: 1.05rem; font-weight: 700; color: #18100A; border-top: 2px solid #18100A; border-bottom: none; padding-top: 10px; margin-top: 4px; }
          .tax-note { font-size: .75rem; color: #6B4C38; margin-top: 6px; font-style: italic; text-align: right; }
          .inv-footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid #E8D5C0; display: flex; justify-content: space-between; align-items: flex-end; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: .72rem; font-weight: 700; }
          .badge-processing { background: #FFF3DC; color: #B7770D; }
          .badge-shipped    { background: #EAF2FF; color: #1A5276; }
          .badge-delivered  { background: #E8F5EC; color: #2D7D46; }
          .badge-cancelled  { background: #FDECEA; color: #C0392B; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (!order) return null;

  const subtotal     = order.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
  const discount     = order.coupon?.discount || 0;
  const taxableAmt   = subtotal - discount;
  const exclusiveTax = order.tax && !order.tax.inclusive ? (order.tax.amount || 0) : 0;
  const inclusiveTax = order.tax && order.tax.inclusive  ? (order.tax.amount || 0) : 0;
  const shippingFee  = order.total - taxableAmt - exclusiveTax;

  const date = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });

  const statusClass = { Processing:"badge-processing", Shipped:"badge-shipped", Delivered:"badge-delivered", Cancelled:"badge-cancelled" };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:4000,
        display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div
        onClick={e => e.stopPropagation()}
        style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:720,
          maxHeight:"95vh",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.25)"}}>

        {/* Modal header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 24px",borderBottom:"1px solid #F0E8DF",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.4rem",fontWeight:700,color:"#18100A",margin:0}}>
            Invoice Preview
          </h2>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose}
              style={{padding:"8px 18px",border:"1.5px solid #E8D5C0",borderRadius:9,background:"#fff",
                color:"#6B4C38",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}>
              Close
            </button>
            <button onClick={handlePrint}
              style={{padding:"8px 18px",border:"none",borderRadius:9,background:"#E8620A",
                color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}>
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div ref={ref} style={{padding:"28px 32px"}}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
            marginBottom:28,paddingBottom:18,borderBottom:"2px solid #E8620A"}}>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.55rem",fontWeight:700,color:"#E8620A"}}>Telugu Seemalo</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:4}}>📍 Karimnagar, Telangana, India</div>
              <div style={{fontSize:".78rem",color:"#6B4C38"}}>📧 hello@teluguseeamalo.in &nbsp;|&nbsp; 📞 +91 9876 543 210</div>
              <div style={{fontSize:".72rem",color:"#C9901A",marginTop:2}}>🏅 Authentic Cheriyal Craft</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"1.2rem",fontWeight:700,color:"#18100A",textTransform:"uppercase",letterSpacing:".1em"}}>Invoice</div>
              <div style={{fontSize:"1rem",fontWeight:700,color:"#E8620A",marginTop:4}}># {order.id}</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:4}}>Date: {date}</div>
              <div style={{marginTop:8}}>
                <span style={{display:"inline-block",padding:"3px 10px",borderRadius:10,fontSize:".72rem",fontWeight:700,
                  ...(order.status === "Delivered" ? {background:"#E8F5EC",color:"#2D7D46"} :
                     order.status === "Shipped"    ? {background:"#EAF2FF",color:"#1A5276"} :
                     order.status === "Cancelled"  ? {background:"#FDECEA",color:"#C0392B"} :
                                                     {background:"#FFF3DC",color:"#B7770D"})}}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill to / Ship to */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,marginBottom:24}}>
            <div>
              <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:8}}>Bill To</div>
              <div style={{fontSize:".9rem",lineHeight:1.8,color:"#2D1E12"}}>
                <strong>{order.addr?.name}</strong><br/>
                {order.addr?.line1}<br/>
                {order.addr?.city}, {order.addr?.state} – {order.addr?.pin}<br/>
                📞 {order.addr?.phone}
                {order.userEmail && <><br/>📧 {order.userEmail}</>}
              </div>
            </div>
            <div>
              <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:8}}>Shipping Details</div>
              <div style={{fontSize:".9rem",lineHeight:1.8,color:"#2D1E12"}}>
                {order.ship === "express"
                  ? <><strong>Express Delivery</strong><br/>Estimated: 2–3 business days</>
                  : <><strong>Standard Delivery</strong><br/>Estimated: 5–7 business days</>}
                <br/>
                <span style={{fontSize:".82rem",color:"#6B4C38"}}>
                  Shipping fee: {shippingFee === 0 ? "Free" : fmt(shippingFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
            <thead>
              <tr style={{background:"#18100A"}}>
                {["#","Product","Size / Colour","Qty","Unit Price","Amount"].map((h, i) => (
                  <th key={h} style={{color:"#fff",padding:"10px 12px",textAlign: i >= 3 ? "center" : "left",
                    fontSize:".74rem",letterSpacing:".06em",textTransform:"uppercase",
                    ...(i === 5 ? {textAlign:"right"} : {})}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i} style={{borderBottom:"1px solid #F0E8DF",background: i%2===1 ? "#FDFAF7" : "#fff"}}>
                  <td style={{padding:"11px 12px",fontSize:".83rem",color:"#9B8472"}}>{i+1}</td>
                  <td style={{padding:"11px 12px"}}>
                    <strong style={{fontSize:".88rem"}}>{item.name}</strong>
                  </td>
                  <td style={{padding:"11px 12px",fontSize:".82rem",color:"#6B4C38"}}>
                    {[item.selSize, item.selColor].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td style={{padding:"11px 12px",textAlign:"center",fontWeight:600}}>{item.qty}</td>
                  <td style={{padding:"11px 12px",textAlign:"right",fontSize:".88rem"}}>{fmt(item.price)}</td>
                  <td style={{padding:"11px 12px",textAlign:"right",fontWeight:700}}>{fmt(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{marginLeft:"auto",width:290}}>
            <TotalsRow label="Subtotal" value={fmt(subtotal)}/>
            {discount > 0 && (
              <TotalsRow label={`Coupon (${order.coupon.code})`} value={`− ${fmt(discount)}`} color="#2D7D46"/>
            )}
            {exclusiveTax > 0 && (
              <TotalsRow label={`${order.tax.label} (${order.tax.rate}%)`} value={`+ ${fmt(exclusiveTax)}`} color="#B7770D"/>
            )}
            <TotalsRow label={`Shipping (${order.ship === "express" ? "Express" : "Standard"})`}
              value={shippingFee === 0 ? "Free" : fmt(shippingFee)}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"1.05rem",fontWeight:700,
              color:"#18100A",borderTop:"2px solid #18100A",paddingTop:10,marginTop:4}}>
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
            {inclusiveTax > 0 && (
              <div style={{fontSize:".74rem",color:"#6B4C38",marginTop:6,fontStyle:"italic",textAlign:"right"}}>
                * Includes {order.tax.label} ({order.tax.rate}%): {fmt(inclusiveTax)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{marginTop:36,paddingTop:16,borderTop:"1px solid #E8D5C0",
            display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div style={{fontSize:".8rem",color:"#6B4C38",lineHeight:1.8}}>
              <strong style={{color:"#2D1E12"}}>Thank you for supporting Cheriyal artisans!</strong><br/>
              For queries: hello@teluguseeamalo.in | +91 9876 543 210<br/>
              Returns accepted within 7 days of delivery.
            </div>
            <div style={{textAlign:"right",fontSize:".74rem",color:"#C9901A"}}>
              <div style={{fontSize:"1.5rem",marginBottom:4}}>🏅</div>
              Authentic Handcrafted Craft<br/>
              Made in Karimnagar, Telangana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalsRow({ label, value, color }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",fontSize:".88rem",
      padding:"6px 0",borderBottom:"1px solid #F0E8DF",color: color || "#6B4C38"}}>
      <span>{label}</span><span style={{fontWeight: color ? 600 : 400}}>{value}</span>
    </div>
  );
}
