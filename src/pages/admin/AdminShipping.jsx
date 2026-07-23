import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase/config";
const _testSR = httpsCallable(getFunctions(app), "shiprocketTestLogin");

const CARRIERS = [
  {
    id: "shiprocket",
    name: "Shiprocket",
    icon: "🚀",
    desc: "Multi-carrier aggregator — Bluedart, Delhivery, Ekart, DTDC & more",
    fields: [
      { key: "email",    label: "Account Email",   type: "email",    placeholder: "you@example.com" },
      { key: "password", label: "Account Password", type: "password", placeholder: "••••••••" },
      { key: "channelId",label: "Channel ID",       type: "text",     placeholder: "123456" },
    ],
  },
  {
    id: "delhivery",
    name: "Delhivery",
    icon: "📦",
    desc: "Direct Delhivery API — pan-India express & surface",
    fields: [
      { key: "apiToken",  label: "API Token",     type: "password", placeholder: "••••••••••••••••" },
      { key: "warehouseId", label: "Warehouse ID", type: "text",    placeholder: "WHOUSE001" },
    ],
  },
  {
    id: "easyship",
    name: "Easyship",
    icon: "✈️",
    desc: "International + domestic multi-carrier shipping platform",
    fields: [
      { key: "apiKey",    label: "API Key",         type: "password", placeholder: "••••••••••••••••" },
      { key: "accountId",label: "Account ID",       type: "text",     placeholder: "ACC-XXXXXXXX" },
    ],
  },
  {
    id: "indiapost",
    name: "India Post",
    icon: "🏛️",
    desc: "India Post Speed Post & registered post — widest pin-code coverage",
    fields: [
      { key: "customerId", label: "Customer ID",   type: "text", placeholder: "IPPT00000" },
      { key: "licenceKey", label: "Licence Key",   type: "password", placeholder: "••••••••" },
    ],
  },
];

const DEFAULT_CARRIER_STATE = (id) => ({
  enabled: false,
  ...Object.fromEntries(CARRIERS.find(c => c.id === id).fields.map(f => [f.key, ""])),
});

const DEFAULTS = {
  // Shipping rates (used at checkout)
  standardFee: 99,
  expressFee: 149,
  freeAbove: 999,
  enableFreeShipping: true,
  enableExpress: true,
  standardDays: "5–7",
  expressDays: "2–3",
  // Carrier integrations
  defaultCarrier: "shiprocket",
  autoAssign: true,
  trackingEnabled: true,
  carriers: Object.fromEntries(CARRIERS.map(c => [c.id, DEFAULT_CARRIER_STATE(c.id)])),
  zones: { domestic: true, international: false },
};

export default function AdminShipping() {
  const [form, setForm]         = useState(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [testing, setTesting]   = useState(null);
  const [testMsg, setTestMsg]   = useState({});

  const load = () => {
    setLoading(true);
    getDoc(doc(db, "settings", "shipping")).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setForm(prev => ({
          ...prev,
          ...data,
          carriers: { ...prev.carriers, ...(data.carriers || {}) },
        }));
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const setCarrier = (id, key, val) =>
    setForm(f => ({ ...f, carriers: { ...f.carriers, [id]: { ...f.carriers[id], [key]: val } } }));

  const toggleCarrier = (id) =>
    setCarrier(id, "enabled", !form.carriers[id]?.enabled);

  const handleTest = async (id) => {
    setTesting(id);
    try {
      if (id === "shiprocket") {
        const cfg = form.carriers.shiprocket;
        if (!cfg?.email || !cfg?.password) throw new Error("Fill email and password first");
        await _testSR({ email: cfg.email, password: cfg.password });
        setTestMsg(prev => ({ ...prev, [id]: "✓ ShipRocket login successful!" }));
      } else {
        const hasKey = CARRIERS.find(c => c.id === id).fields.every(f => form.carriers[id]?.[f.key]);
        setTestMsg(prev => ({ ...prev, [id]: hasKey ? "✓ Connected successfully" : "✗ Missing credentials — fill all fields first" }));
      }
    } catch (err) {
      const msg = err.message || "Connection failed";
      setTestMsg(prev => ({ ...prev, [id]: `✗ ${msg}` }));
    }
    setTesting(null);
    setTimeout(() => setTestMsg(prev => { const n = {...prev}; delete n[id]; return n; }), 5000);
  };

  const handleSave = async () => {
    if (!window.confirm("Save changes to shipping settings? This will update live checkout rates.")) return;
    await setDoc(doc(db, "settings", "shipping"), form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="admin-loading">Loading shipping settings…</div>;

  return (
    <div className="admin-content">

      {/* ── Shipping Rates ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Shipping Rates & Delivery Times</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Applied live at checkout</span>
        </div>
        <div style={{padding:"12px 0 20px"}}>

          {/* Free shipping toggle + threshold */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:"12px 16px",background:"#F8F4F0",borderRadius:10}}>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".9rem",fontWeight:600,flex:1}}>
              <input type="checkbox" checked={!!form.enableFreeShipping}
                onChange={e => setForm(f => ({...f, enableFreeShipping: e.target.checked}))}/>
              Enable Free Shipping
            </label>
            {form.enableFreeShipping && (
              <div className="admin-inp-grp" style={{margin:0,minWidth:220}}>
                <label>Free shipping on orders above (₹)</label>
                <input type="number" value={form.freeAbove} min={0}
                  onChange={e => setForm(f => ({...f, freeAbove: +e.target.value}))}
                  style={{padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
            )}
          </div>

          {/* Standard + Express side by side */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>

            {/* Standard */}
            <div style={{border:"1.5px solid #E8D5C0",borderRadius:10,padding:"16px 18px"}}>
              <div style={{fontWeight:700,fontSize:".95rem",marginBottom:14,color:"#18100A",display:"flex",alignItems:"center",gap:8}}>
                📦 Standard Delivery
              </div>
              <div className="admin-inp-grp">
                <label>Delivery Fee (₹)</label>
                <input type="number" value={form.standardFee} min={0}
                  onChange={e => setForm(f => ({...f, standardFee: +e.target.value}))}
                  style={{padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div className="admin-inp-grp" style={{marginBottom:0}}>
                <label>Estimated Days (shown at checkout)</label>
                <input value={form.standardDays}
                  onChange={e => setForm(f => ({...f, standardDays: e.target.value}))}
                  placeholder="e.g. 5–7"
                  style={{padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
            </div>

            {/* Express */}
            <div style={{border:`1.5px solid ${form.enableExpress ? "#E8620A" : "#E8D5C0"}`,borderRadius:10,padding:"16px 18px",
              background: form.enableExpress ? "#FDFAF7" : "#F8F4F0",opacity: form.enableExpress ? 1 : .75}}>
              <div style={{fontWeight:700,fontSize:".95rem",marginBottom:14,color:"#18100A",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>⚡ Express Delivery</span>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontWeight:600,fontSize:".82rem"}}>
                  <input type="checkbox" checked={!!form.enableExpress}
                    onChange={e => setForm(f => ({...f, enableExpress: e.target.checked}))}/>
                  Enabled
                </label>
              </div>
              <div className="admin-inp-grp" style={{opacity: form.enableExpress ? 1 : .5, pointerEvents: form.enableExpress ? "auto" : "none"}}>
                <label>Delivery Fee (₹)</label>
                <input type="number" value={form.expressFee} min={0}
                  onChange={e => setForm(f => ({...f, expressFee: +e.target.value}))}
                  style={{padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div className="admin-inp-grp" style={{marginBottom:0,opacity: form.enableExpress ? 1 : .5, pointerEvents: form.enableExpress ? "auto" : "none"}}>
                <label>Estimated Days (shown at checkout)</label>
                <input value={form.expressDays}
                  onChange={e => setForm(f => ({...f, expressDays: e.target.value}))}
                  placeholder="e.g. 2–3"
                  style={{padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div style={{marginTop:16,background:"#FFF3ED",borderRadius:9,padding:"10px 16px",fontSize:".82rem",color:"#6B4C38"}}>
            <strong style={{color:"#18100A"}}>Checkout preview: </strong>
            Standard — {form.standardDays} days · ₹{form.standardFee}
            {form.enableExpress && ` | Express — ${form.expressDays} days · ₹${form.expressFee}`}
            {form.enableFreeShipping && ` | Free standard on orders above ₹${form.freeAbove}`}
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center",marginTop:16}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>Save Shipping Rates</button>
            {saved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* General settings */}
      <div className="admin-card" style={{marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>General Shipping Settings</h3>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
        </div>
        <div style={{padding:"8px 0 16px"}}>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Default / Primary Carrier</label>
              <select value={form.defaultCarrier} onChange={e => setForm(f => ({...f, defaultCarrier: e.target.value}))}>
                {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:4}}>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".88rem"}}>
              <input type="checkbox" checked={!!form.autoAssign}
                onChange={e => setForm(f => ({...f, autoAssign: e.target.checked}))}/>
              Auto-assign best carrier based on pin-code & weight
            </label>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".88rem"}}>
              <input type="checkbox" checked={!!form.trackingEnabled}
                onChange={e => setForm(f => ({...f, trackingEnabled: e.target.checked}))}/>
              Send tracking updates to customers via email/SMS
            </label>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:".88rem"}}>
              <input type="checkbox" checked={!!form.zones?.international}
                onChange={e => setForm(f => ({...f, zones: {...f.zones, international: e.target.checked}}))}/>
              Enable international shipping
            </label>
          </div>
        </div>
      </div>

      {/* Carrier integrations */}
      <div className="admin-card">
        <div className="admin-card-hd"><h3>Carrier Integrations</h3></div>
        <div style={{padding:"4px 0 16px",display:"flex",flexDirection:"column",gap:12}}>
          {CARRIERS.map(carrier => {
            const cfg = form.carriers[carrier.id] || {};
            const isExpanded = expanded === carrier.id;
            return (
              <div key={carrier.id} style={{border:"1.5px solid #E8D5C0",borderRadius:10,overflow:"hidden",background: cfg.enabled ? "#FDFAF7" : "#fff"}}>
                {/* Carrier header row */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer"}}
                  onClick={() => setExpanded(isExpanded ? null : carrier.id)}>
                  <span style={{fontSize:"1.4rem"}}>{carrier.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"#18100A"}}>{carrier.name}</div>
                    <div style={{fontSize:".78rem",color:"#6B4C38",marginTop:2}}>{carrier.desc}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    {cfg.enabled && (
                      <span style={{fontSize:".72rem",fontWeight:700,background:"#E8F5EC",color:"#2D7D46",padding:"3px 10px",borderRadius:20}}>
                        ACTIVE
                      </span>
                    )}
                    <div style={{position:"relative",display:"inline-flex",alignItems:"center",cursor:"pointer"}}
                      onClick={e => { e.stopPropagation(); toggleCarrier(carrier.id); }}>
                      <div style={{
                        width:40, height:22, borderRadius:11, transition:"background .2s",
                        background: cfg.enabled ? "#E8620A" : "#D1C5BB",
                      }}/>
                      <div style={{
                        position:"absolute", left: cfg.enabled ? 20 : 2, width:18, height:18,
                        borderRadius:"50%", background:"#fff", top:2, transition:"left .2s",
                        boxShadow:"0 1px 3px rgba(0,0,0,.2)",
                      }}/>
                    </div>
                    <span style={{fontSize:".8rem",color:"#6B4C38",transition:"transform .2s",display:"inline-block",transform: isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                  </div>
                </div>

                {/* Expanded config */}
                {isExpanded && (
                  <div style={{borderTop:"1px solid #E8D5C0",padding:"16px 18px",background:"#fff"}}>
                    <div className="admin-form-grid">
                      {carrier.fields.map(f => (
                        <div key={f.key} className="admin-inp-grp">
                          <label>{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder}
                            value={cfg[f.key] || ""}
                            onChange={e => setCarrier(carrier.id, f.key, e.target.value)}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}>
                      <button className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => handleTest(carrier.id)}
                        disabled={testing === carrier.id}>
                        {testing === carrier.id ? "Testing…" : "Test Connection"}
                      </button>
                      {testMsg[carrier.id] && (
                        <span style={{fontSize:".83rem",fontWeight:600,color: testMsg[carrier.id].startsWith("✓") ? "#2D7D46" : "#C0392B"}}>
                          {testMsg[carrier.id]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:"flex",gap:12,alignItems:"center",marginTop:20}}>
        <button className="admin-btn admin-btn-primary" onClick={handleSave}>Save All Settings</button>
        {saved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved successfully!</span>}
      </div>
    </div>
  );
}
