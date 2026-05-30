import { useState, useEffect, useRef, useCallback } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { getProducts } from "../firebase/productService";
import ProductCard from "../components/ProductCard";
import MarqueeStrip from "../components/MarqueeStrip";

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

      <Wave from="#fff" to="#18100A" flip />

      {/* OUR STORY */}
      <div className="story-sec">
        <div className="story-grid">
          <Reveal>
            <div className="story-content">
              <span className="story-eyebrow">Our Story</span>
              <h2 className="story-h2">Born from a<br/>300-Year-Old Craft</h2>
              <p className="story-p">
                Deep in Karimnagar, Telangana, the ancient art of lacquer painting has been
                lovingly passed down through generations — a tradition older than 300 years, still
                alive in the hands of 48 dedicated artisan families today.
              </p>
              <p className="story-p">
                Every pot, clock, and painting carries the soul of Telugu culture. GI-certified and
                handcrafted, each piece is a conversation between centuries of skill and your
                home. Telugu Seemalo exists to carry this extraordinary heritage to the world.
              </p>
              <button className="story-cta" onClick={() => setPage("about")}>
                Discover Our Full Story →
              </button>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="story-visual">
              <div className="story-card story-card-main">
                <div className="story-tel-script">కళాత్మక</div>
                <div className="story-art-icons">
                  <span>🏺</span><span>🎨</span><span>🪔</span>
                </div>
                <div className="story-since">Since 1700s · Karimnagar</div>
              </div>
              <div className="story-pill story-pill-gi">🏅 GI-Tagged</div>
              <div className="story-pill story-pill-craft">48 Artisan Families</div>
              <div className="story-ring story-ring-1" />
              <div className="story-ring story-ring-2" />
            </div>
          </Reveal>
        </div>
      </div>

      <Wave from="#18100A" to="#FDF8F3" />

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
