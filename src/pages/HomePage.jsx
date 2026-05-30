import { useState, useEffect, useRef, useCallback } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getProducts } from "../firebase/productService";
import ProductCard from "../components/ProductCard";
import MarqueeStrip from "../components/MarqueeStrip";

// ── Our Story chapters ────────────────────────────────────────────────────────
const STORY = [
  {
    eyebrow: "The Origin · 1700s",
    title:   ["Born from the", "Banks of Manair"],
    body:    "Deep in Karimnagar, Telangana, artisans discovered a technique to coat hand-turned wood with natural lacquer — vibrant reds, deep blacks, pure whites. A tradition older than 300 years.",
    bg:      "linear-gradient(160deg, #2A1208 0%, #6B3A10 55%, #1A0A04 100%)",
    accent:  "#E8A83A",
    emoji:   "🏺",
    telugu:  "కళ",
    tag:     "Since 1700s",
    stat:    { value: "300+", label: "Years of Heritage" },
  },
  {
    eyebrow: "The Artisans · Present Day",
    title:   ["48 Families,", "One Living Art"],
    body:    "Today 48 artisan families in Karimnagar carry this tradition forward — passing precise techniques from parent to child, each family with its own unmistakable signature style.",
    bg:      "linear-gradient(160deg, #0A1A0A 0%, #1E4A18 55%, #081408 100%)",
    accent:  "#6FC870",
    emoji:   "👨‍🎨",
    telugu:  "కళాకారుడు",
    tag:     "48 Artisan Families",
    stat:    { value: "48", label: "Artisan Families" },
  },
  {
    eyebrow: "The Craft · GI Certified",
    title:   ["Every Stroke,", "A Story"],
    body:    "Natural lacquer, hand-turned wood, tools passed through generations. Each piece takes 3–7 days to complete entirely by hand. No machines. No shortcuts. Pure craft.",
    bg:      "linear-gradient(160deg, #080A20 0%, #1A1A60 55%, #080A20 100%)",
    accent:  "#7AABFF",
    emoji:   "🎨",
    telugu:  "చేతిపని",
    tag:     "GI-Tagged · Certified",
    stat:    { value: "3–7", label: "Days Per Piece" },
  },
  {
    eyebrow: "The Legacy · Yours",
    title:   ["Heritage Lives", "in Your Home"],
    body:    "When you bring a Telugu Seemalo piece home, you carry 300 years of culture — a living artwork that connects your space to generations of skill, love, and Telugu heritage.",
    bg:      "linear-gradient(160deg, #1A0808 0%, #4A1818 55%, #180606 100%)",
    accent:  "#E8620A",
    emoji:   "🏠",
    telugu:  "వారసత్వం",
    tag:     "Ships from Karimnagar",
    stat:    { value: "10k+", label: "Happy Homes" },
  },
];

// ── Apple-style sticky scroll story ──────────────────────────────────────────
function StoryScroll({ setPage }) {
  const sectionRef = useRef(null);
  const [chapter, setChapter] = useState(0);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [mobile, setMobile]   = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const isMob = window.innerWidth < 768;
      const rect     = el.getBoundingClientRect();
      const offset   = isMob ? 0 : 64;
      const scrolled = -(rect.top - offset);
      const visibleH = window.innerHeight - offset;
      const total    = el.offsetHeight - visibleH;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1 - 1e-9, scrolled / total));
      setChapter(Math.floor(p * STORY.length));
    };
    const onResize = () => { setMobile(window.innerWidth < 768); onScroll(); };
    window.addEventListener("scroll", onScroll,  { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    onResize();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleTiltMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    setTilt({ x: dy * -10, y: dx * 10 });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const ch = STORY[chapter];
  const timelinePct = `${(chapter / (STORY.length - 1)) * 100}%`;


  /* ════════════════════ MOBILE ════════════════════ */
  if (mobile) return (
    <div ref={sectionRef} style={{ height: `calc(${STORY.length} * 100vh)`, position: "relative", background: "#0E0A06" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* full-bleed chapter gradients */}
        {STORY.map((c, i) => (
          <div key={i} style={{
            position: "absolute", inset: 0, background: c.bg,
            opacity: i === chapter ? 1 : 0,
            transform: `scale(${i === chapter ? 1 : 1.04})`,
            transition: "opacity .9s ease, transform 1.4s ease",
          }}>
            {/* oversized bg emoji */}
            <div style={{
              position: "absolute", fontSize: "72vw", lineHeight: 1,
              top: "2%", left: "50%", transform: "translateX(-50%) rotate(-8deg)",
              opacity: .13, userSelect: "none",
            }}>{c.emoji}</div>
            {/* telugu watermark — inside panel so it fades with chapter */}
            <div style={{
              position: "absolute", top: "11%", right: "5%",
              fontFamily: "'Noto Serif Telugu','Mandali',serif",
              fontSize: "clamp(2rem,11vw,3.4rem)", fontWeight: 700,
              color: c.accent, opacity: .07, lineHeight: 1, userSelect: "none",
            }}>{c.telugu}</div>
            {/* chapter number watermark */}
            <div style={{
              position: "absolute", top: "11%", left: "5%",
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(3.5rem,20vw,6rem)", fontWeight: 700,
              color: c.accent, opacity: .07, lineHeight: 1,
              userSelect: "none", letterSpacing: "-0.04em",
            }}>{String(i + 1).padStart(2, "0")}</div>
          </div>
        ))}

        {/* centred emoji — lower and larger */}
        <div style={{
          position: "absolute", top: "22%", left: "50%",
          transform: "translateX(-50%)", zIndex: 4, textAlign: "center",
        }}>
          <div key={`em-${chapter}`} style={{
            fontSize: "clamp(5.5rem,24vw,8rem)", lineHeight: 1,
            filter: `drop-shadow(0 0 32px ${ch.accent}70)`,
            animation: "storyFadeUp .38s ease both",
            display: "block", position: "relative", zIndex: 2,
          }}>{ch.emoji}</div>
          {[86, 136, 192].map((sz, ri) => (
            <div key={ri} style={{
              position: "absolute", top: "50%", left: "50%",
              width: sz, height: sz, borderRadius: "50%",
              border: `1px solid ${ch.accent}${["44","24","10"][ri]}`,
              transform: "translate(-50%,-50%)",
              transition: "border-color .8s ease",
              pointerEvents: "none",
            }}/>
          ))}
        </div>

        {/* frosted glass card — starts at 52% → fills bottom */}
        <div style={{
          position: "absolute", top: "52%", left: 0, right: 0, bottom: 0,
          zIndex: 5,
          background: "rgba(8,5,2,.9)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderTop: `1px solid ${ch.accent}30`,
          padding: "16px 20px 18px",
          display: "flex", flexDirection: "column",
          transition: "border-color .8s ease",
          overflow: "hidden",
        }}>

          {/* accent rule */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 2.5, borderRadius: 2, background: ch.accent,
              boxShadow: `0 0 10px ${ch.accent}cc`,
              transition: "background .8s ease",
            }}/>
            <div style={{ flex: 1, height: 1, background: `${ch.accent}18`, borderRadius: 1 }}/>
            <span style={{
              fontSize: ".56rem", fontWeight: 700, letterSpacing: ".1em",
              color: "rgba(255,255,255,.2)", textTransform: "uppercase",
            }}>{String(chapter + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}</span>
          </div>

          {/* eyebrow */}
          <div key={`ey-m-${chapter}`} style={{
            fontSize: ".75rem", fontWeight: 700, letterSpacing: ".18em",
            textTransform: "uppercase", color: ch.accent, marginBottom: 8,
            animation: "storyFadeUp .34s ease both",
          }}>{ch.eyebrow}</div>

          {/* title */}
          <h2 key={`ti-m-${chapter}`} style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(2.2rem,9.5vw,3.2rem)", fontWeight: 700,
            color: "#EAD9BC", lineHeight: 1.13, margin: "0 0 12px",
            animation: "storyFadeUp .40s .04s ease both",
          }}>{ch.title[0]} {ch.title[1]}</h2>

          {/* body */}
          <p key={`bo-m-${chapter}`} style={{
            color: "rgba(165,128,95,.95)", fontSize: "1rem", lineHeight: 1.7,
            marginBottom: 0,
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", overflow: "hidden",
            animation: "storyFadeUp .44s .08s ease both",
          }}>{ch.body}</p>

          {/* spacer pushes stat + progress to bottom */}
          <div style={{ flex: 1 }} />

          {/* stat pill */}
          <div key={`st-m-${chapter}`} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "9px 14px", borderRadius: 10, alignSelf: "flex-start",
            background: `${ch.accent}16`, border: `1px solid ${ch.accent}32`,
            marginBottom: 14,
            animation: "storyFadeUp .44s .12s ease both",
            transition: "background .8s ease, border-color .8s ease",
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(2rem,8.5vw,2.8rem)", fontWeight: 700,
              color: ch.accent, lineHeight: 1,
            }}>{ch.stat.value}</span>
            <div style={{ width: 1, height: 28, background: `${ch.accent}38` }}/>
            <span style={{
              fontSize: ".72rem", fontWeight: 700, letterSpacing: ".12em",
              textTransform: "uppercase", color: "rgba(255,255,255,.4)", lineHeight: 1.4,
            }}>{ch.stat.label}</span>
          </div>

          {chapter === STORY.length - 1 && (
            <button key="cta-m" onClick={() => setPage("about")} style={{
              background: "#C9901A", border: "none", borderRadius: 10,
              color: "#fff", padding: "11px 20px", cursor: "pointer",
              fontWeight: 700, fontSize: ".82rem", width: "100%",
              marginBottom: 12,
              animation: "storyFadeUp .44s .15s ease both",
            }}>Discover Our Full Story →</button>
          )}

          {/* progress bar */}
          <div style={{ display: "flex", gap: 5, marginTop: 14 }}>
            {STORY.map((s, i) => (
              <div key={i} style={{
                height: 2.5, borderRadius: 2,
                flex: i === chapter ? "0 0 24px" : "0 0 6px",
                background: i === chapter ? ch.accent : "rgba(255,255,255,.13)",
                transition: "all .4s ease",
              }}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ════════════════════ DESKTOP ════════════════════ */
  return (
    <div ref={sectionRef} style={{ height: `calc(${STORY.length} * (100vh - 64px))`, position: "relative", background: "#0E0A06" }}>
      <div style={{
        position: "sticky", top: 64, height: "calc(100vh - 64px)",
        overflow: "hidden", display: "flex", background: "#0E0A06",
      }}>

        {/* ── Left text panel ────────────────────── */}
        <div style={{
          width: "44%", padding: "0 52px 0 72px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          position: "relative", zIndex: 2,
          background: "linear-gradient(90deg, #0E0A06 82%, transparent 100%)",
        }}>
          {/* giant chapter number */}
          <div style={{
            position: "absolute", bottom: -10, left: 52,
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(7rem,16vw,12rem)", fontWeight: 700,
            color: ch.accent, opacity: .07, lineHeight: 1,
            userSelect: "none", pointerEvents: "none",
            letterSpacing: "-0.04em", transition: "color .8s ease",
          }}>{String(chapter + 1).padStart(2, "0")}</div>

          {/* vertical timeline */}
          <div style={{ position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", height: 160, width: 20, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1.5, background: "rgba(255,255,255,.1)", transform: "translateX(-50%)" }}/>
            <div style={{
              position: "absolute", left: "50%", top: 0, width: 1.5,
              height: timelinePct, background: ch.accent, transform: "translateX(-50%)",
              transition: "height .5s ease, background .8s ease",
              boxShadow: `0 0 6px ${ch.accent}88`,
            }}/>
            {STORY.map((s, i) => (
              <div key={i} style={{
                position: "absolute", left: "50%",
                top: `${(i / (STORY.length - 1)) * 100}%`,
                transform: "translate(-50%,-50%)",
                width: i === chapter ? 10 : 6, height: i === chapter ? 10 : 6,
                borderRadius: "50%",
                background: i <= chapter ? s.accent : "rgba(255,255,255,.18)",
                border: i === chapter ? `2px solid ${s.accent}` : "none",
                boxShadow: i === chapter ? `0 0 10px ${s.accent}` : "none",
                transition: "all .35s ease", zIndex: 2,
              }}/>
            ))}
          </div>

          <div key={`ey-${chapter}`} style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: ch.accent, marginBottom: 18, animation: "storyFadeUp .45s ease both" }}>{ch.eyebrow}</div>
          <h2 key={`ti-${chapter}`} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2.2rem,3.8vw,3.4rem)", fontWeight: 700, color: "#E8D5B0", lineHeight: 1.15, margin: "0 0 18px", animation: "storyFadeUp .5s .05s ease both" }}>{ch.title[0]}<br/>{ch.title[1]}</h2>
          <p key={`bo-${chapter}`} style={{ color: "#8B7060", fontSize: ".96rem", lineHeight: 1.78, maxWidth: 380, marginBottom: 20, animation: "storyFadeUp .55s .1s ease both" }}>{ch.body}</p>

          {/* stat */}
          <div key={`st-${chapter}`} style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 32, animation: "storyFadeUp .55s .14s ease both" }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2.4rem,4vw,3rem)", fontWeight: 700, color: ch.accent, lineHeight: 1 }}>{ch.stat.value}</span>
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.32)" }}>{ch.stat.label}</span>
          </div>

          {chapter === STORY.length - 1 && (
            <button key="cta" onClick={() => setPage("about")} style={{ alignSelf: "flex-start", background: "#C9901A", border: "none", borderRadius: 10, color: "#fff", padding: "13px 28px", cursor: "pointer", fontWeight: 700, fontSize: ".88rem", letterSpacing: ".03em", animation: "storyFadeUp .55s .15s ease both" }}>
              Discover Our Full Story →
            </button>
          )}
        </div>

        {/* ── Right visual panel ─────────────────── */}
        <div onMouseMove={handleTiltMove} onMouseLeave={resetTilt}
          style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {STORY.map((c, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0, background: c.bg,
              opacity: i === chapter ? 1 : 0,
              transform: `scale(${i === chapter ? 1 : 1.07})`,
              transition: "opacity .85s ease, transform 1.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ position: "absolute", fontSize: "min(38vw,280px)", lineHeight: 1, opacity: .12, userSelect: "none", transform: "rotate(-12deg)" }}>{c.emoji}</div>
              <div style={{ position: "absolute", top: "10%", right: "8%", fontFamily: "'Noto Serif Telugu','Mandali',serif", fontSize: "clamp(3rem,7vw,6rem)", fontWeight: 700, color: c.accent, opacity: .12, lineHeight: 1, userSelect: "none" }}>{c.telugu}</div>

              {/* 3D-tilt card */}
              <div style={{
                position: "relative", zIndex: 2, textAlign: "center",
                background: "rgba(0,0,0,.38)", backdropFilter: "blur(10px)",
                borderRadius: 22, padding: "36px 52px", border: `1px solid ${c.accent}28`,
                transform: i === chapter ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : "perspective(900px) rotateX(0deg) rotateY(0deg)",
                transition: tilt.x === 0 && tilt.y === 0 ? "transform .6s ease" : "transform .08s ease",
                boxShadow: i === chapter && (tilt.x !== 0 || tilt.y !== 0)
                  ? `${-tilt.y * 2}px ${tilt.x * 2}px 32px rgba(0,0,0,.45), inset 0 0 24px ${c.accent}12`
                  : "0 20px 60px rgba(0,0,0,.3)",
              }}>
                <div style={{ fontSize: "clamp(3rem,7vw,5.5rem)", marginBottom: 14 }}>{c.emoji}</div>
                <div style={{ fontFamily: "'Noto Serif Telugu','Mandali',serif", fontSize: "clamp(1.6rem,3.5vw,2.8rem)", color: c.accent, fontWeight: 700, marginBottom: 10 }}>{c.telugu}</div>
                <div style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>{c.tag}</div>
              </div>

              {[200, 320, 450].map((sz, ri) => (
                <div key={ri} style={{ position: "absolute", width: sz, height: sz, border: `1px solid ${c.accent}15`, borderRadius: "50%", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}/>
              ))}
            </div>
          ))}
        </div>

        {/* right-edge dot nav */}
        <div style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
          {STORY.map((_, i) => (
            <div key={i} style={{
              width: i === chapter ? 8 : 5, height: i === chapter ? 8 : 5,
              borderRadius: "50%",
              background: i === chapter ? ch.accent : "rgba(255,255,255,.22)",
              transition: "all .3s ease",
              boxShadow: i === chapter ? `0 0 8px ${ch.accent}` : "none",
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 1. Typewriter ─────────────────────────────────────────────────────────────
const PHRASES = [
  "Handcrafted with Centuries of Tradition",
  "GI-Tagged · Certified Authentic",
  "Supporting 48 Artisan Families",
  "Shipped from Karimnagar, Telangana",
];

function Typewriter() {
  const [{ text, idx, del }, set] = useState({ text: "", idx: 0, del: false });
  useEffect(() => {
    const full = PHRASES[idx];
    const delay = del
      ? (text.length > 0 ? 42 : 320)
      : (text.length < full.length ? 76 : 1700);
    const t = setTimeout(() => {
      if (!del) {
        if (text.length < full.length)
          set(s => ({ ...s, text: PHRASES[s.idx].slice(0, s.text.length + 1) }));
        else
          set(s => ({ ...s, del: true }));
      } else {
        if (text.length > 0)
          set(s => ({ ...s, text: s.text.slice(0, -1) }));
        else
          set(s => ({ text: "", idx: (s.idx + 1) % PHRASES.length, del: false }));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, idx, del]);

  return (
    <span className="tw-line">
      {text || " "}<span className="tw-cursor" />
    </span>
  );
}

// ── 2. Spark Button ───────────────────────────────────────────────────────────
function SparkBtn({ children, className, onClick }) {
  const [sparks, setSparks] = useState([]);
  const btnRef = useRef(null);

  const fire = useCallback((e) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const ts = Date.now();
    const batch = Array.from({ length: 16 }, (_, i) => ({
      id: `${ts}-${i}`,
      x: cx, y: cy,
      angle: (i / 16) * Math.PI * 2 + (Math.random() - .5) * .5,
      dist: 26 + Math.random() * 42,
      size: 2.5 + Math.random() * 3.5,
      color: ["#E8620A","#FFD700","#FF8C00","#FFA040","#FFE08A","#FF6030"][i % 6],
      active: false,
    }));
    setSparks(s => [...s, ...batch]);
    requestAnimationFrame(() => requestAnimationFrame(() =>
      setSparks(s => s.map(sp => batch.some(b => b.id === sp.id) ? { ...sp, active: true } : sp))
    ));
    setTimeout(() => setSparks(s => s.filter(sp => !batch.some(b => b.id === sp.id))), 750);
    if (onClick) setTimeout(onClick, 160);
  }, [onClick]);

  return (
    <button ref={btnRef} className={className}
      style={{ position: "relative", overflow: "visible" }}
      onClick={fire}>
      {children}
      {sparks.map(sp => (
        <span key={sp.id} style={{
          position: "absolute",
          left: sp.x, top: sp.y,
          width: sp.size, height: sp.size,
          borderRadius: "50%",
          background: sp.color,
          pointerEvents: "none",
          transform: `translate(-50%,-50%) translate(${Math.cos(sp.angle)*(sp.active?sp.dist:0)}px,${Math.sin(sp.angle)*(sp.active?sp.dist:0)}px)`,
          opacity: sp.active ? 0 : 1,
          transition: sp.active ? "transform .55s cubic-bezier(.2,1,.4,1),opacity .48s ease-out .1s" : "none",
          zIndex: 10,
        }} />
      ))}
    </button>
  );
}

// ── 3. Scroll Reveal ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 42 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity .65s ${delay}ms ease, transform .65s ${delay}ms ease`,
    }}>
      {children}
    </div>
  );
}

// ── 4. Stats Counter ──────────────────────────────────────────────────────────
const STATS = [
  { val: 200, suffix: "+", label: "Handcrafted Products" },
  { val: 5000, suffix: "+", label: "Happy Customers" },
  { val: 48, suffix: "",   label: "Artisan Families" },
  { val: 300, suffix: "+", label: "Years of Heritage" },
];

function StatItem({ val, suffix, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) {
        fired.current = true;
        const dur = 1800, t0 = performance.now();
        const step = now => {
          const p = Math.min((now - t0) / dur, 1);
          setCount(Math.round(val * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [val]);

  return (
    <div ref={ref} style={{ textAlign: "center", padding: "0 8px" }}>
      <div style={{
        fontFamily: "'Cormorant Garamond',serif",
        fontSize: "clamp(2.2rem,4.5vw,3.4rem)",
        fontWeight: 700, color: "#E8620A", lineHeight: 1.1,
      }}>
        {count.toLocaleString("en-IN")}{suffix}
      </div>
      <div style={{
        fontSize: ".82rem", color: "var(--mt)", fontWeight: 600,
        letterSpacing: ".07em", textTransform: "uppercase", marginTop: 7,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── 5. Mandala Ring ───────────────────────────────────────────────────────────
function MandalaRing({ size, border, dotColor, dotCount, radius, spin, dotSize = 6, speed }) {
  return (
    <div style={{
      position: "absolute",
      width: size, height: size,
      borderRadius: "50%",
      border,
      animation: `${spin === "cw" ? "spin-cw" : "spin-ccw"} ${speed}s linear infinite`,
    }}>
      {Array.from({ length: dotCount }, (_, i) => {
        const a = (i / dotCount) * Math.PI * 2;
        return (
          <div key={i} style={{
            position: "absolute",
            width: dotSize, height: dotSize,
            borderRadius: dotSize <= 5 ? 2 : "50%",
            background: dotColor,
            top: `calc(50% + ${(Math.sin(a) * radius).toFixed(2)}px - ${dotSize / 2}px)`,
            left: `calc(50% + ${(Math.cos(a) * radius).toFixed(2)}px - ${dotSize / 2}px)`,
          }} />
        );
      })}
    </div>
  );
}

// ── 6. Testimonials Carousel ─────────────────────────────────────────────────
function TestimonialsSection({ reviews }) {
  const [idx, setIdx]       = useState(0);
  const [visible, setVis]   = useState(true);
  const [paused, setPaused] = useState(false);
  const idxRef              = useRef(0);

  const go = useCallback((n) => {
    setVis(false);
    setTimeout(() => { idxRef.current = n; setIdx(n); setVis(true); }, 300);
  }, []);

  useEffect(() => {
    if (paused || !reviews.length) return;
    const t = setInterval(() => go((idxRef.current + 1) % reviews.length), 5000);
    return () => clearInterval(t);
  }, [paused, go, reviews.length]);

  if (!reviews.length) return null;
  const r = reviews[idx];
  const ARR = { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", color:"#BFB09A", width:38, height:38, borderRadius:"50%", cursor:"pointer", fontSize:"1.2rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0 };

  return (
    <div style={{ background:"var(--dk)", padding:"64px 20px" }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="sec-hd" style={{ marginBottom:36 }}>
        <h2 style={{ color:"#fff" }}>What Our Customers Say</h2>
        <div className="divider"/>
        <p style={{ color:"#BFB09A" }}>Trusted by thousands of art lovers across India</p>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div style={{
          background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:20, padding:"clamp(24px,4vw,42px) clamp(20px,5vw,48px)",
          textAlign:"center", minHeight:220,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(14px)",
          transition:"opacity .3s ease, transform .3s ease",
        }}>
          <div style={{ color:"#F0BB50", fontSize:"1.1rem", letterSpacing:3, marginBottom:18 }}>
            {"★".repeat(r.rating)}
          </div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1rem,2.5vw,1.12rem)", color:"#E8DDD0", lineHeight:1.8, fontStyle:"italic", marginBottom:24, position:"relative" }}>
            <span style={{ fontSize:"3.5rem", color:"var(--sf)", opacity:.3, lineHeight:.4, verticalAlign:"middle", marginRight:4, fontStyle:"normal" }}>"</span>
            {r.text}
            <span style={{ fontSize:"3.5rem", color:"var(--sf)", opacity:.3, lineHeight:.4, verticalAlign:"middle", marginLeft:4, fontStyle:"normal" }}>"</span>
          </p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,var(--sf),var(--gd))", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:"1rem", fontFamily:"'Cormorant Garamond',serif", flexShrink:0 }}>
              {r.init}
            </div>
            <div style={{ textAlign:"left" }}>
              <strong style={{ color:"#fff", fontSize:".92rem", display:"block" }}>{r.name}</strong>
              <span style={{ color:"#9B8472", fontSize:".78rem" }}>{r.loc} · {r.product}</span>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:18, marginTop:26 }}>
          <button style={ARR}
            onClick={() => go((idxRef.current - 1 + reviews.length) % reviews.length)}
            onMouseEnter={e => { e.currentTarget.style.background="var(--sf)"; e.currentTarget.style.borderColor="var(--sf)"; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="#BFB09A"; }}>
            ‹
          </button>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            {reviews.map((_, i) => (
              <button key={i} onClick={() => go(i)} style={{
                width: i === idx ? 22 : 7, height:7,
                borderRadius: i === idx ? 4 : "50%",
                background: i === idx ? "var(--sf)" : "rgba(255,255,255,.22)",
                border:"none", cursor:"pointer", padding:0,
                transition:"all .28s ease",
              }}/>
            ))}
          </div>
          <button style={ARR}
            onClick={() => go((idxRef.current + 1) % reviews.length)}
            onMouseEnter={e => { e.currentTarget.style.background="var(--sf)"; e.currentTarget.style.borderColor="var(--sf)"; e.currentTarget.style.color="#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="#BFB09A"; }}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NEW: Cursor Ink Trail (canvas) ───────────────────────────────────────────
function InkCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const setSize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    const COLORS = ["#E8620A","#C9901A","#FFD700","#FF8C38","#FFA040","#FFE08A"];
    const particles = [];
    let raf = null;

    const tick = () => {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.globalAlpha = Math.max(0, p.life * p.alpha);
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.r), 0, Math.PI * 2);
        ctx.fill();
        p.x    += p.vx;
        p.y    += p.vy;
        p.r    *= 0.96;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      raf = particles.length > 0 ? requestAnimationFrame(tick) : null;
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: x + (Math.random() - .5) * 10,
          y: y + (Math.random() - .5) * 10,
          r: 2.5 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: .65 + Math.random() * .35,
          life: 1,
          vx: (Math.random() - .5) * 1.6,
          vy: -(Math.random() * 1.8 + .3),
          decay: .022 + Math.random() * .022,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 6,
    }} />
  );
}

// ── NEW: SVG Wave Divider ─────────────────────────────────────────────────────
function Wave({ from, to, flip = false, h = 72 }) {
  return (
    <div style={{ background: from, lineHeight: 0, display: "block", overflow: "hidden" }}>
      <svg viewBox={`0 0 1440 ${h}`} preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: h, transform: flip ? "scaleX(-1)" : "none" }}>
        <path d={`M0,${h*.5} C360,${h} 720,0 1080,${h*.5} S1440,${h} 1440,${h*.35} L1440,${h} L0,${h} Z`}
          fill={to} />
      </svg>
    </div>
  );
}

// ── NEW: Floating Embers ──────────────────────────────────────────────────────
function Embers() {
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      dur: 5 + Math.random() * 6,
      col: ["rgba(232,98,10,.7)","rgba(201,144,26,.6)","rgba(255,200,60,.5)","rgba(255,140,50,.55)"][i % 4],
      diamond: Math.random() > .5,
    }))
  );
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          bottom: "-10px",
          left: `${p.x}%`,
          width: p.size,
          height: p.size,
          borderRadius: p.diamond ? "2px" : "50%",
          background: p.col,
          transform: p.diamond ? "rotate(45deg)" : "none",
          animation: `ember-rise ${p.dur}s ${p.delay}s ease-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── NEW: Self-Drawing Brush Stroke ────────────────────────────────────────────
function BrushStroke() {
  return (
    <svg className="brush-svg" viewBox="0 0 260 22" preserveAspectRatio="none" aria-hidden="true">
      <path
        className="brush-path"
        d="M4 16 C55 6, 105 18, 130 12 S200 4, 256 14"
        stroke="var(--sf)"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const REVIEW_DEFAULTS = [
  { id:"r1", init:"PR", name:"Priya Reddy",   loc:"Hyderabad",  rating:5, product:"Lacquer Art Pot",        text:"The pot I ordered is breathtaking! The intricate brushwork and vibrant colours are even more beautiful in person. It's now the centrepiece of my living room." },
  { id:"r2", init:"AK", name:"Anil Kumar",    loc:"Bangalore",  rating:5, product:"Artisan Wall Clock",     text:"Gifted this clock to my parents for their anniversary. They were moved to tears by the authentic craftsmanship. Delivered ahead of schedule — couldn't be happier." },
  { id:"r3", init:"MS", name:"Meera Sharma",  loc:"Mumbai",     rating:5, product:"Heritage Bed Sheet Set", text:"These bed sheets are a work of art! Every morning feels special waking up surrounded by these gorgeous traditional patterns. Truly a piece of Telangana's heritage." },
  { id:"r4", init:"RT", name:"Ravi Teja",     loc:"Chennai",    rating:5, product:"Artisan Home Decor",     text:"As someone who values authentic Indian handicrafts, Telugu Seemalo delivers exactly what they promise — GI-certified, handcrafted pieces with a story behind every stroke." },
  { id:"r5", init:"SN", name:"Sunitha Nair",  loc:"Kochi",      rating:5, product:"Artisan Curtain Pair",   text:"The curtains transformed my living room completely! The colours are so rich and the quality is exceptional. This is my second order and I'm already planning a third." },
  { id:"r6", init:"VP", name:"Venkat Prasad", loc:"Vijayawada", rating:5, product:"Lacquer Art Pot",        text:"Proud to display a GI-tagged piece of our own Telugu heritage at home. The artisans' skill is extraordinary — every line is so precise and full of meaning." },
];

export default function HomePage({ setPage, onOpen, onAdd }) {
  const [featured, setFeatured]       = useState([]);
  const [siteReviews, setSiteReviews] = useState([]);
  const [mounted, setMounted]         = useState(false);
  const [glow, setGlow]               = useState({ x: 0, y: 0, active: false });

  const slowRef  = useRef(null);
  const midRef   = useRef(null);
  const fastRef  = useRef(null);
  const rafRef   = useRef(null);
  const heroRef  = useRef(null);

  useEffect(() => {
    getProducts().then(all =>
      setFeatured(all.filter(p => p.isNew || p.rating >= 4.8).slice(0, 4))
    );
    getDoc(doc(db, "settings", "siteReviews"))
      .then(snap => {
        const items = snap.exists() ? (snap.data().items || []) : [];
        setSiteReviews(items.filter(r => r.visible !== false).length > 0
          ? items.filter(r => r.visible !== false)
          : REVIEW_DEFAULTS);
      })
      .catch(() => setSiteReviews(REVIEW_DEFAULTS));
  }, []);

  // Staggered entrance — trigger after first paint
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Parallax scroll
  useEffect(() => {
    const tick = () => {
      const y = window.scrollY;
      if (slowRef.current)  slowRef.current.style.transform  = `translateY(${y * 0.15}px)`;
      if (midRef.current)   midRef.current.style.transform   = `translateY(${y * 0.40}px)`;
      if (fastRef.current)  fastRef.current.style.transform  = `translateY(${y * 0.65}px)`;
      rafRef.current = null;
    };
    const onScroll = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mouse-reactive glow handlers
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);
  const handleMouseLeave = useCallback(() => setGlow(g => ({ ...g, active: false })), []);

  // Staggered entrance helper
  const fi = (delay) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(32px)",
    transition: `opacity .78s ${delay}ms ease, transform .78s ${delay}ms ease`,
  });

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        className="hero"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Cursor ink trail */}
        <InkCanvas />

        {/* Mouse-reactive glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: glow.active
            ? `radial-gradient(600px circle at ${glow.x}px ${glow.y}px, rgba(232,98,10,.13) 0%, rgba(201,144,26,.06) 40%, transparent 70%)`
            : "none",
          transition: "background .12s ease",
        }} />

        {/* Floating embers */}
        <Embers />

        {/* Mandala rings */}
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:0,pointerEvents:"none",overflow:"hidden" }}>
          <MandalaRing size={580} radius={290} border="1px solid rgba(201,144,26,.09)"  dotColor="rgba(201,144,26,.24)"  dotCount={6} spin="cw"  dotSize={7} speed={34} />
          <MandalaRing size={360} radius={180} border="1.5px solid rgba(232,98,10,.14)" dotColor="rgba(232,98,10,.27)"   dotCount={8} spin="ccw" dotSize={5} speed={21} />
          <MandalaRing size={185} radius={92}  border="1px solid rgba(228,191,145,.14)" dotColor="rgba(228,191,145,.29)" dotCount={5} spin="cw"  dotSize={4} speed={13} />
        </div>

        {/* Parallax layer 1 — slow 0.15× */}
        <div ref={slowRef} style={{ position:"absolute",inset:"-30% 0",zIndex:0,pointerEvents:"none",willChange:"transform" }}>
          <div style={{ position:"absolute",top:"10%",left:"6%",width:200,height:200,borderRadius:"50%",border:"1px solid rgba(228,191,145,.07)" }} />
          <div style={{ position:"absolute",bottom:"8%",right:"8%",width:260,height:260,borderRadius:"50%",border:"1px solid rgba(232,98,10,.06)" }} />
        </div>

        {/* Parallax layer 2 — medium 0.40× */}
        <div ref={midRef} style={{ position:"absolute",inset:"-30% 0",zIndex:0,pointerEvents:"none",willChange:"transform" }}>
          <div style={{ position:"absolute",top:"18%",left:"9%",width:72,height:72,borderRadius:"50%",border:"1.5px solid rgba(232,98,10,.18)" }} />
          <div style={{ position:"absolute",top:"60%",left:"5%",width:38,height:38,borderRadius:"50%",background:"rgba(232,98,10,.08)" }} />
          <div style={{ position:"absolute",top:"22%",right:"9%",width:56,height:56,borderRadius:"50%",border:"1px solid rgba(228,191,145,.16)" }} />
          <div style={{ position:"absolute",top:"68%",right:"6%",width:90,height:90,borderRadius:"50%",border:"1.5px solid rgba(232,98,10,.12)" }} />
          <div style={{ position:"absolute",top:"8%",right:"28%",width:10,height:10,borderRadius:"50%",background:"rgba(232,98,10,.32)" }} />
          <div style={{ position:"absolute",top:"78%",left:"32%",width:7,height:7,borderRadius:"50%",background:"rgba(228,191,145,.38)" }} />
        </div>

        {/* Parallax layer 3 — fast 0.65× */}
        <div ref={fastRef} style={{ position:"absolute",inset:"-30% 0",zIndex:0,pointerEvents:"none",willChange:"transform" }}>
          <div style={{ position:"absolute",top:"15%",left:"22%",width:18,height:18,borderRadius:3,border:"1.5px solid rgba(232,98,10,.26)",transform:"rotate(45deg)" }} />
          <div style={{ position:"absolute",top:"72%",right:"22%",width:14,height:14,borderRadius:2,border:"1px solid rgba(228,191,145,.28)",transform:"rotate(30deg)" }} />
          <div style={{ position:"absolute",top:"35%",right:"3%",width:10,height:10,borderRadius:2,background:"rgba(232,98,10,.2)",transform:"rotate(45deg)" }} />
          <div style={{ position:"absolute",top:"55%",left:"14%",width:8,height:8,borderRadius:"50%",background:"rgba(228,191,145,.22)" }} />
        </div>

        {/* Content — staggered entrance */}
        <div style={{ position: "relative", zIndex: 1 }}>

          <div style={fi(0)}>
            <span className="hero-tel">హస్తకళ</span>
          </div>

          {/* Heading with brush stroke */}
          <div style={fi(150)}>
            <h1>
              Authentic{" "}
              <span style={{ display:"inline-block", position:"relative" }}>
                <em className="shimmer-txt">Handcrafted</em>
                <BrushStroke />
              </span>
              <br />Lacquer Art
            </h1>
          </div>

          <div style={fi(300)}>
            <div className="tw-wrap"><Typewriter /></div>
          </div>

          <div style={fi(430)}>
            <p>GI-tagged handcrafted treasures from the heart of Karimnagar, Telangana — bringing centuries of artisan tradition to your home.</p>
          </div>

          <div style={fi(560)}>
            <div className="hero-btns">
              <SparkBtn className="btn-sf" onClick={() => setPage("shop")}>Shop Now</SparkBtn>
              <button className="btn-out" onClick={() => setPage("about")}>Our Story</button>
            </div>
          </div>

          <div style={fi(680)}>
            <div className="gi-badge">🏅 GI Tag Registered · Government of India</div>
          </div>

        </div>
      </div>

      {/* TRUST */}
      <div className="trust">
        {[["🚚","Free Delivery above ₹999"],["🏅","GI-Tagged Authentic Art"],["↩","Easy 7-day Returns"],["🎁","Gift Wrapping Available"]].map(([ic, lb]) => (
          <div key={lb} className="trust-item"><span>{ic}</span><span>{lb}</span></div>
        ))}
      </div>

      {/* MARQUEE STRIP */}
      <MarqueeStrip />
      <Wave from="#E8620A" to="#fff" />

      {/* STATS COUNTER */}
      <div style={{ background: "#fff", padding: "54px 20px", borderBottom: "1px solid #F0E6D8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 36 }}>
          {STATS.map(s => <StatItem key={s.label} {...s} />)}
        </div>
      </div>

      <Wave from="#fff" to="#0E0A06" flip />

      {/* OUR STORY — sticky scroll */}
      <StoryScroll setPage={setPage} />

      <Wave from="#0E0A06" to="#FDF8F3" />

      {/* FEATURED */}
      <div className="sec">
        <Reveal>
          <div className="sec-hd">
            <h2>Featured Products</h2>
            <div className="divider" />
            <p>Handpicked bestsellers and new arrivals</p>
          </div>
        </Reveal>
        {featured.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--mt)" }}>Loading products…</div>
        ) : (
          <div className="pgrid">
            {featured.map((p, i) => (
              <ProductCard key={p.docId || p.id} p={p} onOpen={onOpen} onAdd={() => onAdd(p)}
                delay={i * 110} />
            ))}
          </div>
        )}
        <Reveal delay={160}>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <SparkBtn className="btn-sf" onClick={() => setPage("shop")}>View All Products</SparkBtn>
          </div>
        </Reveal>
      </div>

      <Wave from="#FDF8F3" to="#18100A" flip />

      {/* TESTIMONIALS */}
      <TestimonialsSection reviews={siteReviews} />

      <Wave from="#18100A" to="#FFFCF7" />

      {/* CATEGORIES */}
      <div style={{ background: "var(--iv)", padding: "50px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div className="sec-hd"><h2>Shop by Category</h2><div className="divider" /></div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16 }}>
            {[["🏺","Pots"],["🕰️","Clocks"],["🪟","Curtains"],["🛏️","Bed Sheets"],["🎨","Home Decor"]].map(([em, cat], i) => (
              <Reveal key={cat} delay={i * 80}>
                <div onClick={() => setPage("shop")}
                  style={{ background: "#fff", borderRadius: 14, padding: "24px 16px", textAlign: "center", cursor: "pointer", boxShadow: "var(--sh)", transition: "all .2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: "2.4rem", marginBottom: 10 }}>{em}</div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--dk)" }}>{cat}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
