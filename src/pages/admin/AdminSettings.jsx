import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadHeroSlideImage, uploadStoryChapterImage } from "../../firebase/storageService";
import { DEFAULT_HERO_SLIDES, HERO_PAGE_OPTIONS, DEFAULT_TRUST_ITEMS, DEFAULT_STATS_ITEMS, DEFAULT_STORY_CHAPTERS, DEFAULT_CATEGORY_ITEMS, DEFAULT_SOCIAL_LINKS, DEFAULT_TAGLINE_PHRASES } from "../HomePage";
import { DEFAULT_TERMS_ITEMS, DEFAULT_SHIPPING_ITEMS, DEFAULT_RETURN_ITEMS } from "../PolicyPage";
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

const STORE_DEFAULTS = {
  storeName: "Telugu Seemalo",
  tagline: "Authentic Cheriyal Craft",
  email: "hello@teluguseeamalo.in",
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

const CATEGORY_DEFAULTS = {
  items: DEFAULT_CATEGORY_ITEMS,
};

const SOCIAL_DEFAULTS = {
  items: DEFAULT_SOCIAL_LINKS,
};

const TERMS_DEFAULTS    = { items: DEFAULT_TERMS_ITEMS };
const SHIPPING_POLICY_DEFAULTS = { items: DEFAULT_SHIPPING_ITEMS };
const RETURN_POLICY_DEFAULTS   = { items: DEFAULT_RETURN_ITEMS };

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

export default function AdminSettings() {
  const [form, setForm]         = useState(STORE_DEFAULTS);
  const [tax, setTax]           = useState(TAX_DEFAULTS);
  const [mq, setMq]             = useState(MQ_DEFAULTS);
  const [hero, setHero]         = useState(HERO_DEFAULTS);
  const [trust, setTrust]       = useState(TRUST_DEFAULTS);
  const [stats, setStats]       = useState(STATS_DEFAULTS);
  const [story, setStory]       = useState(STORY_DEFAULTS);
  const [category, setCategory] = useState(CATEGORY_DEFAULTS);
  const [social, setSocial]     = useState(SOCIAL_DEFAULTS);
  const [terms, setTerms]                 = useState(TERMS_DEFAULTS);
  const [shippingPolicy, setShippingPolicy] = useState(SHIPPING_POLICY_DEFAULTS);
  const [returnPolicy, setReturnPolicy]     = useState(RETURN_POLICY_DEFAULTS);
  const [termsSaved, setTermsSaved]                 = useState(false);
  const [shippingPolicySaved, setShippingPolicySaved] = useState(false);
  const [returnPolicySaved, setReturnPolicySaved]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [storeSaved, setStoreSaved] = useState(false);
  const [taxSaved, setTaxSaved]     = useState(false);
  const [mqSaved, setMqSaved]       = useState(false);
  const [heroSaved, setHeroSaved]   = useState(false);
  const [trustSaved, setTrustSaved] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const [storySaved, setStorySaved] = useState(false);
  const [categorySaved, setCategorySaved] = useState(false);
  const [socialSaved, setSocialSaved] = useState(false);
  const [seo, setSeo]         = useState(SEO_DEFAULTS);
  const [seoSaved, setSeoSaved] = useState(false);
  const [responseTimes, setResponseTimes] = useState(RESPONSE_TIMES_DEFAULTS);
  const [responseTimesSaved, setResponseTimesSaved] = useState(false);
  const heroCrop  = useCropUpload(uploadHeroSlideImage, 16 / 9);
  const storyCrop = useCropUpload(uploadStoryChapterImage, 1);

  const load = () => {
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "settings", "store")),
      getDoc(doc(db, "settings", "tax")),
      getDoc(doc(db, "settings", "marquee")),
      getDoc(doc(db, "settings", "heroSlides")),
      getDoc(doc(db, "settings", "trustStrip")),
      getDoc(doc(db, "settings", "statsCounter")),
      getDoc(doc(db, "settings", "storyChapters")),
      getDoc(doc(db, "settings", "shopCategories")),
      getDoc(doc(db, "settings", "socialLinks")),
      getDoc(doc(db, "settings", "termsPolicy")),
      getDoc(doc(db, "settings", "shippingPolicy")),
      getDoc(doc(db, "settings", "returnPolicy")),
      getDoc(doc(db, "settings", "seo")),
      getDoc(doc(db, "settings", "responseTimes")),
    ]).then(([storeSnap, taxSnap, mqSnap, heroSnap, trustSnap, statsSnap, storySnap, categorySnap, socialSnap, termsSnap, shipPolSnap, retPolSnap, seoSnap, responseTimesSnap]) => {
      if (storeSnap.exists()) setForm({ ...STORE_DEFAULTS, ...storeSnap.data() });
      if (taxSnap.exists())   setTax({ ...TAX_DEFAULTS, ...taxSnap.data() });
      if (mqSnap.exists())    setMq({ ...MQ_DEFAULTS, ...mqSnap.data() });
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
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        setStats({ ...STATS_DEFAULTS, ...data, items: data.items?.length ? data.items : STATS_DEFAULTS.items });
      }
      if (storySnap.exists()) {
        const data = storySnap.data();
        setStory({ chapters: data.chapters?.length ? data.chapters : STORY_DEFAULTS.chapters });
      }
      if (categorySnap.exists()) {
        const data = categorySnap.data();
        setCategory({ items: data.items?.length ? data.items : CATEGORY_DEFAULTS.items });
      }
      if (socialSnap.exists()) {
        const data = socialSnap.data();
        setSocial({ items: data.items?.length ? data.items : SOCIAL_DEFAULTS.items });
      }
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
      if (seoSnap.exists()) setSeo({ ...SEO_DEFAULTS, ...seoSnap.data() });
      if (responseTimesSnap.exists()) {
        const data = responseTimesSnap.data();
        setResponseTimes({ items: data.items?.length ? data.items : RESPONSE_TIMES_DEFAULTS.items });
      }
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

  const handleSaveMq = async () => {
    if (!window.confirm("Save changes to the marquee strip? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "marquee"), mq);
    setMqSaved(true);
    setTimeout(() => setMqSaved(false), 2500);
  };

  const mqSetItem = (i, val) => setMq(m => ({ ...m, items: m.items.map((x, j) => j === i ? val : x) }));
  const mqRemove  = (i)      => setMq(m => ({ ...m, items: m.items.filter((_, j) => j !== i) }));
  const mqAdd     = ()       => setMq(m => ({ ...m, items: [...m.items, "✦ New item"] }));

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

  const handleSaveTrust = async () => {
    if (!window.confirm("Save changes to the trust strip? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "trustStrip"), trust);
    setTrustSaved(true);
    setTimeout(() => setTrustSaved(false), 2500);
  };
  const trustSetItem = (i, k, v) => setTrust(t => ({ ...t, items: t.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const trustAdd    = () => setTrust(t => ({ ...t, items: [...t.items, { icon: "✦", label: "New item" }] }));
  const trustRemove = (i) => setTrust(t => t.items.length <= 1 ? t : ({ ...t, items: t.items.filter((_, j) => j !== i) }));

  const handleSaveStats = async () => {
    if (!window.confirm("Save changes to the stats counter? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "statsCounter"), stats);
    setStatsSaved(true);
    setTimeout(() => setStatsSaved(false), 2500);
  };
  const statsSetItem = (i, k, v) => setStats(s => ({ ...s, items: s.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const statsAdd    = () => setStats(s => ({ ...s, items: [...s.items, { val: 0, suffix: "", label: "New Stat" }] }));
  const statsRemove = (i) => setStats(s => s.items.length <= 1 ? s : ({ ...s, items: s.items.filter((_, j) => j !== i) }));

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

  // Generic handlers for simple numbered-text-list policy pages (Terms, Shipping, Return)
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

  const savePolicy = async (docName, data, setSavedFlag, label) => {
    if (!window.confirm(`Save changes to ${label}? This will update the live site.`)) return;
    await setDoc(doc(db, "settings", docName), data);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 2500);
  };

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
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Search Engine Optimization</span>
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
              <div style={{fontSize:".8rem",color:"#2D1E12"}}>teluguseeamalo.in</div>
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

      {/* ── Hero Slides ───────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:900,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Hero Slides</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Homepage hero carousel</span>
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
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Icon row below the hero</span>
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

      {/* ── Stats Counter ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Stats Counter</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Animated count-up numbers below the marquee</span>
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
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Sticky-scroll narrative section on the homepage</span>
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

      {/* ── Shop by Category ──────────────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Shop by Category</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Category tiles on the homepage</span>
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
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Icon row in the footer</span>
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

      {/* ── Policy Pages ──────────────────────────────────────────────── */}
      <PolicyListEditor title="Terms & Conditions" subtitle="Public page: /terms"
        items={terms.items} handlers={termsH} saved={termsSaved}
        onSave={() => savePolicy("termsPolicy", terms, setTermsSaved, "Terms & Conditions")}/>

      <PolicyListEditor title="Shipping Policy" subtitle="Public page: /shipping-policy"
        items={shippingPolicy.items} handlers={shipPolH} saved={shippingPolicySaved}
        onSave={() => savePolicy("shippingPolicy", shippingPolicy, setShippingPolicySaved, "Shipping Policy")}/>

      <PolicyListEditor title="Return Policy" subtitle="Public page: /return-policy"
        items={returnPolicy.items} handlers={retPolH} saved={returnPolicySaved}
        onSave={() => savePolicy("returnPolicy", returnPolicy, setReturnPolicySaved, "Return Policy")}/>

      {/* ── Contact Page — Response Times ────────────────────────────────── */}
      <div className="admin-card" style={{maxWidth:700,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>Response Times</h3>
          <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Shown on the Contact page</span>
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

      {heroCrop.cropProps && <ImageCropModal {...heroCrop.cropProps} />}
      {storyCrop.cropProps && <ImageCropModal {...storyCrop.cropProps} />}
    </div>
  );
}

function PolicyListEditor({ title, subtitle, items, handlers, onSave, saved }) {
  return (
    <div className="admin-card" style={{maxWidth:820,marginBottom:20}}>
      <div className="admin-card-hd">
        <h3>{title} <span style={{fontWeight:500,fontSize:".78rem",color:"#9B8472",textTransform:"none",letterSpacing:0}}>({items.length} items)</span></h3>
        <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>{subtitle}</span>
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

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:14,marginTop:20,borderBottom:"1px solid #F0E8DF",paddingBottom:6}}>
      {children}
    </div>
  );
}
