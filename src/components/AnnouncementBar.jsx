import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function AnnouncementBar() {
  const [cfg, setCfg]           = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then(snap => { if (snap.exists()) setCfg(snap.data()); })
      .catch(() => {});
  }, []);

  if (!cfg?.bannerEnabled || dismissed) return null;

  return (
    <div className="ann-bar" style={{ background: cfg.bannerBg || "#E8620A", color: cfg.bannerColor || "#fff" }}>
      <span className="ann-bar-text">{cfg.bannerText || ""}</span>
      <button className="ann-bar-close" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
    </div>
  );
}
