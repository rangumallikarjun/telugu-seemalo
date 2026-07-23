import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { DEFAULT_CATEGORY_ITEMS, DEFAULT_SOCIAL_LINKS } from "../pages/HomePage";

const STORE_DEFAULTS = {
  storeName: "Telugu Seemalo",
  email: "hello@teluguseeamalo.in",
  phone: "+91 9876 543 210",
  address: "Karimnagar, Telangana",
  footerDescription: "Authentic Cheriyal lacquer art from Karimnagar, Telangana. Supporting artisan families since 2020.",
  footerBadgeText: "🏅 Cheriyal Art is an authentic heritage craft of Telangana, India",
  appStoreUrl: "",
  playStoreUrl: "",
};

export default function Footer({setPage}) {
  const [store, setStore] = useState(STORE_DEFAULTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_ITEMS);
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then(snap => { if (snap.exists()) setStore(s => ({ ...s, ...snap.data() })); })
      .catch(() => {});
    getDoc(doc(db, "settings", "shopCategories"))
      .then(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (Array.isArray(data.items) && data.items.length > 0) setCategories(data.items);
      })
      .catch(() => {});
    getDoc(doc(db, "settings", "socialLinks"))
      .then(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (Array.isArray(data.items) && data.items.length > 0) setSocialLinks(data.items);
      })
      .catch(() => {});
  }, []);

  return (
    <footer>
      <div className="foot-grid">
        <div className="foot-brand">
          <div className="logo">{store.storeName}</div>
          <p>{store.footerDescription}</p>
          <div className="foot-social">
            {socialLinks.map((s, i) => (
              <a key={i} href={s.url || "#"} target="_blank" rel="noreferrer" title={s.label}>{s.icon}</a>
            ))}
          </div>
        </div>
        <div className="foot-col">
          <h4>Shop</h4>
          <ul>
            {categories.map(c => (
              <li key={c.label}><button onClick={() => setPage("shop")}>{c.label}</button></li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <h4>Info</h4>
          <ul>
            {[["About Us","about"],["Shop","shop"],["Terms & Conditions","terms"],["Shipping Policy","shipping-policy"],["Return Policy","return-policy"]].map(([l,p]) => (
              <li key={l}><button onClick={() => setPage(p)}>{l}</button></li>
            ))}
            <li><button onClick={() => setPage("contact")} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontFamily:"inherit",fontSize:"inherit",padding:0,textAlign:"left"}}>Contact Us</button></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Contact</h4>
          <ul>
            <li><span>📧 {store.email}</span></li>
            <li><span>📞 {store.phone}</span></li>
            <li><span>📍 {store.address}</span></li>
          </ul>
          <div className="foot-pay">
            {["UPI","Visa","Mastercard","Razorpay"].map(p => <span key={p} className="pay-badge">{p}</span>)}
          </div>
          {(store.appStoreUrl || store.playStoreUrl) && (
            <div className="foot-apps">
              {store.appStoreUrl && (
                <a href={store.appStoreUrl} target="_blank" rel="noreferrer" className="app-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.7 12.5c0-3.1 2.5-4.6 2.6-4.7-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 12 1 1.5 2.1 3.1 3.7 3.1 1.5-.1 2-.9 3.8-.9s2.3.9 3.9.9c1.6 0 2.6-1.5 3.6-3 .9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.9zM15.9 3.5c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.7.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.6-1.7z"/></svg>
                  <span><small>Download on the</small>App Store</span>
                </a>
              )}
              {store.playStoreUrl && (
                <a href={store.playStoreUrl} target="_blank" rel="noreferrer" className="app-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.6c-.4.3-.6.8-.6 1.4v16c0 .6.2 1.1.6 1.4l.1.1L13 12.5v-.1L3.7 2.5l-.1.1zm11.2 11.2L4.3 22.4c.4.3.9.3 1.5 0l11-6.4-1.9-2.2zm2.7-3.7L15 12.5l2.5 2.5 3.7-2.1c1.1-.6 1.1-1.6 0-2.2l-3.7-2.1zM14.8 12l2.7-2.7L4.3 2.9c-.3-.2-.6-.2-.9-.1L14.8 12z"/></svg>
                  <span><small>GET IT ON</small>Google Play</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="gi-strip">{store.footerBadgeText}</div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} {store.storeName} · All rights reserved</span>
        <span style={{color:"var(--sf2)"}}>♥ Made with love for Cheriyal artisans</span>
      </div>
      <div className="foot-credit" style={{textAlign:"center",padding:"10px 20px 16px",fontSize:".78rem",color:"#6B5040",borderTop:"1px solid rgba(255,255,255,.06)"}}>
        Designed &amp; Developed by{" "}
        <a href="https://rangu-mallikarjun.netlify.app/" target="_blank" rel="noreferrer"
          style={{color:"#E8620A",fontWeight:700,textDecoration:"none",transition:"opacity .15s"}}
          onMouseEnter={e => e.currentTarget.style.opacity=".75"}
          onMouseLeave={e => e.currentTarget.style.opacity="1"}>
          Mallikarjun Rangu
        </a>
      </div>
    </footer>
  );
}
