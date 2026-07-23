import { useState, useEffect, useRef } from "react";
import { fmt, disc, Stars, NoImageIcon } from "../utils/helpers";
import { isWishlisted, toggleWishlist } from "../utils/wishlist";

export default function ProductCard({ p, onOpen, onAdd, delay = 0 }) {
  const wrapRef  = useRef(null);
  const tiltRef  = useRef(null);
  const tiltRaf  = useRef(null);
  const [vis, setVis]     = useState(false);
  const [loved, setLoved] = useState(() => isWishlisted(p.id));
  const [imgError, setImgError] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cleanup tilt RAF on unmount
  useEffect(() => () => { if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current); }, []);

  const handleTilt = (e) => {
    if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current);
    tiltRaf.current = requestAnimationFrame(() => {
      const el = tiltRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const rx = ((e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2)) * -9;
      const ry = ((e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2)) * 11;
      el.style.transition = "transform .08s ease";
      el.style.transform  = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });
  };

  const resetTilt = () => {
    if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current);
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = "transform .5s cubic-bezier(.25,.46,.45,.94)";
    el.style.transform  = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const handleHeart = (e) => {
    e.stopPropagation();
    setLoved(toggleWishlist(p.id));
  };

  return (
    <div ref={wrapRef} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(38px)",
      transition: `opacity .6s ${delay}ms ease, transform .6s ${delay}ms ease`,
    }}>
      <div ref={tiltRef} style={{ willChange: "transform", transformStyle: "preserve-3d" }}
        onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        <div className={`pcard ${p.stock === 0 ? "sold-out" : ""}`} onClick={() => onOpen(p)}>
          {p.comingSoon ? <div className="new-badge" style={{background:"#B7770D"}}>COMING SOON</div>
            : p.isNew && <div className="new-badge">NEW</div>}

          <div className="pcard-img">
            {p.images?.[0] && !imgError
              ? <img src={p.images[0]} alt={p.name} onError={() => setImgError(true)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <NoImageIcon/>}

            <button className={`pcard-heart${loved ? " act" : ""}`} onClick={handleHeart}
              title={loved ? "Remove from wishlist" : "Add to wishlist"}>
              {loved ? "♥" : "♡"}
            </button>

            {p.stock > 0 && p.stock <= 5 && (
              <div className="pcard-urgency">⚡ Only {p.stock} left!</div>
            )}
          </div>

          <div className="pcard-body">
            <div className="pcard-cat">{p.category}</div>
            <div className="pcard-name">{p.name}</div>
            {(p.rating > 0 || p.reviews > 0) && (
              <div className="pcard-stars"><Stars r={p.rating || 0} /><span className="rv">({p.reviews || 0})</span></div>
            )}
            <div className="pcard-price">
              <span className="price">{fmt(p.price)}</span>
              <span className="oprice">{fmt(p.originalPrice)}</span>
              <span className="disc">{disc(p.price, p.originalPrice)}% off</span>
            </div>
            <button className="pcard-add" disabled={p.comingSoon || p.stock === 0}
              onClick={e => { e.stopPropagation(); if (!p.comingSoon) onAdd(p); }}>
              {p.comingSoon ? "Coming Soon" : p.stock === 0 ? "Sold Out" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
