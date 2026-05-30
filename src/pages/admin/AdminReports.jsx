import { useState, useEffect, useMemo } from "react";
import { getOrders } from "../../firebase/orderService";
import { getReturnRequests } from "../../firebase/returnService";
import { fmt } from "../../utils/helpers";

// ── CSV download helper ───────────────────────────────────────────────────────
const downloadCSV = (rows, filename) => {
  const csv = rows
    .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const fmtRaw = n => n.toLocaleString("en-IN");

const periodKey = (date, by) => {
  if (by === "day")   return date.toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"});
  if (by === "month") return date.toLocaleDateString("en-IN", {month:"long",year:"numeric"});
  return String(date.getFullYear());
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ icon, label, value, sub, accent }) {
  return (
    <div style={{background:"#fff",borderRadius:12,padding:"20px 22px",boxShadow:"0 2px 10px rgba(0,0,0,.06)",borderLeft:`4px solid ${accent||"#E8620A"}`}}>
      <div style={{fontSize:"1.6rem",marginBottom:8}}>{icon}</div>
      <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.8rem",fontWeight:700,color:"#18100A",lineHeight:1}}>{value}</div>
      <div style={{fontSize:".78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#6B4C38",marginTop:6}}>{label}</div>
      {sub && <div style={{fontSize:".74rem",color:"#C9901A",marginTop:3}}>{sub}</div>}
    </div>
  );
}

export default function AdminReports() {
  const [orders, setOrders]     = useState([]);
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [groupBy, setGroupBy]   = useState("month");
  const [from, setFrom]         = useState("");
  const [to, setTo]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = () => {
    setLoading(true);
    Promise.all([getOrders(), getReturnRequests()]).then(([o, r]) => {
      setOrders(o); setReturns(r); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // ── Filter by date range + status ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const date = o.createdAt?.toDate?.();
      if (from && date && date < new Date(from)) return false;
      if (to   && date && date > new Date(to + "T23:59:59")) return false;
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, from, to, statusFilter]);

  // ── Summary stats (always on full orders) ─────────────────────────────────
  const allRevenue  = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const paid        = orders.filter(o => o.status === "Delivered").length;
  const pending     = orders.filter(o => o.status === "Processing" || o.status === "Shipped").length;
  const cancelled   = orders.filter(o => o.status === "Cancelled").length;
  const pendingAmt  = orders.filter(o => o.status === "Processing" || o.status === "Shipped").reduce((s, o) => s + (o.total || 0), 0);

  // ── Return/exchange stats ──────────────────────────────────────────────────
  const totalReturns      = returns.length;
  const pendingReturns    = returns.filter(r => r.status === "Pending").length;
  const approvedReturns   = returns.filter(r => r.status === "Approved" || r.status === "Completed").length;
  const rejectedReturns   = returns.filter(r => r.status === "Rejected").length;
  const exchangeCount     = returns.filter(r => r.type === "Exchange").length;
  const returnOnlyCount   = returns.filter(r => r.type === "Return").length;

  // ── Grouped report ────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map();

    filtered.forEach(o => {
      const date = o.createdAt?.toDate?.();
      if (!date) return;
      const key = periodKey(date, groupBy);
      if (!map.has(key)) map.set(key, { key, orders: 0, revenue: 0, cancelled: 0, returns: 0, exchanges: 0 });
      const row = map.get(key);
      row.orders++;
      if (o.status !== "Cancelled") row.revenue += o.total || 0;
      if (o.status === "Cancelled") row.cancelled++;
    });

    // Overlay return/exchange data into matching periods
    returns.forEach(r => {
      const date = r.requestedAt?.toDate?.();
      if (!date) return;
      const key = periodKey(date, groupBy);
      if (!map.has(key)) map.set(key, { key, orders: 0, revenue: 0, cancelled: 0, returns: 0, exchanges: 0 });
      const row = map.get(key);
      if (r.type === "Exchange") row.exchanges++;
      else row.returns++;
    });

    return Array.from(map.values());
  }, [filtered, returns, groupBy]);

  const maxRevenue = Math.max(...grouped.map(r => r.revenue), 1);

  // ── Export: all orders ────────────────────────────────────────────────────
  const exportOrders = () => {
    const header = ["Order ID","Date","Customer","Email","City","State","Items","Subtotal","Shipping Fee","Coupon","Total","Status","Shipping Method","Return/Exchange Status","Return/Exchange Type"];
    const rows = filtered.map(o => {
      const date = o.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "—";
      const subtotal = (o.items || []).reduce((s, i) => s + i.price * i.qty, 0);
      const shipFee  = (o.total || 0) - subtotal - (o.coupon?.discount ? -o.coupon.discount : 0);
      return [
        o.id, date,
        o.addr?.name || "—",
        o.userEmail || "—",
        o.addr?.city || "—",
        o.addr?.state || "—",
        o.items?.length ?? 0,
        subtotal,
        shipFee,
        o.coupon ? `${o.coupon.code} (-${o.coupon.discount})` : "None",
        o.total || 0,
        o.status,
        o.ship === "express" ? "Express" : "Standard",
        o.returnStatus || "—",
        o.returnType || "—",
      ];
    });
    downloadCSV([header, ...rows], `orders_export_${Date.now()}.csv`);
  };

  // ── Export: grouped summary ───────────────────────────────────────────────
  const exportSummary = () => {
    const header = ["Period","Total Orders","Revenue (INR)","Avg Order Value (INR)","Cancelled Orders","Return Requests","Exchange Requests"];
    const rows = grouped.map(r => [
      r.key,
      r.orders,
      r.revenue,
      r.orders > 0 ? Math.round(r.revenue / (r.orders - r.cancelled || 1)) : 0,
      r.cancelled,
      r.returns,
      r.exchanges,
    ]);
    const totalRow = ["TOTAL",
      grouped.reduce((s, r) => s + r.orders, 0),
      grouped.reduce((s, r) => s + r.revenue, 0),
      "—",
      grouped.reduce((s, r) => s + r.cancelled, 0),
      grouped.reduce((s, r) => s + r.returns, 0),
      grouped.reduce((s, r) => s + r.exchanges, 0),
    ];
    downloadCSV([header, ...rows, [], totalRow], `sales_report_${groupBy}_${Date.now()}.csv`);
  };

  // ── Export: returns ───────────────────────────────────────────────────────
  const exportReturns = () => {
    const header = ["Date","Order ID","Customer","Email","Type","Reason","Status","Admin Notes"];
    const rows = returns.map(r => {
      const date = r.requestedAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "—";
      return [date, r.orderId, r.userName, r.userEmail, r.type, r.reason, r.status, r.adminNotes || ""];
    });
    downloadCSV([header, ...rows], `returns_export_${Date.now()}.csv`);
  };

  if (loading) return (
    <div className="admin-loading">
      <span className="spinner spinner-lg"/>
      <span>Loading reports…</span>
    </div>
  );

  return (
    <div className="admin-content">

      {/* ── Order summary cards ────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16,marginBottom:16}}>
        <Stat icon="💰" label="Total Revenue"    value={fmt(allRevenue)}    sub={`${orders.filter(o=>o.status!=="Cancelled").length} orders`}  accent="#E8620A"/>
        <Stat icon="✅" label="Paid / Delivered" value={paid}               sub={`${Math.round(paid/Math.max(orders.length,1)*100)}% of orders`} accent="#2D7D46"/>
        <Stat icon="⏳" label="Pending Payments" value={pending}            sub={`${fmt(pendingAmt)} outstanding`}                               accent="#B7770D"/>
        <Stat icon="❌" label="Cancelled"        value={cancelled}          sub={`${Math.round(cancelled/Math.max(orders.length,1)*100)}% rate`} accent="#C0392B"/>
        <Stat icon="📦" label="Total Orders"     value={orders.length}      sub="all time"                                                       accent="#1A5276"/>
      </div>

      {/* ── Return/exchange summary cards ─────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16,marginBottom:24}}>
        <Stat icon="↩"  label="Return Requests"   value={returnOnlyCount}   sub={`${approvedReturns} approved`}    accent="#C0392B"/>
        <Stat icon="🔄" label="Exchange Requests"  value={exchangeCount}     sub={`of ${totalReturns} total`}       accent="#1A5276"/>
        <Stat icon="⏳" label="Pending Review"     value={pendingReturns}    sub="awaiting action"                  accent="#B7770D"/>
        <Stat icon="✓"  label="Resolved"           value={approvedReturns}   sub={`${rejectedReturns} rejected`}    accent="#2D7D46"/>
      </div>

      {/* ── Filters + Export ───────────────────────────────────────────── */}
      <div className="admin-card" style={{marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Sales Report</h3>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportReturns}>
              ↩ Export Returns CSV
            </button>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={exportSummary}>
              📊 Export Summary CSV
            </button>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={exportOrders}>
              📥 Export All Orders CSV
            </button>
          </div>
        </div>

        <div style={{padding:"14px 20px",display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end",borderBottom:"1px solid #F0E8DF"}}>
          {/* Group by */}
          <div>
            <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:6}}>Group By</div>
            <div style={{display:"flex",gap:0,border:"1.5px solid #E8D5C0",borderRadius:8,overflow:"hidden"}}>
              {["day","month","year"].map(g => (
                <button key={g} onClick={() => setGroupBy(g)}
                  style={{padding:"6px 16px",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:".8rem",textTransform:"capitalize",
                    background: groupBy===g ? "#E8620A" : "#fff",
                    color: groupBy===g ? "#fff" : "#6B4C38",
                    borderRight: g !== "year" ? "1px solid #E8D5C0" : "none",
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="admin-inp-grp" style={{margin:0}}>
            <label>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{padding:"6px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".85rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
          </div>
          <div className="admin-inp-grp" style={{margin:0}}>
            <label>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{padding:"6px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".85rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
          </div>

          {/* Status filter */}
          <div className="admin-inp-grp" style={{margin:0}}>
            <label>Status</label>
            <select className="status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {["All","Processing","Shipped","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {(from || to || statusFilter !== "All") && (
            <button className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={() => { setFrom(""); setTo(""); setStatusFilter("All"); }}>
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* ── Report table ─────────────────────────────────────────────── */}
        {grouped.length === 0 ? (
          <div className="admin-empty"><span>📊</span><p>No data for selected period.</p></div>
        ) : (
          <>
            {/* Totals row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,padding:"14px 20px",background:"#F8F4F0",borderBottom:"1px solid #F0E8DF"}}>
              {[
                { label:"Filtered Orders",  val: filtered.length },
                { label:"Filtered Revenue", val: fmt(filtered.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+(o.total||0),0)) },
                { label:"Avg Order Value",  val: fmt(Math.round(filtered.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+(o.total||0),0) / Math.max(filtered.filter(o=>o.status!=="Cancelled").length, 1))) },
                { label:"Cancelled",        val: filtered.filter(o=>o.status==="Cancelled").length },
                { label:"Returns",          val: returns.filter(r=>r.type==="Return").length },
                { label:"Exchanges",        val: returns.filter(r=>r.type==="Exchange").length },
              ].map(c => (
                <div key={c.label} style={{textAlign:"center"}}>
                  <div style={{fontWeight:700,fontSize:"1.1rem",color:"#18100A"}}>{c.val}</div>
                  <div style={{fontSize:".73rem",color:"#6B4C38",textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>{c.label}</div>
                </div>
              ))}
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th style={{textAlign:"right"}}>Orders</th>
                  <th style={{textAlign:"right"}}>Revenue</th>
                  <th style={{textAlign:"right"}}>Avg Order</th>
                  <th style={{textAlign:"right"}}>Cancelled</th>
                  <th style={{textAlign:"right"}}>Returns</th>
                  <th style={{textAlign:"right"}}>Exchanges</th>
                  <th style={{minWidth:140}}>Revenue Bar</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(row => {
                  const validOrders = row.orders - row.cancelled;
                  const avg = validOrders > 0 ? Math.round(row.revenue / validOrders) : 0;
                  const barWidth = Math.round((row.revenue / maxRevenue) * 100);
                  return (
                    <tr key={row.key}>
                      <td style={{fontWeight:600}}>{row.key}</td>
                      <td style={{textAlign:"right"}}>{row.orders}</td>
                      <td style={{textAlign:"right",fontWeight:700,color:"#18100A"}}>{fmt(row.revenue)}</td>
                      <td style={{textAlign:"right",color:"#6B4C38"}}>{fmt(avg)}</td>
                      <td style={{textAlign:"right",color: row.cancelled > 0 ? "#C0392B" : "#6B4C38"}}>{row.cancelled}</td>
                      <td style={{textAlign:"right",color: row.returns > 0 ? "#C0392B" : "#6B4C38"}}>{row.returns}</td>
                      <td style={{textAlign:"right",color: row.exchanges > 0 ? "#1A5276" : "#6B4C38"}}>{row.exchanges}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{flex:1,height:8,background:"#F0E8DF",borderRadius:4,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${barWidth}%`,background:"linear-gradient(90deg,#E8620A,#F0BB50)",borderRadius:4,transition:"width .4s"}}/>
                          </div>
                          <span style={{fontSize:".72rem",color:"#6B4C38",minWidth:32,textAlign:"right"}}>{barWidth}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"#F8F4F0",fontWeight:700}}>
                  <td>Total</td>
                  <td style={{textAlign:"right"}}>{grouped.reduce((s,r)=>s+r.orders,0)}</td>
                  <td style={{textAlign:"right",color:"#E8620A"}}>{fmt(grouped.reduce((s,r)=>s+r.revenue,0))}</td>
                  <td style={{textAlign:"right"}}>—</td>
                  <td style={{textAlign:"right",color:"#C0392B"}}>{grouped.reduce((s,r)=>s+r.cancelled,0)}</td>
                  <td style={{textAlign:"right",color:"#C0392B"}}>{grouped.reduce((s,r)=>s+r.returns,0)}</td>
                  <td style={{textAlign:"right",color:"#1A5276"}}>{grouped.reduce((s,r)=>s+r.exchanges,0)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
