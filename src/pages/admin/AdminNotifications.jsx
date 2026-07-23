import { useState, useEffect } from "react";
import { createNotif, subscribeAllNotifs, findUserByEmail, deleteNotif } from "../../firebase/notifService";
import { getAllUsers } from "../../firebase/userService";
import { emailNotification } from "../../services/emailService";

const TYPES = [
  { id:"info",         icon:"ℹ️",  label:"Info" },
  { id:"order",        icon:"📦",  label:"Order" },
  { id:"promo",        icon:"🎁",  label:"Promo" },
  { id:"alert",        icon:"⚠️",  label:"Alert" },
  { id:"support",      icon:"💬",  label:"Support" },
  { id:"payment",      icon:"💳",  label:"Payment" },
  { id:"refund",       icon:"💰",  label:"Refund" },
  { id:"exchange",     icon:"🔄",  label:"Exchange" },
  { id:"announcement", icon:"📢",  label:"Announcement" },
  { id:"welcome",      icon:"🎉",  label:"Welcome" },
];

const LINK_OPTS = [
  { value:"",        label:"No link" },
  { value:"orders",  label:"→ Orders tab" },
  { value:"support", label:"→ Support tab" },
  { value:"wallet",  label:"→ Wallet tab" },
];

const TEMPLATES = [
  {
    cat: "🎯 Promotions",
    items: [
      { type:"promo", title:"Flash Sale — 20% Off!",       message:"Enjoy 20% off your next order! Use code SAVE20 at checkout. Valid for 48 hours only. Shop now before it expires!" },
      { type:"promo", title:"New Arrivals Are Here",        message:"We've added stunning new sarees and crafts to our collection. Be the first to explore and grab your favourites before they sell out!" },
      { type:"promo", title:"Exclusive Member Offer",       message:"As a valued member, you get early access to our Monsoon Sale. Use code MEMBER15 for an extra 15% off. Valid this weekend only!" },
      { type:"promo", title:"Free Shipping This Week",      message:"Order anything this week and get free standard shipping! No minimum order value. Limited time offer." },
    ],
  },
  {
    cat: "📢 Announcements",
    items: [
      { type:"announcement", title:"Scheduled Maintenance",        message:"Our website will be undergoing maintenance on Sunday from 2 AM – 4 AM IST. Some features may be temporarily unavailable. We apologise for any inconvenience." },
      { type:"announcement", title:"New Collection Launching Soon", message:"We're excited to announce our new festive collection launching next week! Stay tuned for exclusive early-bird offers." },
      { type:"announcement", title:"Policy Update",                 message:"We've updated our return and refund policy. Please review the changes in our Terms & Conditions. The new policy is effective immediately." },
      { type:"announcement", title:"App Update Available",          message:"A new version of our experience is live with improved performance and new features. Clear your browser cache to get the latest version." },
    ],
  },
  {
    cat: "💰 Refunds & Payments",
    items: [
      { type:"refund",  title:"Refund Processed",         message:"Good news! Your refund has been processed successfully and will reflect in your original payment method within 5–7 business days." },
      { type:"refund",  title:"Refund Under Review",      message:"Your refund request is under review. Our team will process it within 2–3 business days. You'll be notified once it's approved." },
      { type:"payment", title:"Payment Confirmed",        message:"Your payment has been received and confirmed. Your order is now being processed." },
      { type:"payment", title:"Payment Issue Detected",   message:"We noticed an issue with your recent payment. Please check your payment method and try again, or contact our support team for help." },
    ],
  },
  {
    cat: "📦 Order Updates",
    items: [
      { type:"order", title:"Order Being Packed",         message:"Great news! Your order is being carefully packed and will be shipped very soon. We'll notify you with tracking details once it's on its way.", link:"orders" },
      { type:"order", title:"Delivery Attempted",         message:"Our delivery partner attempted to deliver your order but couldn't reach you. A re-delivery will be attempted tomorrow. Please ensure someone is available.", link:"orders" },
      { type:"alert", title:"Action Required on Order",   message:"Your order requires attention. Please log in and check your orders section for details or contact our support team.", link:"orders" },
    ],
  },
  {
    cat: "ℹ️ General",
    items: [
      { type:"info",  title:"Account Update",             message:"Your account details have been successfully updated." },
      { type:"alert", title:"Security Alert",             message:"We noticed unusual activity on your account. If this wasn't you, please change your password immediately and contact support." },
      { type:"info",  title:"Thank You for Your Review",  message:"Thank you for taking the time to review your purchase! Your feedback helps us serve you better." },
    ],
  },
];

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.id, t]));

const fmtTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" }) + " · " +
         d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
};

const inputSt = { width:"100%", padding:"9px 12px", border:"1.5px solid #E8DDD3", borderRadius:9,
  fontSize:".88rem", fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box", background:"#fff" };
const labelSt = { fontSize:".75rem", fontWeight:700, textTransform:"uppercase",
  letterSpacing:".06em", color:"#6B4C38", display:"block", marginBottom:5 };

export default function AdminNotifications() {
  const [notifs,        setNotifs]        = useState([]);
  const [form,          setForm]          = useState({ recipient:"all", email:"", type:"info", title:"", message:"", link:"", sendEmail:false });
  const [sending,       setSending]       = useState(false);
  const [lookingUp,     setLookingUp]     = useState(false);
  const [recipientUser, setRecipientUser] = useState(null);
  const [emailErr,      setEmailErr]      = useState("");
  const [success,       setSuccess]       = useState(false);
  const [activeCat,     setActiveCat]     = useState(0);
  const [filterType,    setFilterType]    = useState("all");

  useEffect(() => subscribeAllNotifs(setNotifs), []);

  const lookupEmail = async () => {
    if (!form.email.trim()) return;
    setLookingUp(true); setEmailErr(""); setRecipientUser(null);
    const u = await findUserByEmail(form.email);
    if (!u) setEmailErr("No account found with that email.");
    else setRecipientUser(u);
    setLookingUp(false);
  };

  const applyTemplate = (t) =>
    setForm(f => ({ ...f, type: t.type, title: t.title, message: t.message, link: t.link || "" }));

  const send = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    if (form.recipient === "user" && !recipientUser) return;
    const who = form.recipient === "all" ? "all customers" : (recipientUser.name || recipientUser.email);
    if (!window.confirm(`Send this notification to ${who}?`)) return;
    setSending(true);

    const uid   = form.recipient === "all" ? "all" : recipientUser.uid;
    const email = form.recipient === "all" ? null  : recipientUser.email;
    const name  = form.recipient === "all" ? null  : (recipientUser.name || "");

    await createNotif({
      userId:         uid,
      type:           form.type,
      title:          form.title.trim(),
      message:        form.message.trim(),
      link:           form.link || null,
      recipientEmail: email,
      sentByAdmin:    true,
    });

    if (form.sendEmail) {
      if (form.recipient === "all") {
        getAllUsers().then(users => {
          users.filter(u => u.role !== "admin" && u.email).forEach(u =>
            emailNotification({ to_email: u.email, to_name: u.name || "", title: form.title.trim(), message: form.message.trim() }).catch(() => {})
          );
        }).catch(() => {});
      } else if (email) {
        emailNotification({ to_email: email, to_name: name, title: form.title.trim(), message: form.message.trim() }).catch(() => {});
      }
    }

    setForm(f => ({ ...f, title:"", message:"", email:"", link:"", sendEmail:false }));
    setRecipientUser(null);
    setSending(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const canSend = form.title && form.message && (form.recipient === "all" || recipientUser);
  const filtered = filterType === "all" ? notifs : notifs.filter(n => n.type === filterType);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"400px 1fr", gap:24, alignItems:"start" }}>

      {/* ── Compose panel ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <h3 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"1.25rem", marginBottom:4 }}>Send Notification</h3>
        <p style={{ fontSize:".82rem", color:"#9B8472", marginBottom:18 }}>Push in-app notifications and emails to customers</p>

        {/* Quick templates by category */}
        <div style={{ marginBottom:18 }}>
          <span style={labelSt}>Quick Templates</span>
          {/* Category tabs */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
            {TEMPLATES.map((cat, i) => (
              <button key={i} onClick={() => setActiveCat(i)}
                style={{ padding:"4px 10px", borderRadius:16, border:"1.5px solid",
                  borderColor: activeCat === i ? "#E8620A" : "#E8DDD3",
                  background:  activeCat === i ? "#FFF3EB" : "none",
                  color:       activeCat === i ? "#E8620A" : "#6B4C38",
                  fontSize:".72rem", fontWeight: activeCat === i ? 700 : 400,
                  cursor:"pointer", fontFamily:"DM Sans,sans-serif", whiteSpace:"nowrap" }}>
                {cat.cat}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:140, overflowY:"auto" }}>
            {TEMPLATES[activeCat].items.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t)}
                style={{ padding:"7px 11px", border:"1.5px solid #E8DDD3", borderRadius:8, background:"#FFF8F3",
                  cursor:"pointer", textAlign:"left", fontSize:".8rem", color:"var(--dk)",
                  fontFamily:"DM Sans,sans-serif", transition:"background .15s, border-color .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#E8620A"; e.currentTarget.style.background="#FFF0E5"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#E8DDD3"; e.currentTarget.style.background="#FFF8F3"; }}>
                {TYPE_MAP[t.type]?.icon} {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom:14 }}>
          <span style={labelSt}>Send To</span>
          <div style={{ display:"flex", gap:8, marginBottom: form.recipient === "user" ? 10 : 0 }}>
            {[["all","🌐 All Customers"],["user","👤 Specific Customer"]].map(([v,l]) => (
              <button key={v} type="button"
                onClick={() => { setForm(f=>({...f,recipient:v,email:""})); setRecipientUser(null); setEmailErr(""); }}
                style={{ flex:1, padding:"8px 6px", borderRadius:8, border:"1.5px solid",
                  borderColor: form.recipient===v ? "var(--sf)" : "#E8DDD3",
                  background:  form.recipient===v ? "#FFF3EB" : "#fff",
                  color:       form.recipient===v ? "#E8620A" : "#6B4C38",
                  fontSize:".8rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                {l}
              </button>
            ))}
          </div>
          {form.recipient === "user" && (
            <>
              <div style={{ display:"flex", gap:8 }}>
                <input style={{ ...inputSt, flex:1 }} placeholder="customer@email.com"
                  value={form.email}
                  onChange={e => { setForm(f=>({...f,email:e.target.value})); setRecipientUser(null); setEmailErr(""); }}
                  onKeyDown={e => e.key === "Enter" && lookupEmail()}/>
                <button onClick={lookupEmail} disabled={!form.email || lookingUp}
                  style={{ padding:"9px 14px", borderRadius:9, border:"1.5px solid #E8DDD3", background:"#FFF8F3",
                    cursor:"pointer", fontSize:".82rem", color:"#E8620A", fontFamily:"DM Sans,sans-serif",
                    whiteSpace:"nowrap", opacity:(!form.email||lookingUp)?0.6:1 }}>
                  {lookingUp ? "…" : "Find"}
                </button>
              </div>
              {emailErr      && <div style={{ fontSize:".78rem", color:"#C0392B", marginTop:5 }}>{emailErr}</div>}
              {recipientUser && <div style={{ fontSize:".78rem", color:"#2D7D46", marginTop:5 }}>✅ {recipientUser.name || recipientUser.email}</div>}
            </>
          )}
        </div>

        {/* Type */}
        <div style={{ marginBottom:14 }}>
          <span style={labelSt}>Type</span>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => setForm(f=>({...f,type:t.id}))}
                style={{ padding:"4px 10px", borderRadius:16, border:"1.5px solid",
                  borderColor: form.type===t.id ? "var(--sf)" : "#E8DDD3",
                  background:  form.type===t.id ? "var(--sf)" : "#fff",
                  color:       form.type===t.id ? "#fff" : "#6B4C38",
                  fontSize:".75rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Link */}
        <div style={{ marginBottom:14 }}>
          <label style={labelSt}>Navigate to (when tapped)</label>
          <select value={form.link} onChange={e => setForm(f=>({...f,link:e.target.value}))}
            style={{ ...inputSt, appearance:"auto" }}>
            {LINK_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Title */}
        <div style={{ marginBottom:12 }}>
          <label style={labelSt}>Title *</label>
          <input style={inputSt} placeholder="Notification title"
            value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}/>
        </div>

        {/* Message */}
        <div style={{ marginBottom:14 }}>
          <label style={labelSt}>Message *</label>
          <textarea style={{ ...inputSt, resize:"vertical", minHeight:90 }}
            placeholder="Write your message…"
            value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}/>
        </div>

        {/* Also send email toggle */}
        {(form.recipient === "all" || (form.recipient === "user" && recipientUser)) && (
          <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, cursor:"pointer", fontSize:".83rem", color:"#6B4C38" }}>
            <input type="checkbox" checked={form.sendEmail}
              onChange={e => setForm(f=>({...f,sendEmail:e.target.checked}))}
              style={{ width:16, height:16, accentColor:"#E8620A" }}/>
            {form.recipient === "all"
              ? "Also send email to all customers"
              : `Also send an email to ${recipientUser?.email}`}
          </label>
        )}

        {success && (
          <div style={{ background:"#E8F5EC", color:"#2D7D46", borderRadius:8, padding:"9px 14px", fontSize:".84rem", marginBottom:12 }}>
            ✅ Notification sent successfully!
          </div>
        )}
        <button onClick={send} disabled={!canSend || sending}
          style={{ width:"100%", padding:"11px", borderRadius:10, border:"none",
            background: canSend && !sending ? "linear-gradient(135deg,#E8620A,#C9901A)" : "#E8DDD3",
            color: canSend && !sending ? "#fff" : "#9B8472",
            fontSize:".9rem", fontWeight:700, cursor: canSend && !sending ? "pointer" : "not-allowed",
            fontFamily:"DM Sans,sans-serif", transition:"all .2s" }}>
          {sending ? "Sending…" : "🔔 Send Notification"}
        </button>
      </div>

      {/* ── History panel ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <h3 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"1.25rem", margin:0 }}>Sent Notifications</h3>
          <span style={{ fontSize:".82rem", color:"#9B8472" }}>{notifs.length} total</span>
        </div>

        {/* Type filter */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:16 }}>
          <button onClick={() => setFilterType("all")}
            style={{ padding:"4px 12px", borderRadius:16, border:"1.5px solid",
              borderColor: filterType==="all" ? "var(--sf)" : "#E8DDD3",
              background:  filterType==="all" ? "var(--sf)" : "none",
              color:       filterType==="all" ? "#fff" : "#6B4C38",
              fontSize:".75rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
            All ({notifs.length})
          </button>
          {TYPES.filter(t => notifs.some(n => n.type === t.id)).map(t => (
            <button key={t.id} onClick={() => setFilterType(t.id)}
              style={{ padding:"4px 10px", borderRadius:16, border:"1.5px solid",
                borderColor: filterType===t.id ? "var(--sf)" : "#E8DDD3",
                background:  filterType===t.id ? "var(--sf)" : "none",
                color:       filterType===t.id ? "#fff" : "#6B4C38",
                fontSize:".75rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              {t.icon} {t.label} ({notifs.filter(n=>n.type===t.id).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"#9B8472" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:10 }}>🔔</div>
            <p style={{ fontSize:".88rem" }}>{notifs.length === 0 ? "No notifications sent yet" : "No notifications of this type"}</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:600, overflowY:"auto" }}>
            {filtered.map(n => {
              const t = TYPE_MAP[n.type] || TYPE_MAP.info;
              return (
                <div key={n.id} style={{ border:"1px solid #EDE5DA", borderRadius:10, padding:"12px 14px",
                  display:"flex", alignItems:"flex-start", gap:12,
                  borderLeft:`3px solid ${t.bg}` }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:t.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:".95rem", flexShrink:0 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:".88rem", color:"#2C1A0E", marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:".79rem", color:"#6B4C38", marginBottom:7, lineHeight:1.4 }}>{n.message}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:".72rem",
                        background: n.userId==="all" ? "#E3F2FD" : "#FFF3DC",
                        color: n.userId==="all" ? "#1565C0" : "#B7770D",
                        padding:"2px 8px", borderRadius:10, fontWeight:600 }}>
                        {n.userId==="all" ? "🌐 All customers" : `👤 ${n.recipientEmail || n.userId}`}
                      </span>
                      <span style={{ fontSize:".72rem", background:t.bg, color:t.color, padding:"2px 8px", borderRadius:10, fontWeight:600 }}>
                        {t.icon} {t.label}
                      </span>
                      {n.link && (
                        <span style={{ fontSize:".72rem", color:"#9B8472" }}>→ {n.link}</span>
                      )}
                      <span style={{ fontSize:".72rem", color:"#9B8472" }}>{fmtTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => { if (window.confirm("Delete this notification from history?")) deleteNotif(n.id); }}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#C0392B",
                      fontSize:"1.1rem", padding:0, flexShrink:0, lineHeight:1, opacity:.5 }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
