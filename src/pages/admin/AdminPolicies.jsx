import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { DEFAULT_TERMS_SECTIONS, DEFAULT_SHIPPING_SECTIONS, DEFAULT_RETURN_SECTIONS, DEFAULT_PRIVACY_SECTIONS } from "../PolicyPage";

const TERMS_DEFAULTS    = { lastUpdated: "", sections: DEFAULT_TERMS_SECTIONS };
const SHIPPING_POLICY_DEFAULTS = { lastUpdated: "", sections: DEFAULT_SHIPPING_SECTIONS };
const RETURN_POLICY_DEFAULTS   = { lastUpdated: "", sections: DEFAULT_RETURN_SECTIONS };
const PRIVACY_POLICY_DEFAULTS  = { lastUpdated: "", sections: DEFAULT_PRIVACY_SECTIONS };

function PolicySectionEditor({ title, subtitle, data, handlers, onSave, saved, onRefresh }) {
  const { sections, lastUpdated } = data;
  return (
    <div className="admin-card" style={{maxWidth:860,marginBottom:20}}>
      <div className="admin-card-hd">
        <h3>{title} <span style={{fontWeight:500,fontSize:".78rem",color:"#9B8472",textTransform:"none",letterSpacing:0}}>({sections.length} sections)</span></h3>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>{subtitle}</span>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={onRefresh}>↺ Refresh</button>
        </div>
      </div>
      <div style={{padding:"8px 0 20px"}}>
        <div className="admin-inp-grp" style={{maxWidth:280}}>
          <label>Last Updated</label>
          <input value={lastUpdated} onChange={e => handlers.setLastUpdated(e.target.value)} placeholder="e.g. July 2026"/>
        </div>

        <div style={{fontSize:".75rem",color:"#6B4C38",marginBottom:10}}>
          Start a line with "- " to make it a bullet point inside a section.
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {sections.map((s, i) => (
            <div key={i} style={{border:"1.5px solid #E8D5C0",borderRadius:12,padding:14,background:"#FFFCF7"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:700,color:"#18100A",fontSize:".85rem"}}>Section {i + 1}</span>
                <div style={{display:"flex",gap:6}}>
                  <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === 0} onClick={() => handlers.move(i, -1)}>↑</button>
                  <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === sections.length - 1} onClick={() => handlers.move(i, 1)}>↓</button>
                  <button onClick={() => handlers.remove(i)} disabled={sections.length <= 1}
                    style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                      cursor: sections.length <= 1 ? "not-allowed" : "pointer",padding:"6px 12px",fontWeight:700,fontSize:".8rem",
                      opacity: sections.length <= 1 ? .5 : 1}}>
                    ✕ Remove
                  </button>
                </div>
              </div>
              <div className="admin-inp-grp" style={{marginBottom:8}}>
                <label>Heading</label>
                <input value={s.title} onChange={e => handlers.setField(i, "title", e.target.value)}/>
              </div>
              <div className="admin-inp-grp" style={{marginBottom:0}}>
                <label>Body</label>
                <textarea rows={5} value={s.body} onChange={e => handlers.setField(i, "body", e.target.value)}
                  style={{fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handlers.add}
          style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
            cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
            fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
          + Add Section
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
  const [terms, setTerms]                   = useState(TERMS_DEFAULTS);
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
        setTerms({ lastUpdated: data.lastUpdated || "", sections: data.sections?.length ? data.sections : TERMS_DEFAULTS.sections });
      }
      if (shipPolSnap.exists()) {
        const data = shipPolSnap.data();
        setShippingPolicy({ lastUpdated: data.lastUpdated || "", sections: data.sections?.length ? data.sections : SHIPPING_POLICY_DEFAULTS.sections });
      }
      if (retPolSnap.exists()) {
        const data = retPolSnap.data();
        setReturnPolicy({ lastUpdated: data.lastUpdated || "", sections: data.sections?.length ? data.sections : RETURN_POLICY_DEFAULTS.sections });
      }
      if (privacyPolSnap.exists()) {
        const data = privacyPolSnap.data();
        setPrivacyPolicy({ lastUpdated: data.lastUpdated || "", sections: data.sections?.length ? data.sections : PRIVACY_POLICY_DEFAULTS.sections });
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // Generic handlers for section-based policy pages (Terms, Shipping, Return, Privacy)
  const makeSectionHandlers = (setState) => ({
    setField: (i, k, v) => setState(s => ({ ...s, sections: s.sections.map((x, j) => j === i ? { ...x, [k]: v } : x) })),
    setLastUpdated: (v) => setState(s => ({ ...s, lastUpdated: v })),
    add:    () => setState(s => ({ ...s, sections: [...s.sections, { title: "New Section", body: "" }] })),
    remove: (i) => setState(s => s.sections.length <= 1 ? s : ({ ...s, sections: s.sections.filter((_, j) => j !== i) })),
    move:   (i, dir) => setState(s => {
      const j = i + dir;
      if (j < 0 || j >= s.sections.length) return s;
      const arr = [...s.sections];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...s, sections: arr };
    }),
  });
  const termsH   = makeSectionHandlers(setTerms);
  const shipPolH = makeSectionHandlers(setShippingPolicy);
  const retPolH  = makeSectionHandlers(setReturnPolicy);
  const privacyPolH = makeSectionHandlers(setPrivacyPolicy);

  const savePolicy = async (docName, data, setSavedFlag, label) => {
    if (!window.confirm(`Save changes to ${label}? This will update the live site.`)) return;
    await setDoc(doc(db, "settings", docName), data);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 2500);
  };

  if (loading) return <div className="admin-loading">Loading policies…</div>;

  return (
    <div className="admin-content admin-settings-grid">
      <PolicySectionEditor title="Terms & Conditions" subtitle="Public page: /terms"
        data={terms} handlers={termsH} saved={termsSaved} onRefresh={load}
        onSave={() => savePolicy("termsPolicy", terms, setTermsSaved, "Terms & Conditions")}/>

      <PolicySectionEditor title="Privacy Policy" subtitle="Public page: /privacy-policy"
        data={privacyPolicy} handlers={privacyPolH} saved={privacyPolicySaved} onRefresh={load}
        onSave={() => savePolicy("privacyPolicy", privacyPolicy, setPrivacyPolicySaved, "Privacy Policy")}/>

      <PolicySectionEditor title="Shipping Policy" subtitle="Public page: /shipping-policy"
        data={shippingPolicy} handlers={shipPolH} saved={shippingPolicySaved} onRefresh={load}
        onSave={() => savePolicy("shippingPolicy", shippingPolicy, setShippingPolicySaved, "Shipping Policy")}/>

      <PolicySectionEditor title="Return Policy" subtitle="Public page: /return-policy"
        data={returnPolicy} handlers={retPolH} saved={returnPolicySaved} onRefresh={load}
        onSave={() => savePolicy("returnPolicy", returnPolicy, setReturnPolicySaved, "Return Policy")}/>
    </div>
  );
}
