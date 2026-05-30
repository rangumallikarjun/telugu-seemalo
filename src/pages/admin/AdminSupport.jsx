import { useState, useEffect, useRef } from "react";
import { subscribeTickets, updateTicket, addReply } from "../../firebase/supportService";
import { emailAdminReply, emailTicketResolved } from "../../services/emailService";
import { createNotif } from "../../firebase/notifService";

const STATUS_OPTS   = ["open","in-progress","resolved","closed"];
const PRIORITY_OPTS = ["normal","high","urgent"];
const CAT_LABELS    = { general:"General", order:"Order", return:"Return", payment:"Payment", product:"Product", shipping:"Shipping", other:"Other" };

// ── Chat Templates ─────────────────────────────────────────────────────────────
const TEMPLATE_CATS = [
  {
    id: "greeting", label: "👋 Greeting", templates: [
      { title: "Welcome",        text: "Hi [name], thank you for reaching out to Telugu Seemalo Support! I'm happy to help you today." },
      { title: "Acknowledge",    text: "Hello [name], thanks for contacting us. I've reviewed your ticket and will assist you shortly." },
      { title: "Apology opener", text: "Hi [name], I sincerely apologise for the inconvenience caused. Let me look into this right away." },
    ],
  },
  {
    id: "order", label: "📦 Order", templates: [
      { title: "Processing",     text: "Your order is currently being processed and will be shipped within 1–2 business days." },
      { title: "Shipped",        text: "Great news! Your order has been shipped and should arrive within 5–7 business days. You can track it from your account." },
      { title: "Delivered check",text: "According to our records, your order was marked as delivered. Could you confirm whether you received it?" },
      { title: "Delay notice",   text: "We're sorry for the delay on your order. Our logistics team is working to dispatch it at the earliest and we'll keep you updated." },
      { title: "Need order ID",  text: "Could you please share your Order ID so I can pull up the exact details and assist you better?" },
    ],
  },
  {
    id: "return", label: "↩ Return / Refund", templates: [
      { title: "Return received",text: "We've received your return request and our team will review it within 2–3 business days." },
      { title: "Refund processed",text: "Your refund has been processed successfully. It should reflect in your original payment method within 5–7 business days." },
      { title: "Return eligibility",text: "To be eligible for a return, items must be in original condition with all tags intact and returned within 7 days of delivery." },
      { title: "Exchange initiated",text: "Your exchange request has been initiated. We'll ship the replacement once we receive the original item." },
    ],
  },
  {
    id: "payment", label: "💳 Payment", templates: [
      { title: "Payment failed",  text: "I'm sorry to hear about the payment issue. Could you let us know the error message you saw, or try again using a different payment method?" },
      { title: "Duplicate charge",text: "I understand your concern about a duplicate charge. Please share your transaction reference and we'll investigate immediately." },
      { title: "COD confirmation",text: "Your Cash on Delivery order is confirmed. Please keep the exact amount ready at the time of delivery." },
    ],
  },
  {
    id: "product", label: "🛍 Product", templates: [
      { title: "Damaged item",    text: "We're very sorry you received a damaged item. Please share a photo of the damage and we'll arrange a replacement or full refund promptly." },
      { title: "Wrong item",      text: "I apologise for the wrong item being delivered. Please share a photo and we'll ship the correct item at no extra cost." },
      { title: "Size / colour",   text: "We'll check if your requested size/colour variant is available and get back to you as soon as possible." },
    ],
  },
  {
    id: "closing", label: "✅ Closing", templates: [
      { title: "Anything else?",  text: "Is there anything else I can help you with today?" },
      { title: "Thank you",       text: "Thank you for your patience, [name]. We're glad we could resolve your issue! Have a wonderful day." },
      { title: "Resolved",        text: "I'm marking this ticket as resolved. If you need further assistance, feel free to open a new ticket anytime." },
      { title: "Escalated",       text: "I've escalated this to our senior team and you'll receive an update within 24 hours. Thank you for your patience." },
    ],
  },
];

const fmtTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
};

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)    return "just now";
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
};

function StatusBadge({ status }) {
  const cls   = { open:"sup-badge-open", "in-progress":"sup-badge-inprog", resolved:"sup-badge-resolved", closed:"sup-badge-closed" };
  const label = { open:"Open", "in-progress":"In Progress", resolved:"Resolved", closed:"Closed" };
  return <span className={`sup-badge ${cls[status] || "sup-badge-open"}`}>{label[status] || status}</span>;
}

function PriorityBadge({ priority }) {
  const cls = { normal:"sup-pri-normal", high:"sup-pri-high", urgent:"sup-pri-urgent" };
  return priority !== "normal"
    ? <span className={`sup-badge ${cls[priority]}`}>{priority === "urgent" ? "🔴 Urgent" : "🟠 High"}</span>
    : null;
}

// ── Templates Panel ────────────────────────────────────────────────────────────
function TemplatesPanel({ customerName, onInsert }) {
  const [activeCat, setActiveCat] = useState("greeting");
  const [search,    setSearch]    = useState("");

  const resolve = (text) => text.replace(/\[name\]/gi, customerName || "there");

  const cat = TEMPLATE_CATS.find(c => c.id === activeCat);
  const visible = search.trim()
    ? TEMPLATE_CATS.flatMap(c => c.templates.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.text.toLowerCase().includes(search.toLowerCase())
      ))
    : (cat?.templates || []);

  return (
    <div style={{
      width: 260, flexShrink: 0, borderLeft: "1px solid #E8E0D5",
      background: "#FDFAF7", display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Panel header */}
      <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid #E8E0D5", background:"#fff" }}>
        <div style={{ fontWeight:700, fontSize:".82rem", color:"#18100A", marginBottom:8, letterSpacing:".03em" }}>
          ⚡ Quick Templates
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates…"
          style={{ width:"100%", padding:"6px 10px", border:"1.5px solid #E8E0D5", borderRadius:7,
            fontSize:".78rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box",
            background:"#F8F4F0" }}
        />
      </div>

      {/* Category tabs (hidden when searching) */}
      {!search.trim() && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, padding:"8px 10px", borderBottom:"1px solid #E8E0D5", background:"#fff" }}>
          {TEMPLATE_CATS.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              style={{ padding:"3px 9px", borderRadius:20, border:"1.5px solid",
                borderColor: activeCat === c.id ? "#E8620A" : "#E8E0D5",
                background:  activeCat === c.id ? "#FFF3EC" : "none",
                color:       activeCat === c.id ? "#E8620A" : "#6B4C38",
                fontSize:".7rem", fontWeight: activeCat === c.id ? 700 : 400,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Template list */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px 10px", display:"flex", flexDirection:"column", gap:6 }}>
        {visible.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 8px", color:"#9B8472", fontSize:".78rem" }}>
            No templates found
          </div>
        )}
        {visible.map((t, i) => (
          <button key={i} onClick={() => onInsert(resolve(t.text))}
            style={{ textAlign:"left", background:"#fff", border:"1.5px solid #E8E0D5", borderRadius:9,
              padding:"9px 11px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              transition:"border-color .15s, box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#E8620A"; e.currentTarget.style.boxShadow="0 2px 8px rgba(232,98,10,.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#E8E0D5"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ fontSize:".75rem", fontWeight:700, color:"#E8620A", marginBottom:4 }}>{t.title}</div>
            <div style={{ fontSize:".76rem", color:"#6B4C38", lineHeight:1.4,
              display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
              {resolve(t.text)}
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding:"8px 12px", borderTop:"1px solid #E8E0D5", fontSize:".68rem", color:"#9B8472", textAlign:"center" }}>
        Click to insert · [name] auto-filled
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminSupport() {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selId, setSelId]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat,    setFilterCat]    = useState("all");
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [notes, setNotes]       = useState("");
  const [showTpl, setShowTpl]   = useState(true);
  const threadRef = useRef(null);

  const sel = tickets.find(t => t.id === selId) || null;

  useEffect(() => {
    const unsub = subscribeTickets(data => { setTickets(data); setLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [sel?.id, sel?.replies?.length]);

  useEffect(() => {
    setNotes(sel?.adminNotes || "");
  }, [selId]);

  useEffect(() => {
    if (sel && !sel.read) updateTicket(sel.id, { read: true });
  }, [sel?.id, sel?.read]);

  const open = (t) => { setSelId(t.id); setReply(""); setNotes(t.adminNotes || ""); };

  const handleStatusChange = async (status) => {
    await updateTicket(sel.id, { status });
    if ((status === "resolved" || status === "closed") && sel.email) {
      const tid = sel.ticketId || sel.id;
      emailTicketResolved({
        to_name:   sel.name,
        to_email:  sel.email,
        ticket_id: tid,
        subject:   sel.subject,
      });
      if (sel.uid) {
        createNotif({
          userId:   sel.uid,
          type:     "support",
          title:    status === "resolved" ? "Your ticket has been resolved ✓" : "Your ticket has been closed",
          message:  `Ticket ${tid}: "${sel.subject}" has been ${status}.`,
          link:     "support",
          ticketId: tid,
        }).catch(() => {});
      }
    }
  };
  const handlePriorityChange = (priority) => updateTicket(sel.id, { priority });
  const saveNotes            = ()         => updateTicket(sel.id, { adminNotes: notes });

  // Insert template — append to existing draft or replace if empty
  const insertTemplate = (text) => {
    setReply(prev => prev.trim() ? prev.trimEnd() + "\n\n" + text : text);
  };

  const handleReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const msg = {
      id: Date.now().toString(36),
      from: "admin",
      name: "Telugu Seemalo Support",
      message: reply.trim(),
      createdAt: new Date().toISOString(),
    };
    await addReply(sel.id, msg);

    if (sel.status === "open") {
      await updateTicket(sel.id, { status: "in-progress" });
    }

    await emailAdminReply({
      to_name: sel.name,
      to_email: sel.email,
      ticket_id: sel.ticketId || sel.id,
      original_subject: sel.subject,
      reply_message: reply.trim(),
    });

    if (sel.uid) {
      createNotif({
        userId:   sel.uid,
        type:     "support",
        title:    "Reply on your support ticket",
        message:  `We've replied to your ticket: "${sel.subject}". Check your support ticket for our response.`,
        link:     "support",
        ticketId: sel.ticketId || sel.id,
      }).catch(() => {});
    }

    setReply("");
    setSending(false);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search || [t.name, t.email, t.subject, t.ticketId].some(v => (v||"").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchCat    = filterCat    === "all" || t.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  const unreadCount = tickets.filter(t => !t.read && t.status !== "closed").length;

  return (
    <div className="admin-content" style={{ padding:0 }}>
      {/* Header */}
      <div style={{ padding:"20px 28px 16px", borderBottom:"1px solid #E8E0D5", background:"#fff", display:"flex", alignItems:"center", gap:14 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", fontWeight:700, color:"#18100A" }}>Support Tickets</h2>
        {unreadCount > 0 && (
          <span style={{ background:"#E8620A", color:"#fff", borderRadius:20, padding:"2px 10px", fontSize:".75rem", fontWeight:700 }}>
            {unreadCount} new
          </span>
        )}
        <span style={{ marginLeft:"auto", fontSize:".83rem", color:"#9B8472" }}>
          {tickets.filter(t=>t.status==="open").length} open · {tickets.length} total
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"80px", color:"#9B8472" }}>Loading tickets…</div>
      ) : (
        <div className="sup-wrap">

          {/* ── LEFT: TICKET LIST ── */}
          <div className="sup-list">
            <div className="sup-filters">
              <input className="sup-search" placeholder="Search by name, email, subject…"
                value={search} onChange={e => setSearch(e.target.value)}/>
              <div className="sup-filter-row">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="all">All Categories</option>
                  {Object.entries(CAT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:"center", padding:"48px 16px", color:"#9B8472", fontSize:".85rem" }}>
                No tickets found
              </div>
            )}

            {filtered.map(t => (
              <div key={t.id} className={`sup-item ${sel?.id === t.id ? "active" : ""}`} onClick={() => open(t)}>
                {!t.read && t.status !== "closed" && <div className="sup-unread"/>}
                <div className="sup-item-top">
                  <span className="sup-item-name">{t.name}</span>
                  <span className="sup-item-id">{t.ticketId ? `#${t.ticketId.slice(-8)}` : ""}</span>
                </div>
                <div className="sup-item-subject">{t.subject}</div>
                <div className="sup-item-meta">
                  <StatusBadge status={t.status}/>
                  <PriorityBadge priority={t.priority}/>
                  <span className="sup-badge" style={{ background:"#F0F4FF", color:"#3D5AFE" }}>
                    {CAT_LABELS[t.category] || t.category}
                  </span>
                  <span className="sup-date">{fmtDate(t.createdAt)}</span>
                  {(t.replies?.length > 0) && <span className="sup-date">💬 {t.replies.length}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── RIGHT: TICKET DETAIL + TEMPLATES ── */}
          {!sel ? (
            <div className="sup-empty">
              <div style={{ fontSize:"3rem" }}>📬</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.3rem", fontWeight:700, color:"#18100A" }}>
                Select a ticket
              </div>
              <div style={{ fontSize:".85rem" }}>Click any ticket on the left to view details and reply</div>
            </div>
          ) : (
            /* Wrapper: detail column + templates column */
            <div style={{ display:"flex", flex:1, minWidth:0, height:"100%", overflow:"hidden" }}>

              {/* ── Detail column ── */}
              <div className="sup-detail" style={{ flex:1, minWidth:0 }}>
                {/* Ticket header */}
                <div className="sup-detail-hd">
                  <div className="sup-detail-hd-top">
                    <span style={{ fontFamily:"monospace", fontSize:".78rem", background:"#F0F4FF", color:"#3D5AFE", padding:"2px 8px", borderRadius:6, fontWeight:700 }}>
                      {sel.ticketId || `#${sel.id.slice(-8)}`}
                    </span>
                    <StatusBadge status={sel.status}/>
                    <PriorityBadge priority={sel.priority}/>
                    <span className="sup-badge" style={{ background:"#F0F4FF", color:"#3D5AFE" }}>
                      {CAT_LABELS[sel.category] || sel.category}
                    </span>
                    <span style={{ fontSize:".73rem", color:"#9B8472", marginLeft:"auto" }}>{fmtTime(sel.createdAt)}</span>
                  </div>
                  <div className="sup-detail-title">{sel.subject}</div>
                  <div className="sup-detail-controls">
                    <select value={sel.status} onChange={e => handleStatusChange(e.target.value)}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                    <select value={sel.priority} onChange={e => handlePriorityChange(e.target.value)}>
                      {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                    {/* Templates toggle */}
                    <button onClick={() => setShowTpl(v => !v)}
                      title={showTpl ? "Hide templates" : "Show quick templates"}
                      style={{ marginLeft:8, padding:"4px 12px", border:"1.5px solid",
                        borderColor: showTpl ? "#E8620A" : "#E8E0D5",
                        background:  showTpl ? "#FFF3EC" : "none",
                        color:       showTpl ? "#E8620A" : "#9B8472",
                        borderRadius:8, cursor:"pointer", fontSize:".75rem", fontWeight:700,
                        fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                      ⚡ Templates
                    </button>
                    <button onClick={() => setSelId(null)}
                      style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"#9B8472", padding:"2px 6px" }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* Thread */}
                <div className="sup-thread" ref={threadRef}>
                  <div className="sup-cust-info">
                    {[
                      ["👤 Name",  sel.name],
                      ["📧 Email", sel.email],
                      sel.phone   && ["📞 Phone", sel.phone],
                      sel.orderId && ["📦 Order", sel.orderId],
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} className="sup-cust-info-item">
                        <span>{k}:</span><strong>{v}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="sup-msg-wrap">
                    <div style={{ alignSelf:"flex-start", maxWidth:"75%" }}>
                      <div className="sup-msg-label" style={{ color:"#6B4C38" }}>{sel.name}</div>
                      <div className="sup-msg sup-msg-cust">{sel.message}</div>
                      <div className="sup-msg-time" style={{ textAlign:"left", color:"#9B8472" }}>{fmtTime(sel.createdAt)}</div>
                    </div>

                    {(sel.replies || []).map(r => (
                      <div key={r.id} style={{ alignSelf: r.from === "admin" ? "flex-end" : "flex-start", maxWidth:"75%" }}>
                        <div className="sup-msg-label" style={{ color: r.from === "admin" ? "#E8620A" : "#6B4C38", textAlign: r.from === "admin" ? "right" : "left" }}>
                          {r.name}
                        </div>
                        <div className={`sup-msg ${r.from === "admin" ? "sup-msg-admin" : "sup-msg-cust"}`}>
                          {r.message}
                          {r.images?.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop: r.message ? 8 : 0 }}>
                              {r.images.map((img, idx) => (
                                <a key={idx} href={img} target="_blank" rel="noreferrer"
                                  style={{ display:"block", borderRadius:7, overflow:"hidden",
                                    border:`2px solid ${r.from==="admin" ? "rgba(255,255,255,.3)" : "#EDE5DA"}` }}>
                                  <img src={img} alt={`attach-${idx+1}`}
                                    style={{ width:72, height:72, objectFit:"cover", display:"block" }}/>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="sup-msg-time" style={{ textAlign: r.from === "admin" ? "right" : "left", color: r.from === "admin" ? "rgba(232,98,10,.6)" : "#9B8472" }}>
                          {fmtTime(r.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Internal notes */}
                  <div style={{ marginTop:20, paddingTop:18, borderTop:"1px dashed #E8D5C0" }}>
                    <div style={{ fontSize:".75rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#9B8472", marginBottom:8 }}>
                      🔒 Internal Notes (not visible to customer)
                    </div>
                    <textarea className="sup-notes" rows={3} value={notes}
                      onChange={e => setNotes(e.target.value)}
                      onBlur={saveNotes}
                      placeholder="Add internal notes for the team…"/>
                  </div>
                </div>

                {/* Reply box */}
                {sel.status !== "closed" && (
                  <div className="sup-reply-area">
                    <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
                      placeholder={`Reply to ${sel.name}…  (This will be emailed to the customer)`}
                      onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") handleReply(); }}/>
                    <div className="sup-reply-actions">
                      <span style={{ fontSize:".75rem", color:"#9B8472" }}>Ctrl+Enter to send</span>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => handleStatusChange("resolved")} disabled={sending}
                          style={{ padding:"8px 16px", border:"1.5px solid #2D7D46", background:"#E8F5E9", color:"#2D7D46",
                            borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif" }}>
                          ✓ Mark Resolved
                        </button>
                        <button className="sup-send-btn" onClick={handleReply} disabled={!reply.trim() || sending}>
                          {sending ? "Sending…" : "Send Reply ✈"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {sel.status === "closed" && (
                  <div style={{ padding:"14px 20px", background:"#F5F5F5", textAlign:"center", color:"#9B8472", fontSize:".84rem", borderTop:"1px solid #E8E0D5" }}>
                    This ticket is closed.{" "}
                    <button onClick={() => handleStatusChange("open")}
                      style={{ color:"#E8620A", background:"none", border:"none", cursor:"pointer", fontWeight:700, fontSize:".84rem" }}>
                      Reopen
                    </button>
                  </div>
                )}
              </div>

              {/* ── Templates sidebar ── */}
              {showTpl && (
                <TemplatesPanel customerName={sel.name} onInsert={insertTemplate}/>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
