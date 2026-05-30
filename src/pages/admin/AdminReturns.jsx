import { useState, useEffect } from "react";
import { getReturnRequests, updateReturnStatus } from "../../firebase/returnService";
import { updateOrderReturnStatus, getOrderById } from "../../firebase/orderService";
import { notifyReturnStatusChanged } from "../../firebase/notificationService";
import { callProcessRefund } from "../../services/razorpayService";

const STATUS_COLOR = {
  Pending:   { bg:"#FFF3DC", color:"#B7770D" },
  Approved:  { bg:"#E8F5EC", color:"#2D7D46" },
  Rejected:  { bg:"#FDECEA", color:"#C0392B" },
  Completed: { bg:"#EAF2FF", color:"#1A5276" },
};

const TYPE_COLOR = {
  Return:   { bg:"#FDECEA", color:"#C0392B" },
  Exchange: { bg:"#EAF2FF", color:"#1A5276" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.Pending;
  return (
    <span style={{fontSize:".73rem",fontWeight:700,padding:"3px 10px",borderRadius:12,background:s.bg,color:s.color,whiteSpace:"nowrap"}}>
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = TYPE_COLOR[type] || TYPE_COLOR.Return;
  return (
    <span style={{fontSize:".73rem",fontWeight:700,padding:"3px 10px",borderRadius:12,background:t.bg,color:t.color,whiteSpace:"nowrap"}}>
      {type === "Return" ? "↩ Return" : "🔄 Exchange"}
    </span>
  );
}

function ActionModal({ req, onClose, onSave }) {
  const [status, setStatus]   = useState(req.status);
  const [notes, setNotes]     = useState(req.adminNotes || "");
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(req.docId, status, notes);
    setSaving(false);
    onClose();
  };

  const date = req.requestedAt?.toDate?.()?.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) ?? "—";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:540,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.18)"}}>
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0E8DF",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
              <TypeBadge type={req.type}/>
              <StatusBadge status={req.status}/>
            </div>
            <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.3rem",fontWeight:700}}>Order {req.orderId}</h3>
            <p style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>{req.userName} · {req.userEmail} · {date}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#6B4C38"}}>✕</button>
        </div>

        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
          {/* Items */}
          <div>
            <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Items Requested</div>
            {(req.items || []).map((it, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #F0E8DF"}}>
                <span style={{fontSize:"1.3rem"}}>{it.emoji || "🏺"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:".88rem"}}>{it.name}</div>
                  {(it.selSize || it.selColor) && <div style={{fontSize:".74rem",color:"#6B4C38"}}>{[it.selSize,it.selColor].filter(Boolean).join(" · ")}</div>}
                </div>
                <span style={{fontSize:".85rem",fontWeight:700}}>×{it.qty}</span>
              </div>
            ))}
          </div>

          {/* Reason + notes */}
          <div style={{background:"#F8F4F0",borderRadius:8,padding:"12px 14px",fontSize:".85rem"}}>
            <div><strong>Reason:</strong> {req.reason}</div>
            {req.notes && <div style={{marginTop:4,color:"#6B4C38"}}><strong>Notes:</strong> {req.notes}</div>}
          </div>

          {/* Update status */}
          <div>
            <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Update Status</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Pending","Approved","Rejected","Completed"].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{padding:"7px 16px",border:`2px solid ${status===s ? (STATUS_COLOR[s]?.color||"#E8620A") : "#E8D5C0"}`,
                    borderRadius:8,background: status===s ? (STATUS_COLOR[s]?.bg||"#FFF3ED") : "#fff",
                    color: status===s ? (STATUS_COLOR[s]?.color||"#E8620A") : "#6B4C38",
                    fontWeight:600,cursor:"pointer",fontSize:".82rem",fontFamily:"DM Sans,sans-serif",transition:"all .15s"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div>
            <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Admin Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Add a note for the customer (optional)…"
              style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E8D5C0",borderRadius:9,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"10px 0",border:"1.5px solid #E8D5C0",borderRadius:10,background:"#fff",color:"#6B4C38",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".88rem"}}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{flex:2,padding:"10px 0",border:"none",borderRadius:10,background:saving?"#ccc":"#E8620A",color:"#fff",fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".88rem"}}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReturns() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    getReturnRequests().then(r => { setRequests(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (docId, status, notes) => {
    await updateReturnStatus(docId, status, notes);
    setRequests(prev => {
      const updated = prev.map(r => r.docId === docId ? { ...r, status, adminNotes: notes } : r);
      const req = updated.find(r => r.docId === docId);
      if (req) {
        notifyReturnStatusChanged(req);
        if (req.orderDocId) updateOrderReturnStatus(req.orderDocId, status, req.type).catch(() => {});
        if (status === "Completed" && req.type === "Return" && req.orderId) {
          getOrderById(req.orderId).then(order => {
            if (order?.razorpayPaymentId) {
              callProcessRefund({ paymentId: order.razorpayPaymentId }).catch(err =>
                console.error("Razorpay refund failed:", err)
              );
            }
          }).catch(() => {});
        }
      }
      return updated;
    });
  };

  const filtered = requests.filter(r => {
    if (filter !== "All" && r.status !== filter) return false;
    if (typeFilter !== "All" && r.type !== typeFilter) return false;
    return true;
  });

  const counts = {
    Pending:   requests.filter(r => r.status === "Pending").length,
    Approved:  requests.filter(r => r.status === "Approved").length,
    Rejected:  requests.filter(r => r.status === "Rejected").length,
    Completed: requests.filter(r => r.status === "Completed").length,
  };

  if (loading) return (
    <div className="admin-loading">
      <span className="spinner spinner-lg"/>
      <span>Loading returns…</span>
    </div>
  );

  return (
    <div className="admin-content">
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[
          { label:"Total Requests", val: requests.length, accent:"#1A5276" },
          { label:"Pending",        val: counts.Pending,  accent:"#B7770D" },
          { label:"Approved",       val: counts.Approved, accent:"#2D7D46" },
          { label:"Completed",      val: counts.Completed,accent:"#E8620A" },
          { label:"Rejected",       val: counts.Rejected, accent:"#C0392B" },
        ].map(s => (
          <div key={s.label} style={{background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 2px 10px rgba(0,0,0,.06)",borderLeft:`4px solid ${s.accent}`}}>
            <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.8rem",fontWeight:700,lineHeight:1,color:"#18100A"}}>{s.val}</div>
            <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#6B4C38",marginTop:6}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card" style={{marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Return & Exchange Requests</h3>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
        </div>
        <div style={{padding:"12px 20px",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",borderBottom:"1px solid #F0E8DF"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:".78rem",fontWeight:700,color:"#6B4C38"}}>Status:</span>
            {["All","Pending","Approved","Rejected","Completed"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{padding:"5px 12px",border:`1.5px solid ${filter===s?"#E8620A":"#E8D5C0"}`,borderRadius:20,background:filter===s?"#E8620A":"#fff",
                  color:filter===s?"#fff":"#6B4C38",fontWeight:600,fontSize:".78rem",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                {s}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:".78rem",fontWeight:700,color:"#6B4C38"}}>Type:</span>
            {["All","Return","Exchange"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{padding:"5px 12px",border:`1.5px solid ${typeFilter===t?"#E8620A":"#E8D5C0"}`,borderRadius:20,background:typeFilter===t?"#E8620A":"#fff",
                  color:typeFilter===t?"#fff":"#6B4C38",fontWeight:600,fontSize:".78rem",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>📋</span><p>No requests found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Items</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const date = r.requestedAt?.toDate?.()?.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) ?? "—";
                return (
                  <tr key={r.docId}>
                    <td style={{fontSize:".8rem",color:"#6B4C38",whiteSpace:"nowrap"}}>{date}</td>
                    <td style={{fontWeight:700}}>{r.orderId}</td>
                    <td>
                      <div style={{fontWeight:600,fontSize:".88rem"}}>{r.userName}</div>
                      <div style={{fontSize:".75rem",color:"#6B4C38"}}>{r.userEmail}</div>
                    </td>
                    <td><TypeBadge type={r.type}/></td>
                    <td style={{fontSize:".83rem",maxWidth:160,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.reason}</td>
                    <td style={{fontSize:".85rem",fontWeight:600}}>{(r.items||[]).length} item(s)</td>
                    <td><StatusBadge status={r.status}/></td>
                    <td>
                      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setSelected(r)}>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ActionModal
          req={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
