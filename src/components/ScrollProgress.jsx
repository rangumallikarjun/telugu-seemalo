import { useState, useEffect } from "react";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, zIndex: 9999,
      height: 3, width: `${pct}%`,
      background: "linear-gradient(90deg, #E8620A, #C9901A, #FFD700)",
      pointerEvents: "none",
      transition: "width .08s linear",
      boxShadow: "0 0 8px rgba(232,98,10,.6)",
    }} />
  );
}
