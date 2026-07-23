import { useState, useEffect, useMemo, Fragment } from "react";
import { subscribeOrders, updateOrderStatus, patchOrder } from "../../firebase/orderService";
import { notifyOrderStatusChanged } from "../../firebase/notificationService";
import { createNotif } from "../../firebase/notifService";
import { creditWallet } from "../../firebase/walletService";
import { fmt } from "../../utils/helpers";
import InvoiceModal from "../../components/InvoiceModal";
import { assignShiprocketAWB, pushOrderToShiprocket, trackShiprocketOrder, syncAllShiprocket } from "../../services/shiprocketService";

// ShipRocket → our status mapping
const SR_MAP = {
  "PICKUP PENDING":   "Processing",
  "PICKUP QUEUED":    "Processing",
  "MANIFESTED":       "Processing",
  "PLACED":           "Processing",
  "NEW":              "Processing",
  "IN TRANSIT":       "Shipped",
  "TRANSIT":          "Shipped",
  "OUT FOR DELIVERY": "Shipped",
  "SHIPPED":          "Shipped",
  "DELIVERED":        "Delivered",
  "RTO INITIATED":    "Cancelled",
  "RTO DELIVERED":    "Cancelled",
  "CANCELLED":        "Cancelled",
  "LOST":             "Cancelled",
};
const mapSRStatus = (s = "") => {
  const up = s.toUpperCase();
  for (const [key, val] of Object.entries(SR_MAP)) {
    if (up.includes(key)) return val;
  }
  return null;
};

const STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];
const STATUS_BADGE = { Processing:"badge-processing", Shipped:"badge-shipped", Delivered:"badge-delivered" };
const RETURN_BADGE = {
  Pending:   { bg:"#FFF3DC", color:"#B7770D" },
  Approved:  { bg:"#E8F5EC", color:"#2D7D46" },
  Rejected:  { bg:"#FDECEA", color:"#C0392B" },
  Completed: { bg:"#EAF2FF", color:"#1A5276" },
};

// ── Date preset helpers ───────────────────────────────────────────────────────
const today = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
};
const PRESETS = [
  { id:"all",   label:"All Time" },
  { id:"today", label:"Today" },
  { id:"week",  label:"This Week" },
  { id:"month", label:"This Month" },
  { id:"year",  label:"This Year" },
  { id:"custom",label:"Custom" },
];
const presetRange = (id) => {
  const t = today();
  if (id === "today")  return { from: t, to: new Date() };
  if (id === "week")   { const s = new Date(t); s.setDate(t.getDate() - t.getDay() + (t.getDay()===0?-6:1)); return { from: s, to: new Date() }; }
  if (id === "month")  return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: new Date() };
  if (id === "year")   return { from: new Date(t.getFullYear(), 0, 1), to: new Date() };
  return null;
};
const toInputDate = (d) => d.toISOString().slice(0, 10);

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [invoice, setInvoice]     = useState(null);
  const [walletCredit, setWalletCredit] = useState(null);
  const [manualTracking, setManualTracking] = useState(null);
  const [awbLoading, setAwbLoading] = useState(null); // docId of order being processed
  const [awbMsg, setAwbMsg]         = useState({});   // { [docId]: "message" }
  const [syncLoading, setSyncLoading] = useState(null);
  const [syncMsg, setSyncMsg]         = useState({});

  // Date filter state
  const [preset, setPreset] = useState("all");
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeOrders(o => { setOrders(o); setLoading(false); });
    return unsub;
  }, []);

  // Auto-sync ShipRocket statuses every 60 s while admin is on this tab
  useEffect(() => {
    syncAllShiprocket().catch(() => {}); // immediate sync on mount
    const id = setInterval(() => syncAllShiprocket().catch(() => {}), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleStatus = async (docId, status) => {
    await updateOrderStatus(docId, status);
    setOrders(prev => {
      const updated = prev.map(o => o.docId === docId ? { ...o, status } : o);
      const order = updated.find(o => o.docId === docId);
      if (order) {
        notifyOrderStatusChanged(order);
        if (order.userId) {
          const msgs = {
            Shipped:   `Your order ${order.id} has been shipped and is on its way!`,
            Delivered: `Your order ${order.id} has been delivered. Thank you for shopping with us!`,
            Cancelled: `Your order ${order.id} has been cancelled. Contact support if you have questions.`,
            Processing:`Your order ${order.id} is now being processed.`,
          };
          createNotif({
            userId:  order.userId,
            type:    "order",
            title:   `Order ${status}`,
            message: msgs[status] || `Your order ${order.id} status changed to ${status}.`,
            link:    "orders",
            orderId: order.id,
          }).catch(() => {});
        }
      }
      return updated;
    });
  };

  const handleCreditWallet = async () => {
    const amt = parseFloat(walletCredit.amount);
    if (!amt || amt <= 0 || !walletCredit.userId) return;
    if (!window.confirm(`Credit ₹${amt} to this customer's wallet for order ${walletCredit.orderId}?`)) return;
    setWalletCredit(w => ({ ...w, loading: true }));
    try {
      await creditWallet(
        walletCredit.userId, amt,
        walletCredit.reason || `Refund / credit for order ${walletCredit.orderId}`,
        { source: walletCredit.source || "refund", orderId: walletCredit.orderId }
      );
      // Notify customer
      createNotif({
        userId:  walletCredit.userId,
        type:    "order",
        title:   "Wallet credited",
        message: `${fmt(amt)} has been added to your wallet for order ${walletCredit.orderId}.`,
        link:    "wallet",
        orderId: walletCredit.orderId,
      }).catch(() => {});
      setWalletCredit(w => ({ ...w, loading: false, done: true }));
      setTimeout(() => setWalletCredit(null), 2500);
    } catch {
      setWalletCredit(w => ({ ...w, loading: false }));
    }
  };

  const handleSaveManualTracking = async () => {
    const num = manualTracking.number.trim();
    if (!num) return;
    if (!window.confirm(`Save tracking number "${num}" (${manualTracking.carrier || "carrier not specified"}) for order ${manualTracking.orderId}? The customer will be notified.`)) return;
    setManualTracking(t => ({ ...t, loading: true }));
    try {
      await patchOrder(manualTracking.docId, { tracking: num, trackingCarrier: manualTracking.carrier.trim() });
      if (manualTracking.userId) {
        createNotif({
          userId:  manualTracking.userId,
          type:    "order",
          title:   "Tracking number added",
          message: `Your order ${manualTracking.orderId} has a tracking number: ${num}${manualTracking.carrier ? ` (${manualTracking.carrier})` : ""}.`,
          link:    "orders",
          orderId: manualTracking.orderId,
        }).catch(() => {});
      }
      setManualTracking(t => ({ ...t, loading: false, done: true }));
      setTimeout(() => setManualTracking(null), 2000);
    } catch {
      setManualTracking(t => ({ ...t, loading: false }));
    }
  };

  const handlePushToSR = async (order) => {
    if (!window.confirm(`Push order ${order.id} to ShipRocket? This creates a real shipment.`)) return;
    setAwbLoading(order.docId);
    try {
      await pushOrderToShiprocket(order.docId);
      setAwbMsg(prev => ({ ...prev, [order.docId]: "✓ Order pushed to ShipRocket — refresh to see AWB button" }));
    } catch (err) {
      setAwbMsg(prev => ({ ...prev, [order.docId]: `Error: ${err.message}` }));
    } finally {
      setAwbLoading(null);
      setTimeout(() => setAwbMsg(prev => { const n = { ...prev }; delete n[order.docId]; return n; }), 6000);
    }
  };

  const handleAssignAWB = async (order) => {
    if (!window.confirm(`Generate an AWB (courier waybill) for order ${order.id}? This assigns a courier and cannot be undone.`)) return;
    setAwbLoading(order.docId);
    try {
      const result = await assignShiprocketAWB(order.shiprocket.shipmentId, order.docId);
      setAwbMsg(prev => ({ ...prev, [order.docId]: `AWB assigned: ${result.awb} via ${result.courierName}` }));
    } catch (err) {
      setAwbMsg(prev => ({ ...prev, [order.docId]: `Error: ${err.message}` }));
    } finally {
      setAwbLoading(null);
      setTimeout(() => setAwbMsg(prev => { const n = { ...prev }; delete n[order.docId]; return n; }), 5000);
    }
  };

  const handleSyncStatus = async (order) => {
    if (!order.shiprocket?.awb) return;
    setSyncLoading(order.docId);
    try {
      const data = await trackShiprocketOrder(order.shiprocket.awb);
      const track = data?.tracking_data?.shipment_track?.[0];
      const srStatus = track?.current_status || "";
      const mappedStatus = mapSRStatus(srStatus);
      await patchOrder(order.docId, { "shiprocket.status": srStatus });
      if (mappedStatus && mappedStatus !== order.status) {
        await handleStatus(order.docId, mappedStatus);
      }
      setSyncMsg(prev => ({
        ...prev,
        [order.docId]: mappedStatus
          ? `✓ ${srStatus} → ${mappedStatus}`
          : `✓ SR: ${srStatus || "no status"}`,
      }));
    } catch (err) {
      setSyncMsg(prev => ({ ...prev, [order.docId]: `Error: ${err.message}` }));
    } finally {
      setSyncLoading(null);
      setTimeout(() => setSyncMsg(prev => { const n = { ...prev }; delete n[order.docId]; return n; }), 5000);
    }
  };

  const selectPreset = (id) => {
    setPreset(id);
    if (id === "all" || id === "custom") { setFrom(""); setTo(""); return; }
    const r = presetRange(id);
    if (r) { setFrom(toInputDate(r.from)); setTo(toInputDate(r.to)); }
  };

  const hasDateFilter = preset !== "all";
  const clearFilters  = () => { setPreset("all"); setFrom(""); setTo(""); setStatusFilter("All"); setSearch(""); };

  const filtered = useMemo(() => orders.filter(o => {
    if (search && !o.id?.includes(search) && !o.addr?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    const date = o.createdAt?.toDate?.();
    if (from && date && date < new Date(from))               return false;
    if (to   && date && date > new Date(to + "T23:59:59"))   return false;
    return true;
  }), [orders, search, statusFilter, from, to]);

  if (loading) return <div className="admin-loading">Loading orders…</div>;

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Orders ({orders.length})</h3>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input className="admin-search" placeholder="Search order / name…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {/* ── Date filters ──────────────────────────────────────────────── */}
        <div style={{padding:"10px 20px 12px",borderBottom:"1px solid #F0E8DF",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:".76rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",flexShrink:0}}>Period:</span>

          {/* Preset chips */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => selectPreset(p.id)}
                style={{padding:"5px 13px",border:`1.5px solid ${preset===p.id ? "#E8620A" : "#E8D5C0"}`,
                  borderRadius:20,background: preset===p.id ? "#E8620A" : "#fff",
                  color: preset===p.id ? "#fff" : "#6B4C38",fontWeight:600,fontSize:".78rem",
                  cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all .15s"}}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range — shown only when custom is selected */}
          {preset === "custom" && (
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <label style={{fontSize:".76rem",fontWeight:700,color:"#6B4C38"}}>From</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  style={{padding:"5px 9px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".83rem",
                    fontFamily:"DM Sans,sans-serif",outline:"none",color:"#18100A"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <label style={{fontSize:".76rem",fontWeight:700,color:"#6B4C38"}}>To</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  style={{padding:"5px 9px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".83rem",
                    fontFamily:"DM Sans,sans-serif",outline:"none",color:"#18100A"}}/>
              </div>
            </div>
          )}

          {/* Active filter summary + clear */}
          {(hasDateFilter || statusFilter !== "All" || search) && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              <span style={{fontSize:".78rem",color:"#6B4C38"}}>
                Showing <strong style={{color:"#18100A"}}>{filtered.length}</strong> of {orders.length} orders
              </span>
              <button onClick={clearFilters}
                style={{padding:"4px 11px",border:"1.5px solid #E8D5C0",borderRadius:16,background:"#fff",
                  color:"#6B4C38",fontSize:".76rem",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                ✕ Clear
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>📦</span><p>No orders found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date & Time</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => (
                <Fragment key={o.docId ?? idx}>
                  <tr style={{cursor:"pointer"}}
                    onClick={() => setExpanded(expanded === o.docId ? null : o.docId)}>
                    <td><strong>{o.id}</strong></td>
                    <td>
                      <div style={{fontWeight:600}}>{o.addr?.name || "—"}</div>
                      <div style={{fontSize:".75rem",color:"#6B4C38"}}>{o.addr?.city}, {o.addr?.state}</div>
                    </td>
                    <td>{o.items?.length ?? 0} item(s)</td>
                    <td><strong>{fmt(o.total)}</strong></td>
                    <td>
                      <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-start"}}>
                        <span className={`badge ${STATUS_BADGE[o.status]||""}`}>{o.status}</span>
                        {o.returnStatus && (() => {
                          const rb = RETURN_BADGE[o.returnStatus] || RETURN_BADGE.Pending;
                          return (
                            <span style={{fontSize:".68rem",fontWeight:700,padding:"2px 8px",borderRadius:8,background:rb.bg,color:rb.color,whiteSpace:"nowrap"}}>
                              {o.returnType === "Exchange" ? "🔄" : "↩"} {o.returnType}: {o.returnStatus}
                            </span>
                          );
                        })()}
                        {o.paymentStatus && (() => {
                          const ps = o.paymentStatus;
                          const pbg = ps === "paid" ? "#EAF2FF" : ps === "wallet" ? "#F0FFF4" : "#FFF3DC";
                          const pc  = ps === "paid" ? "#1A5276" : ps === "wallet" ? "#2D7D46" : "#B7770D";
                          const pl  = ps === "paid" ? "💳 Razorpay" : ps === "wallet" ? "💰 Wallet" : "🔄 COD";
                          return (
                            <span style={{fontSize:".68rem",fontWeight:700,padding:"2px 8px",borderRadius:8,background:pbg,color:pc,whiteSpace:"nowrap"}}>
                              {pl}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td style={{fontSize:".78rem",color:"#6B4C38"}}>
                      {o.createdAt?.toDate ? (
                        <>
                          <div>{o.createdAt.toDate().toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})}</div>
                          <div style={{fontSize:".72rem",color:"#9B8472",marginTop:2}}>{o.createdAt.toDate().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <select className="status-select" value={o.status}
                          onChange={e => { if (window.confirm(`Change order status to "${e.target.value}"? The customer will be notified.`)) handleStatus(o.docId, e.target.value); }}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <button className="admin-btn-icon" title="Generate Invoice"
                          onClick={() => setInvoice(o)}>🧾</button>
                      </div>
                    </td>
                  </tr>
                  {expanded === o.docId && (
                    <tr>
                      <td colSpan={7} style={{background:"#FDFAF7",padding:"16px 20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                          <strong>Order Items</strong>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {/* Push to ShipRocket — shown when no SR order created yet */}
                            {!o.shiprocket?.shipmentId && (
                              <button className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{borderColor:"#E8620A",color:"#E8620A"}}
                                disabled={awbLoading === o.docId}
                                onClick={() => handlePushToSR(o)}>
                                {awbLoading === o.docId ? "Pushing…" : "🚀 Push to ShipRocket"}
                              </button>
                            )}
                            {/* Generate AWB — shown when SR order exists but AWB not yet assigned */}
                            {o.shiprocket?.shipmentId && !o.shiprocket?.awb && (
                              <button className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{borderColor:"#E8620A",color:"#E8620A"}}
                                disabled={awbLoading === o.docId}
                                onClick={() => handleAssignAWB(o)}>
                                {awbLoading === o.docId ? "Assigning…" : "📦 Generate AWB"}
                              </button>
                            )}
                            {o.userId && (
                              <button className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{borderColor:"#2D7D46",color:"#2D7D46"}}
                                onClick={() => setWalletCredit(
                                  walletCredit?.docId === o.docId ? null :
                                  { docId: o.docId, orderId: o.id, userId: o.userId, amount: "", reason: "", source: "refund", loading: false, done: false }
                                )}>
                                💰 Credit Wallet
                              </button>
                            )}
                            <button className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{borderColor:"#1A5276",color:"#1A5276"}}
                              onClick={() => setManualTracking(
                                manualTracking?.docId === o.docId ? null :
                                { docId: o.docId, orderId: o.id, userId: o.userId, number: o.tracking || "", carrier: o.trackingCarrier || "", loading: false, done: false }
                              )}>
                              📮 {o.tracking ? "Edit" : "Add"} Tracking Number
                            </button>
                            <button className="admin-btn admin-btn-outline admin-btn-sm"
                              onClick={() => setInvoice(o)}>🧾 Generate Invoice</button>
                          </div>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                          {(o.items || []).map((item, i) => (
                            <div key={i} style={{background:"#fff",border:"1px solid #E8D5C0",borderRadius:8,padding:"8px 12px",fontSize:".83rem"}}>
                              <strong>{item.name}</strong>
                              {item.selSize && <span style={{color:"#6B4C38"}}> · {item.selSize}</span>}
                              <span style={{fontWeight:700,marginLeft:8}}>{fmt(item.price)} × {item.qty}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:10,fontSize:".83rem",color:"#6B4C38"}}>
                          <strong>Address:</strong> {o.addr?.line1}, {o.addr?.city}, {o.addr?.state} – {o.addr?.pin}
                          &nbsp;|&nbsp;<strong>Phone:</strong> {o.addr?.phone}
                          &nbsp;|&nbsp;<strong>Shipping:</strong> {o.ship === "express" ? "Express (2–3 days)" : "Standard (5–7 days)"}
                        </div>
                        {/* ShipRocket status strip */}
                        {(o.shiprocket || awbMsg[o.docId]) && (
                          <div style={{marginTop:10,background:"#FFF8F4",border:"1.5px solid #F5C9A0",
                            borderRadius:9,padding:"10px 14px",fontSize:".82rem",display:"flex",
                            gap:12,flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontWeight:700,color:"#E8620A"}}>🚀 ShipRocket</span>
                            {o.shiprocket && (
                              <span style={{color:"#6B4C38"}}>Status: <strong>{o.shiprocket.status || "—"}</strong></span>
                            )}
                            {o.shiprocket?.awb && (
                              <>
                                <span style={{color:"#6B4C38"}}>AWB: <strong>{o.shiprocket.awb}</strong></span>
                                <span style={{color:"#6B4C38"}}>Via: <strong>{o.shiprocket.courierName}</strong></span>
                                <a href={o.shiprocket.trackingUrl} target="_blank" rel="noreferrer"
                                  style={{color:"#E8620A",fontWeight:700,textDecoration:"none"}}>
                                  Track →
                                </a>
                                {o.shiprocket?.lastSyncedAt && (
                                  <span style={{color:"#9B8472",fontSize:".75rem"}}>
                                    Synced {o.shiprocket.lastSyncedAt.toDate().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                                  </span>
                                )}
                                <button className="admin-btn admin-btn-outline admin-btn-sm"
                                  style={{borderColor:"#1A5276",color:"#1A5276"}}
                                  disabled={syncLoading === o.docId}
                                  onClick={() => handleSyncStatus(o)}>
                                  {syncLoading === o.docId ? "Syncing…" : "🔄 Force Sync"}
                                </button>
                                {syncMsg[o.docId] && (
                                  <span style={{color: syncMsg[o.docId].startsWith("Error") ? "#C0392B" : "#2D7D46", fontWeight:600, fontSize:".82rem"}}>
                                    {syncMsg[o.docId]}
                                  </span>
                                )}
                              </>
                            )}
                            {awbMsg[o.docId] && (
                              <span style={{color: awbMsg[o.docId].startsWith("Error") ? "#C0392B" : "#2D7D46", fontWeight:600}}>
                                {awbMsg[o.docId]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Wallet credit panel */}
                        {walletCredit?.docId === o.docId && (
                          <div style={{marginTop:14,background:"#F0FFF4",border:"1.5px solid #A8D5B5",borderRadius:10,padding:"14px 16px"}}>
                            <div style={{fontWeight:700,fontSize:".85rem",color:"#2D7D46",marginBottom:10}}>
                              💰 Credit Customer Wallet
                            </div>
                            {walletCredit.done ? (
                              <div style={{color:"#2D7D46",fontWeight:700,fontSize:".9rem"}}>✅ Wallet credited successfully!</div>
                            ) : (
                              <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
                                <div>
                                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B4C38",marginBottom:4}}>AMOUNT (₹)</div>
                                  <input type="number" min={1} step={0.01}
                                    placeholder="e.g. 250"
                                    value={walletCredit.amount}
                                    onChange={e => setWalletCredit(w => ({...w, amount: e.target.value}))}
                                    style={{padding:"7px 12px",border:"1.5px solid #A8D5B5",borderRadius:8,
                                      width:110,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
                                </div>
                                <div style={{flex:1,minWidth:160}}>
                                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B4C38",marginBottom:4}}>REASON</div>
                                  <select value={walletCredit.source}
                                    onChange={e => setWalletCredit(w => ({...w, source: e.target.value,
                                      reason: {refund:"Refund for order",cashback:"Cashback for order",admin:"Goodwill credit for order"}[e.target.value] + " " + o.id}))}
                                    style={{padding:"7px 10px",border:"1.5px solid #A8D5B5",borderRadius:8,
                                      fontSize:".84rem",fontFamily:"DM Sans,sans-serif",background:"#fff",outline:"none",cursor:"pointer"}}>
                                    <option value="refund">Refund</option>
                                    <option value="cashback">Cashback</option>
                                    <option value="admin">Goodwill / Admin</option>
                                  </select>
                                </div>
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={handleCreditWallet}
                                    disabled={walletCredit.loading || !walletCredit.amount || parseFloat(walletCredit.amount) <= 0}
                                    style={{padding:"8px 18px",background:"#2D7D46",color:"#fff",border:"none",
                                      borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:".84rem",
                                      fontFamily:"DM Sans,sans-serif",opacity: walletCredit.loading ? 0.7 : 1}}>
                                    {walletCredit.loading ? "Crediting…" : "Credit Wallet"}
                                  </button>
                                  <button onClick={() => setWalletCredit(null)}
                                    style={{padding:"8px 14px",background:"none",border:"1.5px solid #A8D5B5",
                                      borderRadius:8,cursor:"pointer",color:"#2D7D46",fontSize:".82rem",fontFamily:"DM Sans,sans-serif"}}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Manual tracking number panel */}
                        {manualTracking?.docId === o.docId && (
                          <div style={{marginTop:14,background:"#EAF2FF",border:"1.5px solid #BCD4F0",borderRadius:10,padding:"14px 16px"}}>
                            <div style={{fontWeight:700,fontSize:".85rem",color:"#1A5276",marginBottom:10}}>
                              📮 Manual Tracking Number
                            </div>
                            {manualTracking.done ? (
                              <div style={{color:"#1A5276",fontWeight:700,fontSize:".9rem"}}>✅ Tracking number saved!</div>
                            ) : (
                              <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-end"}}>
                                <div>
                                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B4C38",marginBottom:4}}>TRACKING NUMBER</div>
                                  <input type="text"
                                    placeholder="e.g. 794658312024"
                                    value={manualTracking.number}
                                    onChange={e => setManualTracking(t => ({...t, number: e.target.value}))}
                                    style={{padding:"7px 12px",border:"1.5px solid #BCD4F0",borderRadius:8,
                                      width:190,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
                                </div>
                                <div>
                                  <div style={{fontSize:".72rem",fontWeight:700,color:"#6B4C38",marginBottom:4}}>CARRIER</div>
                                  <input type="text"
                                    placeholder="e.g. FedEx, BlueDart, DTDC"
                                    value={manualTracking.carrier}
                                    onChange={e => setManualTracking(t => ({...t, carrier: e.target.value}))}
                                    style={{padding:"7px 12px",border:"1.5px solid #BCD4F0",borderRadius:8,
                                      width:160,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
                                </div>
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={handleSaveManualTracking}
                                    disabled={manualTracking.loading || !manualTracking.number.trim()}
                                    style={{padding:"8px 18px",background:"#1A5276",color:"#fff",border:"none",
                                      borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:".84rem",
                                      fontFamily:"DM Sans,sans-serif",opacity: manualTracking.loading ? 0.7 : 1}}>
                                    {manualTracking.loading ? "Saving…" : "Save Tracking"}
                                  </button>
                                  <button onClick={() => setManualTracking(null)}
                                    style={{padding:"8px 14px",background:"none",border:"1.5px solid #BCD4F0",
                                      borderRadius:8,cursor:"pointer",color:"#1A5276",fontSize:".82rem",fontFamily:"DM Sans,sans-serif"}}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Wallet used in this order */}
                        {o.walletApplied > 0 && (
                          <div style={{marginTop:10,fontSize:".8rem",color:"#2D7D46",fontWeight:600}}>
                            💰 Wallet used: {fmt(o.walletApplied)} · Paid externally: {fmt(o.amountToPay || 0)}
                          </div>
                        )}

                        {/* ── Device & IP fingerprint (admin-only security info) ── */}
                        {o._device && (
                          <div style={{
                            marginTop:14, background:"#F5F0FF",
                            border:"1px solid #C8B8E8", borderRadius:10,
                            padding:"12px 16px",
                          }}>
                            <div style={{fontWeight:700,fontSize:".8rem",color:"#5A3A8A",marginBottom:10,
                              display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                              🔒 Order Security Fingerprint
                              <span style={{fontWeight:400,fontSize:".72rem",color:"#9B7ACC"}}>
                                (visible to admin only)
                              </span>
                              {o._device?.ip?.includes("localhost") && (
                                <span style={{background:"#FFF3DC",color:"#B7770D",borderRadius:4,
                                  padding:"2px 8px",fontSize:".68rem",fontWeight:700}}>
                                  ⚠ localhost — IP/location unavailable in dev mode; will show in production
                                </span>
                              )}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"6px 20px",fontSize:".78rem"}}>
                              {[
                                ["🌐 IP Address",   o._device.ip          ],
                                ["📍 Location",     [o._device.city, o._device.region, o._device.country].filter(Boolean).join(", ") || "—"],
                                ["📡 Approx. GPS",  o._device.approxLocation || "—"],
                                ["🏢 ISP / Org",    o._device.isp          ],
                                ["📱 Device Type",  o._device.deviceType   ],
                                ["💻 Device Model", o._device.deviceModel  ],
                                ["🖥️ OS",           o._device.os           ],
                                ["🌍 Browser",      o._device.browser      ],
                                ["🗣️ Language",     o._device.language     ],
                                ["🕐 Timezone",     o._device.timezone     ],
                                ["📐 Screen",       o._device.screen       ],
                                ["🖼️ Viewport",     o._device.viewport     ],
                                ["⚙️ CPU Cores",    o._device.cores        ],
                                ["🧠 RAM (GB)",     o._device.memoryGB     ],
                                ["👆 Touch",        o._device.touchEnabled ? "Yes" : "No"],
                                ["🕓 Captured At",  o._device.collectedAt ? new Date(o._device.collectedAt).toLocaleString("en-IN") : "—"],
                              ].map(([label, value]) => (
                                <div key={label} style={{display:"flex",gap:6}}>
                                  <span style={{color:"#7A5AAA",minWidth:110,flexShrink:0}}>{label}</span>
                                  <span style={{color:"#3A2A5A",fontWeight:600,wordBreak:"break-all"}}>{value || "—"}</span>
                                </div>
                              ))}
                            </div>
                            <details style={{marginTop:10}}>
                              <summary style={{cursor:"pointer",fontSize:".72rem",color:"#9B7ACC"}}>
                                Full User-Agent string
                              </summary>
                              <div style={{marginTop:6,fontSize:".7rem",color:"#5A3A8A",wordBreak:"break-all",
                                background:"#EDE8F8",borderRadius:6,padding:"6px 10px",lineHeight:1.5}}>
                                {o._device.userAgent}
                              </div>
                            </details>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {invoice && <InvoiceModal order={invoice} onClose={() => setInvoice(null)}/>}
    </div>
  );
}
