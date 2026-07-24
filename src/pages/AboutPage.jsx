import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export const DEFAULT_ABOUT = {
  heroTitle: "Our Story",
  heroSubtitle: "Preserving the 400-year-old legacy of Cheriyal lacquer art from Karimnagar, Telangana.",
  storyImage: "",
  storyEmoji: "🏺",
  storyHeading: "The Art of Cheriyal",
  storyParagraphs: [
    "Cheriyal is a small town in Karimnagar district of Telangana, home to a 400-year-old tradition of lacquer art. Local artisans hand-paint clay pots, wooden objects, and textiles using natural pigments and traditional techniques passed down through generations.",
    "This craft is recognised as an authentic cultural heritage of Telangana.",
  ],
  storyFeatures: [
    { icon: "🏅", text: "Recognised Cultural Heritage of Telangana" },
    { icon: "👨‍🎨", text: "Supporting 50+ artisan families in Karimnagar" },
    { icon: "🌿", text: "Natural lacquer pigments – no harmful chemicals" },
    { icon: "📦", text: "Direct from artisan to your doorstep" },
  ],
  whyHeading: "Why Telugu Seemalo?",
  whyItems: [
    { icon: "🤝", title: "Direct from Artisans", desc: "We source directly from certified Cheriyal artisans — no middlemen — so more money reaches the craftspeople." },
    { icon: "✅", title: "Authenticity Guaranteed", desc: "Every product comes with a certification card confirming its authentic Cheriyal origin." },
    { icon: "🌱", title: "Eco-friendly Craft", desc: "Natural lacquer paints derived from plant and mineral sources — safe for families and the environment." },
    { icon: "💝", title: "Gifting Excellence", desc: "Premium packaging with a handwritten note option — perfect for festivals, weddings, and corporate gifting." },
  ],
  ctaLabel: "Explore Our Collection",
};

export default function AboutPage({setPage}) {
  const [a, setA] = useState(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", "aboutPage"))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setA({
            ...DEFAULT_ABOUT, ...data,
            storyParagraphs: data.storyParagraphs?.length ? data.storyParagraphs : DEFAULT_ABOUT.storyParagraphs,
            storyFeatures:   data.storyFeatures?.length   ? data.storyFeatures   : DEFAULT_ABOUT.storyFeatures,
            whyItems:        data.whyItems?.length        ? data.whyItems        : DEFAULT_ABOUT.whyItems,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding:"100px 20px",textAlign:"center",color:"var(--mt)"}}>Loading…</div>;

  return (
    <div>
      <div className="about-hero">
        <h1>{a.heroTitle}</h1>
        <p>{a.heroSubtitle}</p>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div className="about-grid">
          <div className="about-img">
            {a.storyImage
              ? <img src={a.storyImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit"}}/>
              : a.storyEmoji}
          </div>
          <div className="about-text">
            <h2>{a.storyHeading}</h2>
            {a.storyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
            <ul>
              {a.storyFeatures.map((f, i) => (
                <li key={i}><span>{f.icon}</span><span>{f.text}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{padding:"0 20px 60px"}}>
          <div className="sec-hd"><h2>{a.whyHeading}</h2><div className="divider"/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20}}>
            {a.whyItems.map((item, i) => (
              <div key={i} style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <div style={{fontSize:"2rem",marginBottom:12}}>{item.icon}</div>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",fontWeight:700,marginBottom:8}}>{item.title}</h3>
                <p style={{color:"var(--mt)",fontSize:".88rem",lineHeight:1.7}}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:36}}>
            <button className="btn-sf" onClick={() => setPage("shop")}>{a.ctaLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
