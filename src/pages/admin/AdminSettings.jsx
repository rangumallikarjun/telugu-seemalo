import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { DEFAULT_CATEGORY_ITEMS, DEFAULT_SOCIAL_LINKS } from "../HomePage";

const STORE_DEFAULTS = {
  storeName: "Telugu Seemalo",
  tagline: "Authentic Cheriyal Craft",
  email: "hello@teluguseemalo.in",
  phone: "+91 9876 543 210",
  address: "Karimnagar, Telangana, India",
  contactEmailNote: "We reply within 24–48 hours on weekdays",
  contactPhoneHours: "Mon–Sat · 10 AM – 6 PM IST",
  footerDescription: "Authentic Cheriyal lacquer art from Karimnagar, Telangana. Supporting artisan families since 2020.",
  footerBadgeText: "🏅 Cheriyal Art is an authentic heritage craft of Telangana, India",
  appStoreUrl: "",
  playStoreUrl: "",
  returnDays: 7,
  gstNumber: "",
  bannerEnabled: false,
  bannerText: "🎉 Monsoon Sale — 20% off on all Cheriyal products! Use code MONSOON20",
  bannerBg: "#E8620A",
  bannerColor: "#ffffff",
  viewerEnabled: true,
  viewerMin: 12,
  viewerMax: 68,
  roomBuilderEnabled: true,
};

const TAX_DEFAULTS = {
  enabled: false,
  label: "GST",
  rate: 18,
  inclusive: true,
};

const CATEGORY_DEFAULTS = {
  items: DEFAULT_CATEGORY_ITEMS,
};

const SOCIAL_DEFAULTS = {
  items: DEFAULT_SOCIAL_LINKS,
};

const RESPONSE_TIMES_DEFAULTS = {
  items: [
    { label: "General Inquiry", time: "24–48 hrs" },
    { label: "Order Issues",    time: "12–24 hrs" },
    { label: "Payment Issues",  time: "6–12 hrs" },
    { label: "Complaints",      time: "48–72 hrs" },
  ],
};

const SEO_DEFAULTS = {
  siteTitle: "Telugu Seemalo | Authentic Cheriyal Lacquer Art & Handcrafted Decor",
  metaDescription: "Shop authentic handcrafted Cheriyal lacquer art from Karimnagar, Telangana — hand-painted pots, wall clocks, curtains, bed sheets, and home decor. Supporting artisan families since 2020.",
  focusKeywords: "Cheriyal lacquer art, Telangana handicrafts, handcrafted home decor, Karimnagar artisans, lacquer wall clocks, hand-painted pots",
};

const ANALYTICS_DEFAULTS = {
  enabled: false,
  gaId: "",
};

export default function AdminSettings() {
  const [form, setForm]         = useState(STORE_DEFAULTS);
  const [tax, setTax]           = useState(TAX_DEFAULTS);
  const [category, setCategory] = useState(CATEGORY_DEFAULTS);
  const [social, setSocial]     = useState(SOCIAL_DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [storeSaved, setStoreSaved] = useState(false);
  const [taxSaved, setTaxSaved]     = useState(false);
  const [categorySaved, setCategorySaved] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);
  const [seo, setSeo]         = useState(SEO_DEFAULTS);
  const [seoSaved, setSeoSaved] = useState(false);
  const [responseTimes, setResponseTimes] = useState(RESPONSE_TIMES_DEFAULTS);
  const [responseTimesSaved, setResponseTimesSaved] = useState(false);
  const [analytics, setAnalytics] = useState(ANALYTICS_DEFAULTS);
  const [analyticsSaved, setAnalyticsSaved] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "settings", "store")),
      getDoc(doc(db, "settings", "tax")),
      getDoc(doc(db, "settings", "shopCategories")),
      getDoc(doc(db, "settings", "socialLinks")),
      getDoc(doc(db, "settings", "seo")),
      getDoc(doc(db, "settings", "responseTimes")),
      getDoc(doc(db, "settings", "analytics")),
    ]).then(([storeSnap, taxSnap, categorySnap, socialSnap, seoSnap, responseTimesSnap, analyticsSnap]) => {
      if (storeSnap.exists()) setForm({ ...STORE_DEFAULTS, ...storeSnap.data() });
      if (taxSnap.exists())   setTax({ ...TAX_DEFAULTS, ...taxSnap.data() });
      if (categorySnap.exists()) {
        const data = categorySnap.data();
        setCategory({ items: data.items?.length ? data.items : CATEGORY_DEFAULTS.items });
      }
      if (socialSnap.exists()) {
        const data = socialSnap.data();
        setSocial({ items: data.items?.length ? data.items : SOCIAL_DEFAULTS.items });
      }
      if (seoSnap.exists()) setSeo({ ...SEO_DEFAULTS, ...seoSnap.data() });
      if (responseTimesSnap.exists()) {
        const data = responseTimesSnap.data();
        setResponseTimes({ items: data.items?.length ? data.items : RESPONSE_TIMES_DEFAULTS.items });
      }
      if (analyticsSnap.exists()) setAnalytics({ ...ANALYTICS_DEFAULTS, ...analyticsSnap.data() });
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT   = (k, v) => setTax(t => ({ ...t, [k]: v }));
  const setSeoField = (k, v) => setSeo(s => ({ ...s, [k]: v }));

  const handleSaveSeo = async () => {
    if (!window.confirm("Save changes to SEO settings? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "seo"), seo);
    setSeoSaved(true);
    setTimeout(() => setSeoSaved(false), 2500);
  };

  const handleSaveAnalytics = async () => {
    if (analytics.enabled && !/^G-[A-Z0-9]+$/i.test(analytics.gaId.trim())) {
      alert('Measurement ID should look like "G-XXXXXXXXXX". Double-check it from Google Analytics → Admin → Data Streams.');
      return;
    }
    if (!window.confirm("Save Google Analytics settings? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "analytics"), analytics);
    setAnalyticsSaved(true);
    setTimeout(() => setAnalyticsSaved(false), 2500);
  };

  const handleSaveStore = async () => {
    if (!window.confirm("Save changes to store settings? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "store"), form);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2500);
  };

  const handleSaveResponseTimes = async () => {
    if (!window.confirm("Save changes to Contact page response times? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "responseTimes"), responseTimes);
    setResponseTimesSaved(true);
    setTimeout(() => setResponseTimesSaved(false), 2500);
  };
  const responseTimeSetItem = (i, k, v) => setResponseTimes(r => ({ ...r, items: r.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const responseTimeAdd    = () => setResponseTimes(r => ({ ...r, items: [...r.items, { label: "New Category", time: "24 hrs" }] }));
  const responseTimeRemove = (i) => setResponseTimes(r => r.items.length <= 1 ? r : ({ ...r, items: r.items.filter((_, j) => j !== i) }));

  const handleSaveTax = async () => {
    if (!window.confirm("Save changes to tax settings? This will affect live checkout totals.")) return;
    await setDoc(doc(db, "settings", "tax"), tax);
    setTaxSaved(true);
    setTimeout(() => setTaxSaved(false), 2500);
  };

  const handleSaveCategory = async () => {
    if (!window.confirm("Save changes to Shop by Category? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "shopCategories"), category);
    setCategorySaved(true);
    setTimeout(() => setCategorySaved(false), 2500);
  };
  const categorySetItem = (i, k, v) => setCategory(c => ({ ...c, items: c.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const categoryAdd    = () => setCategory(c => ({ ...c, items: [...c.items, { icon: "✦", label: "New Category" }] }));
  const categoryRemove = (i) => setCategory(c => c.items.length <= 1 ? c : ({ ...c, items: c.items.filter((_, j) => j !== i) }));

  const handleSaveSocial = async () => {
    if (!window.confirm("Save changes to social media links? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "socialLinks"), social);
    setSocialSaved(true);
    setTimeout(() => setSocialSaved(false), 2500);
  };
  const socialSetItem = (i, k, v) => setSocial(s => ({ ...s, items: s.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const socialAdd    = () => setSocial(s => ({ ...s, items: [...s.items, { icon: "🔗", label: "New Link", url: "" }] }));
  const socialRemove = (i) => setSocial(s => s.items.length <= 1 ? s : ({ ...s, items: s.items.filter((_, j) => j !== i) }));

  if (loading) return <div className="admin-loading">Loading settings…</div>;

  // Tax preview calculation on a ₹1000 example
  const exampleSubtotal = 1000;
  const taxAmount = tax.enabled
    ? tax.inclusive
      ? Math.round(exampleSubtotal * tax.rate / (100 + tax.rate))
      : Math.round(exampleSubtotal * tax.rate / 100)
    : 0;

  return (
    <div className="admin-content admin-settings-grid">

      {/* ── SEO Settings ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:820,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>SEO Settings</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Search Engine Optimization</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <div className="admin-inp-grp">
            <label>Site Title</label>
            <input value={seo.siteTitle} onChange={e => setSeoField("siteTitle", e.target.value)}/>
          </div>

          <div className="admin-inp-grp">
            <label>Meta Description</label>
            <textarea rows={3} value={seo.metaDescription} onChange={e => setSeoField("metaDescription", e.target.value)}/>
            <div style={{textAlign:"right",fontSize:".72rem",fontWeight:700,marginTop:4,
              color: seo.metaDescription.length > 160 ? "#C0392B" : "#6B4C38"}}>
              {seo.metaDescription.length}/160
            </div>
          </div>

          <div className="admin-inp-grp">
            <label>Focus Keywords</label>
            <input value={seo.focusKeywords} onChange={e => setSeoField("focusKeywords", e.target.value)} placeholder="comma, separated, keywords"/>
          </div>

          <div style={{marginTop:8,marginBottom:16}}>
            <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>
              Google Search Preview
            </div>
            <div style={{background:"#F4EDE5",borderRadius:10,padding:"14px 18px",fontFamily:"arial,sans-serif"}}>
              <div style={{fontSize:".8rem",color:"#2D1E12"}}>teluguseemalo.in</div>
              <div style={{fontSize:"1.15rem",color:"#1A0DAB",margin:"2px 0",lineHeight:1.3,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {seo.siteTitle || "Site title goes here"}
              </div>
              <div style={{fontSize:".85rem",color:"#4D5156",lineHeight:1.5}}>
                {seo.metaDescription || "Meta description goes here."}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveSeo}>Save SEO</button>
            {seoSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Google Analytics ──────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:820,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Google Analytics</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Track visitors with GA4</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: analytics.enabled ? "#FFF3ED" : "#F8F4F0", borderRadius:10, marginBottom:16,
            border:`1.5px solid ${analytics.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Enable Tracking</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {analytics.enabled ? "GA4 tracking script is active on the live site" : "No analytics script is loaded"}
              </div>
            </div>
            <div onClick={() => setAnalytics(a => ({...a, enabled: !a.enabled}))}
              style={{width:44,height:24,borderRadius:12,background: analytics.enabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: analytics.enabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <div className="admin-inp-grp" style={{maxWidth:320}}>
            <label>Measurement ID</label>
            <input value={analytics.gaId} onChange={e => setAnalytics(a => ({...a, gaId: e.target.value}))}
              placeholder="G-XXXXXXXXXX" style={{fontFamily:"monospace"}}/>
            <span style={{fontSize:".73rem",color:"#6B4C38",marginTop:4,display:"block"}}>
              Google Analytics → Admin → Data Streams → your web stream
            </span>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center",marginTop:8}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveAnalytics}>Save Analytics</button>
            {analyticsSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

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
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Email Reply-Time Note</label>
              <input value={form.contactEmailNote} onChange={e => set("contactEmailNote", e.target.value)}
                placeholder="We reply within 24–48 hours on weekdays"/>
            </div>
            <div className="admin-inp-grp">
              <label>Phone Hours</label>
              <input value={form.contactPhoneHours} onChange={e => set("contactPhoneHours", e.target.value)}
                placeholder="Mon–Sat · 10 AM – 6 PM IST"/>
            </div>
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

          <SectionLabel>Footer</SectionLabel>
          <div className="admin-inp-grp">
            <label>Footer Description</label>
            <textarea rows={2} value={form.footerDescription} onChange={e => set("footerDescription", e.target.value)}/>
          </div>
          <div className="admin-inp-grp" style={{marginBottom:16}}>
            <label>Footer Heritage Badge Text</label>
            <input value={form.footerBadgeText} onChange={e => set("footerBadgeText", e.target.value)}/>
          </div>

          <SectionLabel>Mobile App Links</SectionLabel>
          <div className="admin-form-grid" style={{marginBottom:16}}>
            <div className="admin-inp-grp">
              <label>App Store URL</label>
              <input value={form.appStoreUrl} onChange={e => set("appStoreUrl", e.target.value)} placeholder="https://apps.apple.com/app/…"/>
              <span style={{fontSize:".73rem",color:"#6B4C38",marginTop:4,display:"block"}}>Leave blank to hide the badge</span>
            </div>
            <div className="admin-inp-grp">
              <label>Google Play URL</label>
              <input value={form.playStoreUrl} onChange={e => set("playStoreUrl", e.target.value)} placeholder="https://play.google.com/store/apps/details?id=…"/>
              <span style={{fontSize:".73rem",color:"#6B4C38",marginTop:4,display:"block"}}>Leave blank to hide the badge</span>
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

          <SectionLabel>Room Builder</SectionLabel>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: form.roomBuilderEnabled ? "#FFF3ED" : "#F8F4F0", borderRadius:10, marginBottom:16,
            border:`1.5px solid ${form.roomBuilderEnabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Enable Room Builder</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {form.roomBuilderEnabled ? "Visible in nav — customers can visualise products in a 3D room" : "Hidden from nav and direct links redirect to home"}
              </div>
            </div>
            <div onClick={() => set("roomBuilderEnabled", !form.roomBuilderEnabled)}
              style={{width:44,height:24,borderRadius:12,background: form.roomBuilderEnabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: form.roomBuilderEnabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center",marginTop:8}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveStore}>Save Settings</button>
            {storeSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved successfully!</span>}
          </div>
        </div>
      </div>

      {/* ── Shop by Category ──────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Shop by Category</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Category tiles on the homepage</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <SectionLabel>Categories</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {category.items.map((c, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={c.icon} onChange={e => categorySetItem(i, "icon", e.target.value)}
                  style={{width:52,padding:"8px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".9rem",textAlign:"center"}}/>
                <input value={c.label} onChange={e => categorySetItem(i, "label", e.target.value)}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => categoryRemove(i)} disabled={category.items.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: category.items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: category.items.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={categoryAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Category
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveCategory}>Save Categories</button>
            {categorySaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Social Media Links ────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Social Media Links</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Icon row in the footer</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <SectionLabel>Links</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {social.items.map((s, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={s.icon} onChange={e => socialSetItem(i, "icon", e.target.value)}
                  style={{width:52,padding:"8px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".9rem",textAlign:"center"}}/>
                <input value={s.label} onChange={e => socialSetItem(i, "label", e.target.value)}
                  placeholder="Platform name"
                  style={{width:130,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <input value={s.url} onChange={e => socialSetItem(i, "url", e.target.value)}
                  placeholder="https://instagram.com/youraccount"
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => socialRemove(i)} disabled={social.items.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: social.items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: social.items.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={socialAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Link
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveSocial}>Save Social Links</button>
            {socialSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Contact Page — Response Times ────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Response Times</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Shown on the Contact page</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {responseTimes.items.map((r, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={r.label} onChange={e => responseTimeSetItem(i, "label", e.target.value)}
                  placeholder="Category" style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <input value={r.time} onChange={e => responseTimeSetItem(i, "time", e.target.value)}
                  placeholder="24–48 hrs" style={{width:140,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => responseTimeRemove(i)} disabled={responseTimes.items.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: responseTimes.items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: responseTimes.items.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={responseTimeAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Category
          </button>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveResponseTimes}>Save Response Times</button>
            {responseTimesSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Tax Settings ──────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700}}>
        <div className="admin-card-hd">
          <h3>Tax Settings</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Applied live at checkout</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
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
