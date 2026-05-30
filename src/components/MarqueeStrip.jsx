import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const DEFAULT_ITEMS = [
  "🏅 GI-Tagged Authentic Art",
  "🚚 Free Delivery above ₹999",
  "⭐ 5,000+ Happy Customers",
  "🎁 Gift Wrapping Available",
  "↩ Easy 7-Day Returns",
  "🏆 Government of India Certified",
  "👨‍🎨 48 Artisan Families",
  "🌿 300+ Years of Heritage",
];

const DEFAULTS = { enabled: true, speed: 28, bg: "#E8620A", color: "#ffffff", items: DEFAULT_ITEMS };

export default function MarqueeStrip() {
  const [cfg, setCfg] = useState(DEFAULTS);

  useEffect(() => {
    getDoc(doc(db, "settings", "marquee"))
      .then(snap => { if (snap.exists()) setCfg(c => ({ ...c, ...snap.data() })); })
      .catch(() => {});
  }, []);

  if (!cfg.enabled || !cfg.items?.length) return null;

  // Duplicate items so the -50% translateX loop is seamless
  const doubled = [...cfg.items, ...cfg.items];

  return (
    <div className="mq-wrap" style={{ background: cfg.bg }}>
      <div className="mq-fade mq-fade-l" style={{ background: `linear-gradient(to right, ${cfg.bg}, transparent)` }} />
      <div className="mq-fade mq-fade-r" style={{ background: `linear-gradient(to left,  ${cfg.bg}, transparent)` }} />
      <div className="mq-track" style={{ animationDuration: `${cfg.speed}s`, color: cfg.color }}>
        {doubled.map((item, i) => (
          <span key={i} className="mq-item">
            {item}
            <span className="mq-sep">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
