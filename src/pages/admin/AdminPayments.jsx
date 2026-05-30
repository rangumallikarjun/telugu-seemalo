import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getOrders } from "../../firebase/orderService";
import { fmt } from "../../utils/helpers";
import { db } from "../../firebase/config";

const DEFAULTS = {
  cod: {
    enabled: true,
    fee: 49,
    feeType: "flat",
    maxOrderValue: 5000,
    message: "Pay in cash when your order is delivered.",
  },
  razorpay: {
    enabled: true,
    mode: "test",
    keyId: "",
    keySecret: "",
    webhookSecret: "",
    autoCapture: true,
    upiEnabled: true,
    cardEnabled: true,
    netbankingEnabled: true,
    walletEnabled: true,
  },
};

export default function AdminPayments() {
  const [orders, setOrders]         = useState([]);
  const [ordersLoading, setOL]      = useState(true);
  const [settings, setSettings]     = useState(DEFAULTS);
  const [settingsLoading, setSL]    = useState(true);
  const [saved, setSaved]           = useState(false);
  const [activeTab, setActiveTab]   = useState("overview");
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [txFilter, setTxFilter]     = useState("all");

  const load = () => {
    setOL(true); setSL(true);
    getOrders().then(o => { setOrders(o); setOL(false); });
    getDoc(doc(db, "settings", "payments")).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          cod: { ...DEFAULTS.cod, ...(d.cod || {}) },
          razorpay: { ...DEFAULTS.razorpay, ...(d.razorpay || {}) },
        });
      }
      setSL(false);
    });
  };
  useEffect(() => { load(); }, []);

  const setCod = (k, v) => setSettings(s => ({ ...s, cod: { ...s.cod, [k]: v } }));
  const setRzp = (k, v) => setSettings(s => ({ ...s, razorpay: { ...s.razorpay, [k]: v } }));

  const handleSave = async () => {
    await setDoc(doc(db, "settings", "payments"), settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const revenue     = orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const rzpOrders   = orders.filter(o => o.paymentStatus === "paid");
  const codOrders   = orders.filter(o => !o.paymentStatus || o.paymentStatus === "cod");
  const walletOrders= orders.filter(o => o.paymentStatus === "wallet");
  const pending     = orders.filter(o => o.status === "Processing").length;

  const TABS = ["overview", "cod", "razorpay", "transactions"];

  if (ordersLoading || settingsLoading) return <div className="admin-loading">Loading payments…</div>;

  return (
    <div className="admin-content">
      {/* Stats row */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:24}}>
        {[
          { label:"Total Revenue",    value:fmt(revenue),                                             icon:"💰" },
          { label:"Razorpay (Online)",value:fmt(rzpOrders.reduce((s,o)=>s+(o.total||0),0)),          icon:"💳" },
          { label:"Cash on Delivery", value:fmt(codOrders.reduce((s,o)=>s+(o.total||0),0)),          icon:"🪙" },
          { label:"Wallet Payments",  value:fmt(walletOrders.reduce((s,o)=>s+(o.walletApplied||0),0)), icon:"💰" },
          { label:"Pending Payments", value:pending,                                                  icon:"⏳" },
        ].map(c => (
          <div key={c.label} className="admin-stat-card">
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-val">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"#F4EDE5",borderRadius:10,padding:4,width:"fit-content"}}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:".85rem",
              background: activeTab===t ? "#fff" : "transparent",
              color: activeTab===t ? "#E8620A" : "#6B4C38",
              boxShadow: activeTab===t ? "0 1px 4px rgba(0,0,0,.1)" : "none",
              textTransform:"capitalize",
            }}>
            {t === "cod" ? "Cash on Delivery" : t === "razorpay" ? "Razorpay" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <PaymentMethodCard
            icon="🪙" name="Cash on Delivery"
            enabled={settings.cod.enabled}
            onToggle={() => setCod("enabled", !settings.cod.enabled)}
            detail={`Fee: ${settings.cod.feeType === "flat" ? fmt(settings.cod.fee) : settings.cod.fee + "%"} · Max order: ${fmt(settings.cod.maxOrderValue)}`}
            onConfigure={() => setActiveTab("cod")}
          />
          <PaymentMethodCard
            icon="💳" name="Razorpay"
            enabled={settings.razorpay.enabled}
            onToggle={() => setRzp("enabled", !settings.razorpay.enabled)}
            detail={`Mode: ${settings.razorpay.mode.toUpperCase()} · UPI, Cards, Net Banking, Wallets`}
            onConfigure={() => setActiveTab("razorpay")}
          />
        </div>
      )}

      {/* COD tab */}
      {activeTab === "cod" && (
        <div className="admin-card" style={{maxWidth:600}}>
          <div className="admin-card-hd">
            <h3>🪙 Cash on Delivery</h3>
            <Toggle enabled={settings.cod.enabled} onToggle={() => setCod("enabled", !settings.cod.enabled)}/>
          </div>
          <div style={{padding:"8px 0 16px",opacity: settings.cod.enabled ? 1 : .5, pointerEvents: settings.cod.enabled ? "auto" : "none"}}>
            <div className="admin-form-grid">
              <div className="admin-inp-grp">
                <label>COD Fee Type</label>
                <select value={settings.cod.feeType} onChange={e => setCod("feeType", e.target.value)}>
                  <option value="flat">Flat amount (₹)</option>
                  <option value="percent">Percentage (%)</option>
                  <option value="none">No extra fee</option>
                </select>
              </div>
              {settings.cod.feeType !== "none" && (
                <div className="admin-inp-grp">
                  <label>{settings.cod.feeType === "flat" ? "COD Fee (₹)" : "COD Fee (%)"}</label>
                  <input type="number" value={settings.cod.fee} onChange={e => setCod("fee", +e.target.value)}/>
                </div>
              )}
              <div className="admin-inp-grp">
                <label>Max Order Value for COD (₹)</label>
                <input type="number" value={settings.cod.maxOrderValue} onChange={e => setCod("maxOrderValue", +e.target.value)}/>
              </div>
            </div>
            <div className="admin-inp-grp">
              <label>COD checkout message</label>
              <input value={settings.cod.message} onChange={e => setCod("message", e.target.value)}
                placeholder="Pay in cash when your order is delivered."/>
            </div>
          </div>
          <SaveRow onSave={handleSave} saved={saved}/>
        </div>
      )}

      {/* Razorpay tab */}
      {activeTab === "razorpay" && (
        <div className="admin-card" style={{maxWidth:640}}>
          <div className="admin-card-hd">
            <h3>💳 Razorpay</h3>
            <Toggle enabled={settings.razorpay.enabled} onToggle={() => setRzp("enabled", !settings.razorpay.enabled)}/>
          </div>
          <div style={{padding:"8px 0 16px", opacity: settings.razorpay.enabled ? 1 : .5, pointerEvents: settings.razorpay.enabled ? "auto" : "none"}}>

            <SectionLabel>Mode</SectionLabel>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              {["test","live"].map(m => (
                <button key={m} onClick={() => setRzp("mode", m)}
                  style={{padding:"8px 24px",borderRadius:8,border:"2px solid",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:".85rem",textTransform:"uppercase",
                    borderColor: settings.razorpay.mode===m ? "#E8620A" : "#E8D5C0",
                    background: settings.razorpay.mode===m ? "#E8620A" : "#fff",
                    color: settings.razorpay.mode===m ? "#fff" : "#6B4C38",
                  }}>
                  {m === "test" ? "🧪 Test" : "🚀 Live"}
                </button>
              ))}
            </div>
            {settings.razorpay.mode === "live" && (
              <div style={{background:"#FFF3DC",border:"1px solid #F0D080",borderRadius:8,padding:"10px 14px",fontSize:".83rem",color:"#B7770D",marginBottom:16}}>
                ⚠ You are in <strong>Live mode</strong>. Real money will be charged. Double-check your keys.
              </div>
            )}

            <SectionLabel>API Credentials ({settings.razorpay.mode} mode)</SectionLabel>
            <div className="admin-inp-grp">
              <label>Key ID</label>
              <input value={settings.razorpay.keyId} onChange={e => setRzp("keyId", e.target.value)}
                placeholder={settings.razorpay.mode === "test" ? "rzp_test_••••••••••••••••" : "rzp_live_••••••••••••••••"}/>
            </div>
            <div className="admin-inp-grp">
              <label>Key Secret</label>
              <div style={{position:"relative"}}>
                <input type={showSecret ? "text" : "password"} value={settings.razorpay.keySecret}
                  onChange={e => setRzp("keySecret", e.target.value)} placeholder="••••••••••••••••••••"
                  style={{paddingRight:48}}/>
                <button type="button" onClick={() => setShowSecret(s => !s)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:".85rem",color:"#6B4C38"}}>
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="admin-inp-grp">
              <label>Webhook Secret (optional)</label>
              <div style={{position:"relative"}}>
                <input type={showWebhook ? "text" : "password"} value={settings.razorpay.webhookSecret}
                  onChange={e => setRzp("webhookSecret", e.target.value)} placeholder="For payment verification webhook"
                  style={{paddingRight:48}}/>
                <button type="button" onClick={() => setShowWebhook(s => !s)}
                  style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:".85rem",color:"#6B4C38"}}>
                  {showWebhook ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <SectionLabel>Accepted Payment Methods</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                { key:"upiEnabled",          label:"UPI (GPay, PhonePe, Paytm, etc.)", icon:"📱" },
                { key:"cardEnabled",         label:"Debit & Credit Cards",              icon:"💳" },
                { key:"netbankingEnabled",   label:"Net Banking",                       icon:"🏦" },
                { key:"walletEnabled",       label:"Wallets (Paytm, Mobikwik, etc.)",   icon:"👛" },
              ].map(({ key, label, icon }) => (
                <label key={key} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".88rem"}}>
                  <input type="checkbox" checked={!!settings.razorpay[key]}
                    onChange={e => setRzp(key, e.target.checked)}/>
                  {icon} {label}
                </label>
              ))}
            </div>

            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".88rem",marginTop:14}}>
              <input type="checkbox" checked={!!settings.razorpay.autoCapture}
                onChange={e => setRzp("autoCapture", e.target.checked)}/>
              Auto-capture payment (recommended — captures payment immediately on success)
            </label>
          </div>
          <SaveRow onSave={handleSave} saved={saved}/>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === "transactions" && (() => {
        const filtered = orders.filter(o => {
          if (txFilter === "razorpay") return o.paymentStatus === "paid";
          if (txFilter === "wallet")   return o.paymentStatus === "wallet";
          if (txFilter === "cod")      return !o.paymentStatus || o.paymentStatus === "cod";
          return true;
        });

        return (
          <div className="admin-card">
            <div className="admin-card-hd">
              <h3>Transaction History ({filtered.length})</h3>
              <select value={txFilter} onChange={e => setTxFilter(e.target.value)}
                style={{padding:"6px 12px",border:"1.5px solid #E8D5C0",borderRadius:8,fontSize:".83rem",
                  fontFamily:"DM Sans,sans-serif",background:"#fff",cursor:"pointer",color:"#18100A"}}>
                <option value="all">All Methods</option>
                <option value="razorpay">💳 Razorpay</option>
                <option value="wallet">💰 Wallet</option>
                <option value="cod">🪙 COD</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className="admin-empty"><span>💳</span><p>No transactions found.</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Customer</th><th>Method</th>
                    <th>Payment ID</th><th>Amount</th><th>Payment Status</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => {
                    const isRzp    = o.paymentStatus === "paid";
                    const isWallet = o.paymentStatus === "wallet";

                    const methodLabel = isRzp    ? "💳 Razorpay"
                                      : isWallet ? "💰 Wallet"
                                                 : "🪙 COD";
                    const methodBg    = isRzp    ? "#EAF2FF"
                                      : isWallet ? "#F0FFF4"
                                                 : "#F4EDE5";
                    const methodClr   = isRzp    ? "#1A5276"
                                      : isWallet ? "#2D7D46"
                                                 : "#6B4C38";

                    const payStatusLabel = o.status === "Cancelled" ? "Refunded / Void"
                                         : isRzp    ? "Paid"
                                         : isWallet ? "Wallet"
                                                    : "COD – Pending";
                    const payStatusBg    = o.status === "Cancelled" ? "#FDECEA"
                                         : isRzp    ? "#E8F5EC"
                                         : isWallet ? "#F0FFF4"
                                                    : "#FFF3DC";
                    const payStatusClr   = o.status === "Cancelled" ? "#C0392B"
                                         : isRzp    ? "#2D7D46"
                                         : isWallet ? "#2D7D46"
                                                    : "#B7770D";

                    const walletAmt = o.walletApplied > 0
                      ? ` (${fmt(o.walletApplied)} wallet + ${fmt(o.amountToPay || 0)} online)`
                      : "";

                    return (
                      <tr key={o.docId}>
                        <td><strong>{o.id}</strong></td>
                        <td>
                          <div style={{fontWeight:600}}>{o.addr?.name || "—"}</div>
                          <div style={{fontSize:".72rem",color:"#6B4C38"}}>{o.addr?.city}</div>
                        </td>
                        <td>
                          <span style={{fontSize:".78rem",fontWeight:600,background:methodBg,color:methodClr,padding:"3px 9px",borderRadius:6}}>
                            {methodLabel}
                          </span>
                        </td>
                        <td style={{fontSize:".74rem",fontFamily:"monospace",color:"#5A4030"}}>
                          {o.razorpayPaymentId
                            ? <a href={`https://dashboard.razorpay.com/app/payments/${o.razorpayPaymentId}`}
                                target="_blank" rel="noreferrer"
                                style={{color:"#1A5276",textDecoration:"none",fontWeight:600}}>
                                {o.razorpayPaymentId}
                              </a>
                            : "—"}
                        </td>
                        <td>
                          <strong>{fmt(o.total)}</strong>
                          {walletAmt && <div style={{fontSize:".7rem",color:"#6B4C38"}}>{walletAmt}</div>}
                        </td>
                        <td>
                          <span style={{fontSize:".78rem",fontWeight:700,padding:"3px 9px",borderRadius:6,
                            background:payStatusBg,color:payStatusClr}}>
                            {payStatusLabel}
                          </span>
                        </td>
                        <td style={{fontSize:".78rem",color:"#6B4C38"}}>
                          {o.createdAt?.toDate
                            ? <>
                                <div>{o.createdAt.toDate().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>
                                <div style={{fontSize:".7rem",color:"#9B8472"}}>{o.createdAt.toDate().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                              </>
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function PaymentMethodCard({ icon, name, enabled, onToggle, detail, onConfigure }) {
  return (
    <div style={{border:`2px solid ${enabled ? "#E8620A" : "#E8D5C0"}`,borderRadius:12,padding:"20px 22px",background: enabled ? "#FDFAF7" : "#fff"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1.6rem"}}>{icon}</span>
          <div>
            <div style={{fontWeight:700,color:"#18100A"}}>{name}</div>
            <span style={{fontSize:".72rem",fontWeight:700,padding:"2px 8px",borderRadius:20,
              background: enabled ? "#E8F5EC" : "#F4EDE5",
              color: enabled ? "#2D7D46" : "#6B4C38"}}>
              {enabled ? "ACTIVE" : "DISABLED"}
            </span>
          </div>
        </div>
        <Toggle enabled={enabled} onToggle={onToggle}/>
      </div>
      <div style={{fontSize:".8rem",color:"#6B4C38",marginBottom:14}}>{detail}</div>
      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={onConfigure}>Configure →</button>
    </div>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",cursor:"pointer"}} onClick={onToggle}>
      <div style={{width:40,height:22,borderRadius:11,transition:"background .2s",background: enabled ? "#E8620A" : "#D1C5BB"}}/>
      <div style={{position:"absolute",left: enabled ? 20 : 2,width:18,height:18,borderRadius:"50%",background:"#fff",top:2,
        transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",
      marginBottom:12,marginTop:20,borderBottom:"1px solid #F0E8DF",paddingBottom:6}}>
      {children}
    </div>
  );
}

function SaveRow({ onSave, saved }) {
  return (
    <div style={{display:"flex",gap:12,alignItems:"center",marginTop:8}}>
      <button className="admin-btn admin-btn-primary" onClick={onSave}>Save Settings</button>
      {saved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved successfully!</span>}
    </div>
  );
}
