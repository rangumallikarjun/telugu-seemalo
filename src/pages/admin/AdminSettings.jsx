import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const MQ_DEFAULTS = {
  enabled: true,
  speed: 28,
  bg: "#E8620A",
  color: "#ffffff",
  items: [
    "🏅 GI-Tagged Authentic Art",
    "🚚 Free Delivery above ₹999",
    "⭐ 5,000+ Happy Customers",
    "🎁 Gift Wrapping Available",
    "↩ Easy 7-Day Returns",
    "🏆 Government of India Certified",
    "👨‍🎨 48 Artisan Families",
    "🌿 300+ Years of Heritage",
  ],
};

const STORE_DEFAULTS = {
  storeName: "Telugu Seemalo",
  tagline: "GI-Tagged Authentic Cheriyal Craft",
  email: "hello@teluguseeamalo.in",
  phone: "+91 9876 543 210",
  address: "Karimnagar, Telangana, India",
  instagram: "",
  facebook: "",
  twitter: "",
  returnDays: 7,
  gstNumber: "",
  bannerEnabled: false,
  bannerText: "🎉 Monsoon Sale — 20% off on all Cheriyal products! Use code MONSOON20",
  bannerBg: "#E8620A",
  bannerColor: "#ffffff",
  viewerEnabled: true,
  viewerMin: 12,
  viewerMax: 68,
};

const TAX_DEFAULTS = {
  enabled: false,
  label: "GST",
  rate: 18,
  inclusive: true,
};

export default function AdminSettings() {
  const [form, setForm]         = useState(STORE_DEFAULTS);
  const [tax, setTax]           = useState(TAX_DEFAULTS);
  const [mq, setMq]             = useState(MQ_DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [storeSaved, setStoreSaved] = useState(false);
  const [taxSaved, setTaxSaved]     = useState(false);
  const [mqSaved, setMqSaved]       = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "settings", "store")),
      getDoc(doc(db, "settings", "tax")),
      getDoc(doc(db, "settings", "marquee")),
    ]).then(([storeSnap, taxSnap, mqSnap]) => {
      if (storeSnap.exists()) setForm({ ...STORE_DEFAULTS, ...storeSnap.data() });
      if (taxSnap.exists())   setTax({ ...TAX_DEFAULTS, ...taxSnap.data() });
      if (mqSnap.exists())    setMq({ ...MQ_DEFAULTS, ...mqSnap.data() });
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT   = (k, v) => setTax(t => ({ ...t, [k]: v }));

  const handleSaveStore = async () => {
    await setDoc(doc(db, "settings", "store"), form);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2500);
  };

  const handleSaveTax = async () => {
    await setDoc(doc(db, "settings", "tax"), tax);
    setTaxSaved(true);
    setTimeout(() => setTaxSaved(false), 2500);
  };

  const handleSaveMq = async () => {
    await setDoc(doc(db, "settings", "marquee"), mq);
    setMqSaved(true);
    setTimeout(() => setMqSaved(false), 2500);
  };

  const mqSetItem = (i, val) => setMq(m => ({ ...m, items: m.items.map((x, j) => j === i ? val : x) }));
  const mqRemove  = (i)      => setMq(m => ({ ...m, items: m.items.filter((_, j) => j !== i) }));
  const mqAdd     = ()       => setMq(m => ({ ...m, items: [...m.items, "✦ New item"] }));

  if (loading) return <div className="admin-loading">Loading settings…</div>;

  // Tax preview calculation on a ₹1000 example
  const exampleSubtotal = 1000;
  const taxAmount = tax.enabled
    ? tax.inclusive
      ? Math.round(exampleSubtotal * tax.rate / (100 + tax.rate))
      : Math.round(exampleSubtotal * tax.rate / 100)
    : 0;

  return (
    <div className="admin-content">

      {/* ── Store Settings ────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Store Settings</h3>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <SectionLabel>Store Identity</SectionLabel>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Store Name</label>
              <input value={form.storeName} onChange={e => set("storeName", e.target.value)}/>
            </div>
            <div className="admin-inp-grp">
              <label>Tagline</label>
              <input value={form.tagline} onChange={e => set("tagline", e.target.value)}/>
            </div>
          </div>

          <SectionLabel>Contact Information</SectionLabel>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}/>
            </div>
            <div className="admin-inp-grp">
              <label>Phone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}/>
            </div>
          </div>
          <div className="admin-inp-grp">
            <label>Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)}/>
          </div>

          <SectionLabel>Business Details</SectionLabel>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>GST Number</label>
              <input value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} placeholder="22AAAAA0000A1Z5"/>
            </div>
            <div className="admin-inp-grp">
              <label>Return Window (days)</label>
              <input type="number" value={form.returnDays} onChange={e => set("returnDays", +e.target.value)}/>
            </div>
          </div>

          <SectionLabel>Social Media</SectionLabel>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Instagram</label>
              <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@teluguseeamalo"/>
            </div>
            <div className="admin-inp-grp">
              <label>Facebook</label>
              <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="teluguseeamalo"/>
            </div>
            <div className="admin-inp-grp">
              <label>Twitter / X</label>
              <input value={form.twitter} onChange={e => set("twitter", e.target.value)} placeholder="@teluguseeamalo"/>
            </div>
          </div>

          <SectionLabel>Announcement Banner</SectionLabel>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: form.bannerEnabled ? "#FFF3ED" : "#F8F4F0", borderRadius:10, marginBottom:16,
            border:`1.5px solid ${form.bannerEnabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Banner Visibility</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {form.bannerEnabled ? "Banner is showing at the top of the site" : "Banner is hidden"}
              </div>
            </div>
            <div onClick={() => set("bannerEnabled", !form.bannerEnabled)}
              style={{width:44,height:24,borderRadius:12,background: form.bannerEnabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: form.bannerEnabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
          <div className="admin-inp-grp" style={{marginBottom:12}}>
            <label>Banner Text</label>
            <input value={form.bannerText} onChange={e => set("bannerText", e.target.value)} placeholder="🎉 Sale text here…"/>
          </div>
          <div className="admin-form-grid" style={{marginBottom:16}}>
            <div className="admin-inp-grp">
              <label>Background Colour</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="color" value={form.bannerBg} onChange={e => set("bannerBg", e.target.value)}
                  style={{width:40,height:36,border:"1.5px solid var(--bd)",borderRadius:6,cursor:"pointer",padding:2}}/>
                <input value={form.bannerBg} onChange={e => set("bannerBg", e.target.value)} style={{flex:1}}/>
              </div>
            </div>
            <div className="admin-inp-grp">
              <label>Text Colour</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="color" value={form.bannerColor} onChange={e => set("bannerColor", e.target.value)}
                  style={{width:40,height:36,border:"1.5px solid var(--bd)",borderRadius:6,cursor:"pointer",padding:2}}/>
                <input value={form.bannerColor} onChange={e => set("bannerColor", e.target.value)} style={{flex:1}}/>
              </div>
            </div>
          </div>
          {form.bannerEnabled && (
            <div style={{borderRadius:8,padding:"10px 16px",marginBottom:16,fontSize:".85rem",fontWeight:600,
              background:form.bannerBg,color:form.bannerColor,textAlign:"center"}}>
              Preview: {form.bannerText}
            </div>
          )}

          <SectionLabel>Live Visitor Count</SectionLabel>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: form.viewerEnabled ? "#FFF3ED" : "#F8F4F0", borderRadius:10, marginBottom:16,
            border:`1.5px solid ${form.viewerEnabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Show Viewer Count</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                Shows "X people viewing this" on each product page
              </div>
            </div>
            <div onClick={() => set("viewerEnabled", !form.viewerEnabled)}
              style={{width:44,height:24,borderRadius:12,background: form.viewerEnabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: form.viewerEnabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>
          <div className="admin-form-grid" style={{marginBottom:16}}>
            <div className="admin-inp-grp">
              <label>Minimum Viewers</label>
              <input type="number" value={form.viewerMin} min={1}
                onChange={e => set("viewerMin", +e.target.value)}/>
            </div>
            <div className="admin-inp-grp">
              <label>Maximum Viewers</label>
              <input type="number" value={form.viewerMax} min={1}
                onChange={e => set("viewerMax", +e.target.value)}/>
            </div>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center",marginTop:8}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveStore}>Save Settings</button>
            {storeSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved successfully!</span>}
          </div>
        </div>
      </div>

      {/* ── Marquee Strip ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Marquee Strip</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Scrolling ticker below the hero</span>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          {/* Enable toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: mq.enabled ? "#FFF3ED" : "#F8F4F0",borderRadius:10,marginBottom:20,
            border:`1.5px solid ${mq.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Strip Visibility</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {mq.enabled ? "Marquee is visible on the homepage" : "Strip is hidden"}
              </div>
            </div>
            <div onClick={() => setMq(m => ({...m, enabled: !m.enabled}))}
              style={{width:44,height:24,borderRadius:12,background: mq.enabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: mq.enabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <SectionLabel>Appearance</SectionLabel>
          <div className="admin-form-grid" style={{marginBottom:16}}>
            <div className="admin-inp-grp">
              <label>Background Colour</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="color" value={mq.bg} onChange={e => setMq(m=>({...m,bg:e.target.value}))}
                  style={{width:40,height:36,border:"1.5px solid var(--bd)",borderRadius:6,cursor:"pointer",padding:2}}/>
                <input value={mq.bg} onChange={e => setMq(m=>({...m,bg:e.target.value}))} style={{flex:1}}/>
              </div>
            </div>
            <div className="admin-inp-grp">
              <label>Text Colour</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="color" value={mq.color} onChange={e => setMq(m=>({...m,color:e.target.value}))}
                  style={{width:40,height:36,border:"1.5px solid var(--bd)",borderRadius:6,cursor:"pointer",padding:2}}/>
                <input value={mq.color} onChange={e => setMq(m=>({...m,color:e.target.value}))} style={{flex:1}}/>
              </div>
            </div>
          </div>
          <div className="admin-inp-grp" style={{marginBottom:20}}>
            <label>Scroll Speed — {mq.speed}s per loop <span style={{color:"#9B8472",fontWeight:400}}>(lower = faster)</span></label>
            <input type="range" min={10} max={80} value={mq.speed}
              onChange={e => setMq(m=>({...m,speed:+e.target.value}))}
              style={{width:"100%",accentColor:"#E8620A"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:".72rem",color:"#9B8472",marginTop:4}}>
              <span>Fast (10s)</span><span>Slow (80s)</span>
            </div>
          </div>

          {/* Live preview */}
          {mq.enabled && mq.items.length > 0 && (
            <div style={{overflow:"hidden",borderRadius:8,marginBottom:20,position:"relative",height:38}}>
              <div style={{position:"absolute",inset:0,background:mq.bg,display:"flex",alignItems:"center",
                gap:24,padding:"0 20px",fontSize:".8rem",fontWeight:700,color:mq.color,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {mq.items.slice(0,4).map((item,i) => (
                  <span key={i}>{item} <span style={{opacity:.5,fontSize:".6rem"}}>✦</span></span>
                ))}
                <span style={{opacity:.6,fontSize:".75rem"}}>…</span>
              </div>
            </div>
          )}

          <SectionLabel>Items</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {mq.items.map((item, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:"#9B8472",fontSize:".8rem",width:20,textAlign:"right",flexShrink:0}}>{i+1}</span>
                <input value={item} onChange={e => mqSetItem(i, e.target.value)}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => mqRemove(i)}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor:"pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",flexShrink:0,
                    transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#FEF0EF";e.currentTarget.style.borderColor="#C0392B";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor="#E8D5C0";}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={mqAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Item
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveMq}>Save Marquee</button>
            {mqSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Tax Settings ──────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700}}>
        <div className="admin-card-hd">
          <h3>Tax Settings</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Applied live at checkout</span>
        </div>
        <div style={{padding:"12px 0 20px"}}>

          {/* Enable toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: tax.enabled ? "#FFF3ED" : "#F8F4F0",borderRadius:10,marginBottom:20,
            border:`1.5px solid ${tax.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Tax Collection</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {tax.enabled ? `Charging ${tax.rate}% ${tax.label} on orders` : "No tax is being collected at checkout"}
              </div>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
              <div onClick={() => setT("enabled", !tax.enabled)}
                style={{width:44,height:24,borderRadius:12,background: tax.enabled ? "#E8620A" : "#D1C5BB",
                  position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left: tax.enabled ? 22 : 3,width:18,height:18,
                  borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
              </div>
              <span style={{fontSize:".85rem",fontWeight:700,color: tax.enabled ? "#E8620A" : "#9B8472"}}>
                {tax.enabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          {/* Tax fields — shown whether enabled or not so admin can configure before enabling */}
          <div style={{opacity: tax.enabled ? 1 : 0.55, transition:"opacity .2s"}}>
            <div className="admin-form-grid">
              <div className="admin-inp-grp">
                <label>Tax Label</label>
                <input value={tax.label}
                  onChange={e => setT("label", e.target.value)}
                  placeholder="GST / VAT / Tax"
                  style={{textTransform:"uppercase",letterSpacing:".04em",fontWeight:600}}/>
                <span style={{fontSize:".73rem",color:"#6B4C38",marginTop:4,display:"block"}}>Shown to customers (e.g. GST, VAT)</span>
              </div>
              <div className="admin-inp-grp">
                <label>Tax Rate (%)</label>
                <input type="number" value={tax.rate} min={0} max={100} step={0.01}
                  onChange={e => setT("rate", +e.target.value)}/>
                <span style={{fontSize:".73rem",color:"#6B4C38",marginTop:4,display:"block"}}>Common GST slabs: 5%, 12%, 18%, 28%</span>
              </div>
            </div>

            {/* Inclusive vs Exclusive */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:10}}>
                Tax Calculation Method
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {
                    val: true,
                    title: "Tax Inclusive",
                    desc: "Prices already include tax. The tax amount is extracted and shown as a breakdown at checkout. Total does not change.",
                    example: `e.g. ₹1,000 item → shows "Includes ${tax.rate}% ${tax.label}: ₹${Math.round(1000 * tax.rate / (100 + tax.rate))}"`,
                  },
                  {
                    val: false,
                    title: "Tax Exclusive",
                    desc: "Tax is added on top of the subtotal at checkout. Customer pays subtotal + tax + shipping.",
                    example: `e.g. ₹1,000 item → adds ₹${Math.round(1000 * tax.rate / 100)} ${tax.label} on top → total ₹${1000 + Math.round(1000 * tax.rate / 100)}`,
                  },
                ].map(opt => (
                  <label key={String(opt.val)}
                    onClick={() => setT("inclusive", opt.val)}
                    style={{display:"flex",gap:12,padding:"12px 16px",borderRadius:10,cursor:"pointer",
                      border:`1.5px solid ${tax.inclusive === opt.val ? "#E8620A" : "#E8D5C0"}`,
                      background: tax.inclusive === opt.val ? "#FFF3ED" : "#fff"}}>
                    <div style={{marginTop:2,flexShrink:0}}>
                      <div style={{width:18,height:18,borderRadius:"50%",
                        border:`2px solid ${tax.inclusive === opt.val ? "#E8620A" : "#D1C5BB"}`,
                        background: tax.inclusive === opt.val ? "#E8620A" : "#fff",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {tax.inclusive === opt.val && <div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                      </div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:".88rem",color:"#18100A",marginBottom:3}}>{opt.title}</div>
                      <div style={{fontSize:".79rem",color:"#6B4C38",marginBottom:4}}>{opt.desc}</div>
                      <div style={{fontSize:".76rem",color:"#C9901A",fontStyle:"italic"}}>{opt.example}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Live checkout preview */}
            {tax.enabled && (
              <div style={{background:"#F8F4F0",borderRadius:9,padding:"12px 16px",fontSize:".83rem",color:"#6B4C38",marginBottom:16}}>
                <div style={{fontWeight:700,color:"#18100A",marginBottom:8}}>Checkout preview (example: ₹1,000 order)</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span>Subtotal</span><span>₹1,000</span>
                  </div>
                  {!tax.inclusive && (
                    <div style={{display:"flex",justifyContent:"space-between",color:"#B7770D"}}>
                      <span>{tax.label} ({tax.rate}%)</span><span>+ ₹{taxAmount}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span>Shipping</span><span>₹99</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:"#18100A",borderTop:"1px solid #E8D5C0",paddingTop:6,marginTop:2}}>
                    <span>Total</span>
                    <span>₹{1000 + 99 + (!tax.inclusive ? taxAmount : 0)}</span>
                  </div>
                  {tax.inclusive && (
                    <div style={{fontSize:".76rem",color:"#6B4C38",marginTop:4,fontStyle:"italic"}}>
                      * Includes {tax.label} ({tax.rate}%): ₹{taxAmount}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveTax}>Save Tax Settings</button>
            {taxSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:14,marginTop:20,borderBottom:"1px solid #F0E8DF",paddingBottom:6}}>
      {children}
    </div>
  );
}
