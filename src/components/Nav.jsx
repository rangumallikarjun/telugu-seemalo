import { useState, useEffect } from "react";
import { subscribeUserNotifs, isNotifRead } from "../firebase/notifService";
import logo from "../assets/logo-original.png";

export default function Nav({page, setPage, cartCount, setCartOpen, user, setAuthMode, roomBuilderEnabled = true}) {
  const [mob, setMob]           = useState(false);
  const [unread, setUnread]     = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ]       = useState("");

  useEffect(() => {
    if (!user?.uid) { setUnread(0); return; }
    const unsub = subscribeUserNotifs(user.uid, (notifs) => {
      setUnread(notifs.filter(n => !isNotifRead(n, user.uid)).length);
    });
    return unsub;
  }, [user?.uid]);

  const go = (p) => { setPage(p); setMob(false); };

  const goNotifs = () => {
    go("profile");
    // small delay so ProfilePage mounts before trying to set tab
    setTimeout(() => window.dispatchEvent(new CustomEvent("ts-profile-tab", { detail: "notifications" })), 50);
  };

  const runSearch = (q) => {
    const query = q.trim();
    if (!query) return;
    go("shop");
    // small delay so ShopPage mounts before trying to set the search query
    setTimeout(() => window.dispatchEvent(new CustomEvent("ts-shop-search", { detail: query })), 50);
    setSearchQ("");
    setSearchOpen(false);
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-in">
          <div className="nav-logo" onClick={() => go("home")}>
            <img src={logo} alt="Telugu Seemalo" className="nav-logo-img logo-mark" />
            Telugu <span>Seemalo</span>
          </div>
          <div className="nav-links">
            {["home","shop","about"].map(p => (
              <button key={p} className={`nbtn ${page===p?"act":""}`} onClick={() => go(p)}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ))}
            {roomBuilderEnabled && (
              <button className={`nbtn ${page==="room"?"act":""}`} onClick={() => go("room")}>Room Builder</button>
            )}
            <button className={`nbtn ${page==="contact"?"act":""}`} onClick={() => go("contact")}>Contact</button>
            <button className={`nbtn ${page==="track"?"act":""}`} onClick={() => go("track")}>Track</button>
            {user?.role === "admin" && (
              <button className={`nbtn ${page==="admin"?"act":""}`} onClick={() => go("admin")}
                style={{background: page==="admin" ? "#C9901A" : "rgba(201,144,26,.15)", color: page==="admin" ? "#fff" : "#F0BB50"}}>
                ⚙ Admin
              </button>
            )}
          </div>
          <div className="nav-r">
            <div className={`nav-search ${searchOpen ? "open" : ""}`}>
              {searchOpen ? (
                <input autoFocus type="text" placeholder="Search products…" value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") runSearch(searchQ); if (e.key === "Escape") setSearchOpen(false); }}
                  onBlur={() => { if (!searchQ) setSearchOpen(false); }} />
              ) : (
                <button className="nav-search-pill" onClick={() => setSearchOpen(true)}
                  title="Search products" aria-label="Search products">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
              )}
              {searchOpen && (
                <button onClick={() => runSearch(searchQ)} title="Search products" aria-label="Search products"
                  style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",lineHeight:1,color:"#C9A96E",display:"flex",alignItems:"center"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
              )}
            </div>
            {user && (
              <button onClick={goNotifs} title="Notifications"
                style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"4px 6px",lineHeight:1,color:"#C9A96E",display:"flex",alignItems:"center"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                {unread > 0 && (
                  <span style={{position:"absolute",top:-3,right:-3,background:"#E8620A",color:"#fff",
                    fontSize:".6rem",fontWeight:700,borderRadius:"50%",minWidth:16,height:16,
                    display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",lineHeight:1}}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            )}
            {user
              ? <button className="nbtn act" onClick={() => go("profile")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:5,verticalAlign:"middle"}}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  <span className="nbtn-label">{user.name?.split(" ")[0] || "Account"}</span>
                </button>
              : <button className="nbtn" onClick={() => setAuthMode("login")}>Login</button>
            }
            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:5,verticalAlign:"middle"}}><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.2 4H2V2H0v2h2l3.6 7.6L4.2 14c-.2.3-.2.7-.2 1 0 1.1.9 2 2 2h14v-2H6.4c-.1 0-.2-.1-.2-.2l.1-.4.9-1.4H19c.7 0 1.4-.4 1.7-1l3.5-6.4A1 1 0 0023.3 4H5.2z"/></svg>
              <span className="cart-btn-label">Cart</span> {cartCount > 0 && <span className="cbadge">{cartCount}</span>}
            </button>
            <button className={`hbg ${mob?"open":""}`} onClick={() => setMob(!mob)} aria-label="Menu">
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>
      <div className={`mob-overlay ${mob?"open":""}`} onClick={() => setMob(false)}/>
      <div className={`mob-drawer ${mob?"open":""}`}>
        <div className="md-search">
          <input type="text" placeholder="Search products…" value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") runSearch(searchQ); }}/>
          <button onClick={() => runSearch(searchQ)} aria-label="Search products">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
        <button className="md-link" onClick={() => go("home")}>🏠 Home</button>
        <button className="md-link" onClick={() => go("shop")}>🛍️ Shop</button>
        <button className="md-link" onClick={() => go("about")}>📖 Our Story</button>
        {roomBuilderEnabled && (
          <button className="md-link" onClick={() => go("room")}>🏠 Room Builder</button>
        )}
        <button className="md-link" onClick={() => go("contact")}>💬 Contact Us</button>
        <button className="md-link" onClick={() => go("track")}>📦 Track Order</button>
        {user?.role === "admin" && (
          <button className="md-link" onClick={() => go("admin")}>⚙ Admin Panel</button>
        )}
        {user && (
          <button className="md-link" onClick={goNotifs}>
            🔔 Notifications {unread > 0 && <span style={{background:"#E8620A",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:".72rem",fontWeight:700,marginLeft:4}}>{unread}</span>}
          </button>
        )}
        <div className="md-sep"/>
        <div className="md-auth">
          {user ? (
            <button className="md-auth-btn md-signup" onClick={() => go("profile")}>👤 My Account</button>
          ) : (
            <>
              <button className="md-auth-btn md-login" onClick={() => { setAuthMode("login"); setMob(false); }}>Login</button>
              <button className="md-auth-btn md-signup" onClick={() => { setAuthMode("signup"); setMob(false); }}>Sign Up</button>
            </>
          )}
          <button className="cart-btn" style={{justifyContent:"center"}} onClick={() => { setCartOpen(true); setMob(false); }}>
            🛒 Cart {cartCount > 0 && <span className="cbadge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </>
  );
}
