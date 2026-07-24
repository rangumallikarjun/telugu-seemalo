import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { DEFAULT_TERMS_ITEMS, DEFAULT_SHIPPING_ITEMS, DEFAULT_RETURN_ITEMS, DEFAULT_PRIVACY_ITEMS } from "../PolicyPage";

const TERMS_DEFAULTS    = { items: DEFAULT_TERMS_ITEMS };
const SHIPPING_POLICY_DEFAULTS = { items: DEFAULT_SHIPPING_ITEMS };
const RETURN_POLICY_DEFAULTS   = { items: DEFAULT_RETURN_ITEMS };
const PRIVACY_POLICY_DEFAULTS  = { items: DEFAULT_PRIVACY_ITEMS };

function PolicyListEditor({ title, subtitle, items, handlers, onSave, saved, onRefresh }) {
  return (
    <div className="admin-card" style={{maxWidth:820,marginBottom:20}}>
      <div className="admin-card-hd">
        <h3>{title} <span style={{fontWeight:500,fontSize:".78rem",color:"#9B8472",textTransform:"none",letterSpacing:0}}>({items.length} items)</span></h3>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>{subtitle}</span>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={onRefresh}>↺ Refresh</button>
        </div>
      </div>
      <div style={{padding:"8px 0 20px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {items.map((text, i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{flexShrink:0,width:26,height:26,borderRadius:"50%",background:"#F4EDE5",color:"#6B4C38",
                display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:".75rem",marginTop:4}}>
                {i + 1}
              </span>
              <textarea rows={2} value={text} onChange={e => handlers.setItem(i, e.target.value)}
                style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                  fontFamily:"DM Sans,sans-serif",fontSize:".85rem",resize:"vertical"}}/>
              <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === 0} onClick={() => handlers.move(i, -1)}>↑</button>
                <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === items.length - 1} onClick={() => handlers.move(i, 1)}>↓</button>
              </div>
              <button onClick={() => handlers.remove(i)} disabled={items.length <= 1}
                style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                  cursor: items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".8rem",
                  opacity: items.length <= 1 ? .5 : 1,flexShrink:0,alignSelf:"flex-start"}}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={handlers.add}
          style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
            cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
            fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
          + Add Item
        </button>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <button className="admin-btn admin-btn-primary" onClick={onSave}>Save {title}</button>
          {saved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminPolicies() {
  const [terms, setTerms]                 = useState(TERMS_DEFAULTS);
  const [shippingPolicy, setShippingPolicy] = useState(SHIPPING_POLICY_DEFAULTS);
  const [returnPolicy, setReturnPolicy]     = useState(RETURN_POLICY_DEFAULTS);
  const [privacyPolicy, setPrivacyPolicy]   = useState(PRIVACY_POLICY_DEFAULTS);
  const [termsSaved, setTermsSaved]                   = useState(false);
  const [shippingPolicySaved, setShippingPolicySaved] = useState(false);
  const [returnPolicySaved, setReturnPolicySaved]     = useState(false);
  const [privacyPolicySaved, setPrivacyPolicySaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "settings", "termsPolicy")),
      getDoc(doc(db, "settings", "shippingPolicy")),
      getDoc(doc(db, "settings", "returnPolicy")),
      getDoc(doc(db, "settings", "privacyPolicy")),
    ]).then(([termsSnap, shipPolSnap, retPolSnap, privacyPolSnap]) => {
      if (termsSnap.exists()) {
        const data = termsSnap.data();
        setTerms({ items: data.items?.length ? data.items : TERMS_DEFAULTS.items });
      }
      if (shipPolSnap.exists()) {
        const data = shipPolSnap.data();
        setShippingPolicy({ items: data.items?.length ? data.items : SHIPPING_POLICY_DEFAULTS.items });
      }
      if (retPolSnap.exists()) {
        const data = retPolSnap.data();
        setReturnPolicy({ items: data.items?.length ? data.items : RETURN_POLICY_DEFAULTS.items });
      }
      if (privacyPolSnap.exists()) {
        const data = privacyPolSnap.data();
        setPrivacyPolicy({ items: data.items?.length ? data.items : PRIVACY_POLICY_DEFAULTS.items });
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // Generic handlers for simple numbered-text-list policy pages (Terms, Shipping, Return, Privacy)
  const makeListHandlers = (setState) => ({
    setItem: (i, v) => setState(s => ({ ...s, items: s.items.map((x, j) => j === i ? v : x) })),
    add:     ()     => setState(s => ({ ...s, items: [...s.items, "New item"] })),
    remove:  (i)     => setState(s => s.items.length <= 1 ? s : ({ ...s, items: s.items.filter((_, j) => j !== i) })),
    move:    (i, dir) => setState(s => {
      const j = i + dir;
      if (j < 0 || j >= s.items.length) return s;
      const arr = [...s.items];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, items: arr };
    }),
  });
  const termsH   = makeListHandlers(setTerms);
  const shipPolH = makeListHandlers(setShippingPolicy);
  const retPolH  = makeListHandlers(setReturnPolicy);
  const privacyPolH = makeListHandlers(setPrivacyPolicy);

  const savePolicy = async (docName, data, setSavedFlag, label) => {
    if (!window.confirm(`Save changes to ${label}? This will update the live site.`)) return;
    await setDoc(doc(db, "settings", docName), data);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 2500);
  };

  if (loading) return <div className="admin-loading">Loading policies…</div>;

  return (
    <div className="admin-content admin-settings-grid">
      <PolicyListEditor title="Terms & Conditions" subtitle="Public page: /terms"
        items={terms.items} handlers={termsH} saved={termsSaved} onRefresh={load}
        onSave={() => savePolicy("termsPolicy", terms, setTermsSaved, "Terms & Conditions")}/>

      <PolicyListEditor title="Data & Privacy" subtitle="Section on: /terms (below Terms & Conditions)"
        items={privacyPolicy.items} handlers={privacyPolH} saved={privacyPolicySaved} onRefresh={load}
        onSave={() => savePolicy("privacyPolicy", privacyPolicy, setPrivacyPolicySaved, "Data & Privacy")}/>

      <PolicyListEditor title="Shipping Policy" subtitle="Public page: /shipping-policy"
        items={shippingPolicy.items} handlers={shipPolH} saved={shippingPolicySaved} onRefresh={load}
        onSave={() => savePolicy("shippingPolicy", shippingPolicy, setShippingPolicySaved, "Shipping Policy")}/>

      <PolicyListEditor title="Return Policy" subtitle="Public page: /return-policy"
        items={returnPolicy.items} handlers={retPolH} saved={returnPolicySaved} onRefresh={load}
        onSave={() => savePolicy("returnPolicy", returnPolicy, setReturnPolicySaved, "Return Policy")}/>
    </div>
  );
}
