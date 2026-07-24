import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadHeroSlideImage, uploadStoryChapterImage } from "../../firebase/storageService";
import { DEFAULT_HERO_SLIDES, HERO_PAGE_OPTIONS, DEFAULT_TRUST_ITEMS, DEFAULT_STATS_ITEMS, DEFAULT_STORY_CHAPTERS, DEFAULT_TAGLINE_PHRASES } from "../HomePage";
import { useCropUpload } from "../../hooks/useCropUpload";
import ImageCropModal from "../../components/ImageCropModal";

const MQ_DEFAULTS = {
  enabled: true,
  speed: 28,
  bg: "#E8620A",
  color: "#ffffff",
  items: [
    "🏅 Authentic Handcrafted Art",
    "🚚 Free Delivery above ₹999",
    "⭐ 5,000+ Happy Customers",
    "🎁 Gift Wrapping Available",
    "↩ Easy 7-Day Returns",
    "🏆 Trusted Since 2020",
    "👨‍🎨 48 Artisan Families",
    "🌿 300+ Years of Heritage",
  ],
};

const HERO_DEFAULTS = {
  enabled: true,
  autoplaySpeed: 7,
  slides: DEFAULT_HERO_SLIDES,
  taglinePhrases: DEFAULT_TAGLINE_PHRASES,
};

const TRUST_DEFAULTS = {
  enabled: true,
  items: DEFAULT_TRUST_ITEMS,
};

const STATS_DEFAULTS = {
  enabled: true,
  items: DEFAULT_STATS_ITEMS,
};

const STORY_DEFAULTS = {
  chapters: DEFAULT_STORY_CHAPTERS,
};

const blankStoryChapter = () => ({
  eyebrow: "New Chapter",
  title: ["New", "Chapter"],
  body: "",
  bg: "linear-gradient(160deg, #2A1208 0%, #6B3A10 55%, #1A0A04 100%)",
  accent: "#E8A83A",
  emoji: "✦",
  telugu: "",
  tag: "",
  stat: { value: "", label: "" },
  image: "",
});

const blankHeroSlide = () => ({
  id: "slide-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  image: "",
  imageTablet: "",
  imageMobile: "",
  telugu: "హస్తకళ",
  headingLine1: "Authentic",
  headingHighlight: "Handcrafted",
  headingLine2: "Lacquer Art",
  description: "",
  primaryBtnLabel: "Shop Now",
  primaryBtnPage: "shop",
  secondaryBtnLabel: "Our Story",
  secondaryBtnPage: "about",
  badgeText: "",
});

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:14,marginTop:20,borderBottom:"1px solid #F0E8DF",paddingBottom:6}}>
      {children}
    </div>
  );
}

export default function AdminHomepage() {
  const [hero, setHero]   = useState(HERO_DEFAULTS);
  const [trust, setTrust] = useState(TRUST_DEFAULTS);
  const [mq, setMq]       = useState(MQ_DEFAULTS);
  const [stats, setStats] = useState(STATS_DEFAULTS);
  const [story, setStory] = useState(STORY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [heroSaved, setHeroSaved]   = useState(false);
  const [trustSaved, setTrustSaved] = useState(false);
  const [mqSaved, setMqSaved]       = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const [storySaved, setStorySaved] = useState(false);
  const heroCrop  = useCropUpload(uploadHeroSlideImage, 16 / 9);
  const storyCrop = useCropUpload(uploadStoryChapterImage, 1);

  const load = () => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "settings", "heroSlides")),
      getDoc(doc(db, "settings", "trustStrip")),
      getDoc(doc(db, "settings", "marquee")),
      getDoc(doc(db, "settings", "statsCounter")),
      getDoc(doc(db, "settings", "storyChapters")),
    ]).then(([heroSnap, trustSnap, mqSnap, statsSnap, storySnap]) => {
      if (heroSnap.exists()) {
        const data = heroSnap.data();
        setHero({
          ...HERO_DEFAULTS, ...data,
          slides: data.slides?.length ? data.slides : HERO_DEFAULTS.slides,
          taglinePhrases: data.taglinePhrases?.length ? data.taglinePhrases : HERO_DEFAULTS.taglinePhrases,
        });
      }
      if (trustSnap.exists()) {
        const data = trustSnap.data();
        setTrust({ ...TRUST_DEFAULTS, ...data, items: data.items?.length ? data.items : TRUST_DEFAULTS.items });
      }
      if (mqSnap.exists()) setMq({ ...MQ_DEFAULTS, ...mqSnap.data() });
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        setStats({ ...STATS_DEFAULTS, ...data, items: data.items?.length ? data.items : STATS_DEFAULTS.items });
      }
      if (storySnap.exists()) {
        const data = storySnap.data();
        setStory({ chapters: data.chapters?.length ? data.chapters : STORY_DEFAULTS.chapters });
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // Hero
  const handleSaveHero = async () => {
    const badSlide = hero.slides.findIndex(s => !s.image || !s.image.startsWith("http"));
    if (badSlide !== -1) {
      alert(`Slide ${badSlide + 1} needs a Desktop image uploaded before saving (the default logo image can't be saved directly).`);
      return;
    }
    const badVariant = hero.slides.findIndex(s =>
      (s.imageTablet && !s.imageTablet.startsWith("http")) ||
      (s.imageMobile && !s.imageMobile.startsWith("http")));
    if (badVariant !== -1) {
      alert(`Slide ${badVariant + 1} has an invalid Tablet or Mobile image — please re-upload it.`);
      return;
    }
    if (!window.confirm("Save changes to the homepage hero slides? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "heroSlides"), hero);
    setHeroSaved(true);
    setTimeout(() => setHeroSaved(false), 2500);
  };
  const heroSetSlide = (i, k, v) => setHero(h => ({ ...h, slides: h.slides.map((s, j) => j === i ? { ...s, [k]: v } : s) }));
  const heroAddSlide = () => setHero(h => ({ ...h, slides: [...h.slides, blankHeroSlide()] }));
  const heroRemoveSlide = (i) => {
    if (hero.slides.length <= 1) return;
    if (!window.confirm("Remove this slide? This cannot be undone.")) return;
    setHero(h => ({ ...h, slides: h.slides.filter((_, j) => j !== i) }));
  };
  const heroMoveSlide = (i, dir) => setHero(h => {
    const j = i + dir;
    if (j < 0 || j >= h.slides.length) return h;
    const arr = [...h.slides];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...h, slides: arr };
  });
  const heroUploadImage = (i, field, file) => {
    heroCrop.open([file], (urls) => { if (urls[0]) heroSetSlide(i, field, urls[0]); });
  };
  const heroSetPhrase = (i, val) => setHero(h => ({ ...h, taglinePhrases: h.taglinePhrases.map((x, j) => j === i ? val : x) }));
  const heroAddPhrase = () => setHero(h => ({ ...h, taglinePhrases: [...h.taglinePhrases, "New phrase"] }));
  const heroRemovePhrase = (i) => setHero(h => h.taglinePhrases.length <= 1 ? h : ({ ...h, taglinePhrases: h.taglinePhrases.filter((_, j) => j !== i) }));

  // Trust strip
  const handleSaveTrust = async () => {
    if (!window.confirm("Save changes to the trust strip? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "trustStrip"), trust);
    setTrustSaved(true);
    setTimeout(() => setTrustSaved(false), 2500);
  };
  const trustSetItem = (i, k, v) => setTrust(t => ({ ...t, items: t.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const trustAdd    = () => setTrust(t => ({ ...t, items: [...t.items, { icon: "✦", label: "New item" }] }));
  const trustRemove = (i) => setTrust(t => t.items.length <= 1 ? t : ({ ...t, items: t.items.filter((_, j) => j !== i) }));

  // Marquee
  const handleSaveMq = async () => {
    if (!window.confirm("Save changes to the marquee strip? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "marquee"), mq);
    setMqSaved(true);
    setTimeout(() => setMqSaved(false), 2500);
  };
  const mqSetItem = (i, val) => setMq(m => ({ ...m, items: m.items.map((x, j) => j === i ? val : x) }));
  const mqRemove  = (i)      => setMq(m => ({ ...m, items: m.items.filter((_, j) => j !== i) }));
  const mqAdd     = ()       => setMq(m => ({ ...m, items: [...m.items, "✦ New item"] }));

  // Stats counter
  const handleSaveStats = async () => {
    if (!window.confirm("Save changes to the stats counter? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "statsCounter"), stats);
    setStatsSaved(true);
    setTimeout(() => setStatsSaved(false), 2500);
  };
  const statsSetItem = (i, k, v) => setStats(s => ({ ...s, items: s.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const statsAdd    = () => setStats(s => ({ ...s, items: [...s.items, { val: 0, suffix: "", label: "New Stat" }] }));
  const statsRemove = (i) => setStats(s => s.items.length <= 1 ? s : ({ ...s, items: s.items.filter((_, j) => j !== i) }));

  // Our Story chapters
  const handleSaveStory = async () => {
    if (!window.confirm("Save changes to Our Story chapters? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "storyChapters"), story);
    setStorySaved(true);
    setTimeout(() => setStorySaved(false), 2500);
  };
  const storySetChapter = (i, k, v) => setStory(s => ({ ...s, chapters: s.chapters.map((c, j) => j === i ? { ...c, [k]: v } : c) }));
  const storySetTitleLine = (i, lineIdx, v) => setStory(s => ({ ...s, chapters: s.chapters.map((c, j) => {
    if (j !== i) return c;
    const title = [...c.title]; title[lineIdx] = v; return { ...c, title };
  }) }));
  const storySetStat = (i, k, v) => setStory(s => ({ ...s, chapters: s.chapters.map((c, j) => j === i ? { ...c, stat: { ...c.stat, [k]: v } } : c) }));
  const storyAddChapter = () => setStory(s => ({ ...s, chapters: [...s.chapters, blankStoryChapter()] }));
  const storyRemoveChapter = (i) => {
    if (story.chapters.length <= 1) return;
    if (!window.confirm("Remove this chapter? This cannot be undone.")) return;
    setStory(s => ({ ...s, chapters: s.chapters.filter((_, j) => j !== i) }));
  };
  const storyMoveChapter = (i, dir) => setStory(s => {
    const j = i + dir;
    if (j < 0 || j >= s.chapters.length) return s;
    const arr = [...s.chapters];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...s, chapters: arr };
  });
  const storyUploadImage = (i, file) => {
    storyCrop.open([file], (urls) => { if (urls[0]) storySetChapter(i, "image", urls[0]); });
  };

  if (loading) return <div className="admin-loading">Loading homepage settings…</div>;

  return (
    <div className="admin-content admin-settings-grid">

      {/* ── Hero Slides ───────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:900,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Hero Slides</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Homepage hero carousel</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          {/* Enable toggle */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: hero.enabled ? "#FFF3ED" : "#F8F4F0",borderRadius:10,marginBottom:20,
            border:`1.5px solid ${hero.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Autoplay Carousel</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {hero.enabled ? "Slides cycle automatically on the homepage" : "Only the first slide is shown, no cycling"}
              </div>
            </div>
            <div onClick={() => setHero(h => ({...h, enabled: !h.enabled}))}
              style={{width:44,height:24,borderRadius:12,background: hero.enabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: hero.enabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <div className="admin-inp-grp" style={{marginBottom:20,maxWidth:340}}>
            <label>Autoplay Speed — {hero.autoplaySpeed}s per slide</label>
            <input type="range" min={3} max={15} value={hero.autoplaySpeed}
              onChange={e => setHero(h => ({...h, autoplaySpeed:+e.target.value}))}
              style={{width:"100%",accentColor:"#E8620A"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:".72rem",color:"#9B8472",marginTop:4}}>
              <span>Fast (3s)</span><span>Slow (15s)</span>
            </div>
          </div>

          <SectionLabel>Typing Tagline Phrases</SectionLabel>
          <div style={{fontSize:".78rem",color:"#6B4C38",marginBottom:10}}>
            The italic line below the heading that types out one phrase at a time, cycling on repeat. Shown on every slide.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {hero.taglinePhrases.map((p, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={p} onChange={e => heroSetPhrase(i, e.target.value)}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => heroRemovePhrase(i)} disabled={hero.taglinePhrases.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: hero.taglinePhrases.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: hero.taglinePhrases.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={heroAddPhrase}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:20,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Phrase
          </button>

          <SectionLabel>Slides</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
            {hero.slides.map((s, i) => (
              <div key={s.id} style={{border:"1.5px solid #E8D5C0",borderRadius:12,padding:16,background:"#FFFCF7"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <span style={{fontWeight:700,color:"#18100A"}}>Slide {i + 1}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === 0} onClick={() => heroMoveSlide(i, -1)}>↑</button>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === hero.slides.length - 1} onClick={() => heroMoveSlide(i, 1)}>↓</button>
                    <button onClick={() => heroRemoveSlide(i)} disabled={hero.slides.length <= 1}
                      style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                        cursor: hero.slides.length <= 1 ? "not-allowed" : "pointer",padding:"6px 12px",fontWeight:700,fontSize:".8rem",
                        opacity: hero.slides.length <= 1 ? .5 : 1}}>
                      ✕ Remove
                    </button>
                  </div>
                </div>

                <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:18}}>
                  {[
                    { field: "image",       label: "Desktop", hint: "1920 × 1080px (16:9 landscape)", required: true },
                    { field: "imageTablet", label: "Tablet",  hint: "1200 × 1600px (3:4 portrait)",   required: false },
                    { field: "imageMobile", label: "Mobile",  hint: "1080 × 1920px (9:16 portrait)",  required: false },
                  ].map(({ field, label, hint, required }) => (
                    <div key={field} style={{width:118}}>
                      <div style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",color:"#6B4C38",marginBottom:6}}>
                        {label}{required && <span style={{color:"#E8620A"}}> *</span>}
                      </div>
                      <div style={{width:112,height:112,borderRadius:8,border:"1.5px solid #E8D5C0",background:"#18100A",
                        display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:6}}>
                        {s[field]
                          ? <img src={s[field]} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                          : <span style={{color:"#6B4C38",fontSize:".64rem",textAlign:"center",padding:"0 8px"}}>
                              {required ? "No image" : "Uses Desktop image"}
                            </span>}
                      </div>
                      <input type="file" accept="image/*" id={`hero-img-${field}-${s.id}`} style={{display:"none"}}
                        onChange={e => { const f = e.target.files?.[0]; if (f) heroUploadImage(i, field, f); e.target.value = ""; }}/>
                      <button className="admin-btn admin-btn-outline admin-btn-sm" style={{width:"100%",marginBottom:5}}
                        onClick={() => document.getElementById(`hero-img-${field}-${s.id}`).click()}>
                        {s[field] ? "Replace" : "Upload"}
                      </button>
                      <div style={{fontSize:".64rem",color:"#9B8472",lineHeight:1.3}}>{hint}</div>
                    </div>
                  ))}
                </div>

                  <div style={{flex:1,minWidth:280}}>
                    <div className="admin-form-grid">
                      <div className="admin-inp-grp">
                        <label>Telugu Eyebrow</label>
                        <input value={s.telugu} onChange={e => heroSetSlide(i, "telugu", e.target.value)}/>
                      </div>
                      <div className="admin-inp-grp">
                        <label>Badge Text</label>
                        <input value={s.badgeText} onChange={e => heroSetSlide(i, "badgeText", e.target.value)}/>
                      </div>
                    </div>
                    <div className="admin-form-grid" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
                      <div className="admin-inp-grp">
                        <label>Heading Line 1</label>
                        <input value={s.headingLine1} onChange={e => heroSetSlide(i, "headingLine1", e.target.value)}/>
                      </div>
                      <div className="admin-inp-grp">
                        <label>Highlighted Word</label>
                        <input value={s.headingHighlight} onChange={e => heroSetSlide(i, "headingHighlight", e.target.value)}/>
                      </div>
                      <div className="admin-inp-grp">
                        <label>Heading Line 2</label>
                        <input value={s.headingLine2} onChange={e => heroSetSlide(i, "headingLine2", e.target.value)}/>
                      </div>
                    </div>
                    <div className="admin-inp-grp">
                      <label>Description</label>
                      <textarea rows={2} value={s.description} onChange={e => heroSetSlide(i, "description", e.target.value)}/>
                    </div>
                    <div className="admin-form-grid">
                      <div className="admin-inp-grp">
                        <label>Primary Button Label</label>
                        <input value={s.primaryBtnLabel} onChange={e => heroSetSlide(i, "primaryBtnLabel", e.target.value)}/>
                      </div>
                      <div className="admin-inp-grp">
                        <label>Primary Button Links To</label>
                        <select value={s.primaryBtnPage} onChange={e => heroSetSlide(i, "primaryBtnPage", e.target.value)}>
                          {HERO_PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="admin-form-grid">
                      <div className="admin-inp-grp">
                        <label>Secondary Button Label</label>
                        <input value={s.secondaryBtnLabel} onChange={e => heroSetSlide(i, "secondaryBtnLabel", e.target.value)}/>
                      </div>
                      <div className="admin-inp-grp">
                        <label>Secondary Button Links To</label>
                        <select value={s.secondaryBtnPage} onChange={e => heroSetSlide(i, "secondaryBtnPage", e.target.value)}>
                          {HERO_PAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>

          <button onClick={heroAddSlide}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Slide
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveHero}>Save Hero Slides</button>
            {heroSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Trust Strip ───────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Trust Strip</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Icon row below the hero</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: trust.enabled ? "#FFF3ED" : "#F8F4F0",borderRadius:10,marginBottom:20,
            border:`1.5px solid ${trust.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Strip Visibility</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {trust.enabled ? "Trust strip is visible on the homepage" : "Strip is hidden"}
              </div>
            </div>
            <div onClick={() => setTrust(t => ({...t, enabled: !t.enabled}))}
              style={{width:44,height:24,borderRadius:12,background: trust.enabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: trust.enabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <SectionLabel>Items</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {trust.items.map((t, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={t.icon} onChange={e => trustSetItem(i, "icon", e.target.value)}
                  style={{width:52,padding:"8px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".9rem",textAlign:"center"}}/>
                <input value={t.label} onChange={e => trustSetItem(i, "label", e.target.value)}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => trustRemove(i)} disabled={trust.items.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: trust.items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: trust.items.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={trustAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Item
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveTrust}>Save Trust Strip</button>
            {trustSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Marquee Strip ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Marquee Strip</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Scrolling ticker below the hero</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
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

      {/* ── Stats Counter ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Stats Counter</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Animated count-up numbers below the marquee</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",
            background: stats.enabled ? "#FFF3ED" : "#F8F4F0",borderRadius:10,marginBottom:20,
            border:`1.5px solid ${stats.enabled ? "#E8620A" : "#E8D5C0"}`}}>
            <div>
              <div style={{fontWeight:700,fontSize:".95rem",color:"#18100A"}}>Section Visibility</div>
              <div style={{fontSize:".8rem",color:"#6B4C38",marginTop:2}}>
                {stats.enabled ? "Stats counter is visible on the homepage" : "Section is hidden"}
              </div>
            </div>
            <div onClick={() => setStats(s => ({...s, enabled: !s.enabled}))}
              style={{width:44,height:24,borderRadius:12,background: stats.enabled ? "#E8620A" : "#D1C5BB",
                position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left: stats.enabled ? 22 : 3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
            </div>
          </div>

          <SectionLabel>Items</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {stats.items.map((s, i) => (
              <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="number" value={s.val} onChange={e => statsSetItem(i, "val", +e.target.value)}
                  placeholder="Value" style={{width:90,padding:"8px 10px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <input value={s.suffix} onChange={e => statsSetItem(i, "suffix", e.target.value)}
                  placeholder="+" style={{width:52,padding:"8px 10px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem",textAlign:"center"}}/>
                <input value={s.label} onChange={e => statsSetItem(i, "label", e.target.value)}
                  placeholder="Label" style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                    fontFamily:"DM Sans,sans-serif",fontSize:".85rem"}}/>
                <button onClick={() => statsRemove(i)} disabled={stats.items.length <= 1}
                  style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                    cursor: stats.items.length <= 1 ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".85rem",
                    opacity: stats.items.length <= 1 ? .5 : 1,flexShrink:0}}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={statsAdd}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Stat
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveStats}>Save Stats Counter</button>
            {statsSaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {/* ── Our Story Chapters ────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:900,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Our Story Chapters</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Sticky-scroll narrative section on the homepage</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>
        <div style={{padding:"8px 0 20px"}}>

          <SectionLabel>Chapters</SectionLabel>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
            {story.chapters.map((c, i) => (
              <div key={i} style={{border:"1.5px solid #E8D5C0",borderRadius:12,padding:16,background:"#FFFCF7"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <span style={{fontWeight:700,color:"#18100A"}}>Chapter {i + 1}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === 0} onClick={() => storyMoveChapter(i, -1)}>↑</button>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" disabled={i === story.chapters.length - 1} onClick={() => storyMoveChapter(i, 1)}>↓</button>
                    <button onClick={() => storyRemoveChapter(i)} disabled={story.chapters.length <= 1}
                      style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
                        cursor: story.chapters.length <= 1 ? "not-allowed" : "pointer",padding:"6px 12px",fontWeight:700,fontSize:".8rem",
                        opacity: story.chapters.length <= 1 ? .5 : 1}}>
                      ✕ Remove
                    </button>
                  </div>
                </div>

                <div style={{display:"flex",gap:14,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0,width:84}}>
                    <div style={{width:80,height:80,borderRadius:8,border:"1.5px solid #E8D5C0",background:"#18100A",
                      display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:6,fontSize:"2rem"}}>
                      {c.image
                        ? <img src={c.image} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                        : c.emoji}
                    </div>
                    <input type="file" accept="image/*" id={`story-img-${i}`} style={{display:"none"}}
                      onChange={e => { const f = e.target.files?.[0]; if (f) storyUploadImage(i, f); e.target.value = ""; }}/>
                    <button className="admin-btn admin-btn-outline admin-btn-sm" style={{width:"100%",marginBottom:4}}
                      onClick={() => document.getElementById(`story-img-${i}`).click()}>
                      Upload
                    </button>
                    {c.image && (
                      <button className="admin-btn admin-btn-outline admin-btn-sm" style={{width:"100%",color:"#C0392B"}}
                        onClick={() => storySetChapter(i, "image", "")}>
                        Use Emoji
                      </button>
                    )}
                  </div>
                  <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div className="admin-inp-grp" style={{margin:0}}>
                      <label>Eyebrow</label>
                      <input value={c.eyebrow} onChange={e => storySetChapter(i, "eyebrow", e.target.value)}/>
                    </div>
                    <div className="admin-inp-grp" style={{margin:0}}>
                      <label>Tag</label>
                      <input value={c.tag} onChange={e => storySetChapter(i, "tag", e.target.value)}/>
                    </div>
                  </div>
                </div>
                <div className="admin-form-grid">
                  <div className="admin-inp-grp">
                    <label>Title Line 1</label>
                    <input value={c.title[0]} onChange={e => storySetTitleLine(i, 0, e.target.value)}/>
                  </div>
                  <div className="admin-inp-grp">
                    <label>Title Line 2</label>
                    <input value={c.title[1]} onChange={e => storySetTitleLine(i, 1, e.target.value)}/>
                  </div>
                </div>
                <div className="admin-inp-grp">
                  <label>Body</label>
                  <textarea rows={2} value={c.body} onChange={e => storySetChapter(i, "body", e.target.value)}/>
                </div>
                <div className="admin-form-grid" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
                  <div className="admin-inp-grp">
                    <label>Emoji (used if no image)</label>
                    <input value={c.emoji} onChange={e => storySetChapter(i, "emoji", e.target.value)}/>
                  </div>
                  <div className="admin-inp-grp">
                    <label>Telugu Word</label>
                    <input value={c.telugu} onChange={e => storySetChapter(i, "telugu", e.target.value)}/>
                  </div>
                  <div className="admin-inp-grp">
                    <label>Accent Colour</label>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="color" value={c.accent} onChange={e => storySetChapter(i, "accent", e.target.value)}
                        style={{width:40,height:36,border:"1.5px solid var(--bd)",borderRadius:6,cursor:"pointer",padding:2}}/>
                      <input value={c.accent} onChange={e => storySetChapter(i, "accent", e.target.value)} style={{flex:1}}/>
                    </div>
                  </div>
                </div>
                <div className="admin-form-grid">
                  <div className="admin-inp-grp">
                    <label>Stat Value</label>
                    <input value={c.stat.value} onChange={e => storySetStat(i, "value", e.target.value)} placeholder="e.g. 300+"/>
                  </div>
                  <div className="admin-inp-grp">
                    <label>Stat Label</label>
                    <input value={c.stat.label} onChange={e => storySetStat(i, "label", e.target.value)} placeholder="e.g. Years of Heritage"/>
                  </div>
                </div>
                <div className="admin-inp-grp" style={{marginBottom:0}}>
                  <label>Background Gradient (CSS)</label>
                  <input value={c.bg} onChange={e => storySetChapter(i, "bg", e.target.value)}
                    placeholder="linear-gradient(160deg, #2A1208 0%, #6B3A10 55%, #1A0A04 100%)"
                    style={{fontFamily:"monospace",fontSize:".78rem"}}/>
                </div>
              </div>
            ))}
          </div>

          <button onClick={storyAddChapter}
            style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
              cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
              fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
            + Add Chapter
          </button>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveStory}>Save Story Chapters</button>
            {storySaved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {heroCrop.cropProps && <ImageCropModal {...heroCrop.cropProps} />}
      {storyCrop.cropProps && <ImageCropModal {...storyCrop.cropProps} />}
    </div>
  );
}
