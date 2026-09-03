import { useState, useEffect, useCallback } from "react";
import S from "./styles/styles";
import Nav from "./components/Nav";
import CartDrawer from "./components/CartDrawer";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import SuccessPage from "./pages/SuccessPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import ContactPage from "./pages/ContactPage";
import RoomBuilderPage from "./pages/RoomBuilderPage";
import PolicyPage, { DEFAULT_TERMS_SECTIONS, DEFAULT_SHIPPING_SECTIONS, DEFAULT_RETURN_SECTIONS, DEFAULT_PRIVACY_SECTIONS } from "./pages/PolicyPage";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase/config";
import { onAuthChange } from "./firebase/authService";
import { getProducts } from "./firebase/productService";
import logo from "./assets/logo-original.png";
import CookieBanner from "./components/CookieBanner";
import AnnouncementBar from "./components/AnnouncementBar";
import ScrollProgress from "./components/ScrollProgress";

// ── URL ↔ page name mapping ───────────────────────────────────────────────────
const PAGE_PATH = {
  home:     "/",
  shop:     "/shop",
  product:  "/product",
  about:    "/about",
  contact:  "/contact",
  checkout: "/checkout",
  success:  "/success",
  profile:  "/profile",
  track:    "/track",
  admin:    "/admin",
  room:     "/room-builder",
  terms:             "/terms",
  "privacy-policy":  "/privacy-policy",
  "shipping-policy": "/shipping-policy",
  "return-policy":   "/return-policy",
};

const pathToPage = (pathname) => {
  const entry = Object.entries(PAGE_PATH).find(([, p]) => p === pathname);
  return entry ? entry[0] : "home";
};

export default function App() {
  const [page, setPageState]    = useState(() => pathToPage(window.location.pathname));
  const [cart, setCart]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("ts_cart")) || []; }
    catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast]       = useState(null);
  const [selProduct, setSelProduct] = useState(null);
  const [lastOrder, setLastOrder]   = useState(null);
  const [products, setProducts]     = useState([]);

  useEffect(() => { getProducts().then(setProducts); }, []);

  // Persist the cart so a page reload (e.g. on /checkout) keeps its items
  useEffect(() => {
    try { localStorage.setItem("ts_cart", JSON.stringify(cart)); } catch { /* quota / private mode */ }
  }, [cart]);

  // Safety net: never let a stuck body-scroll lock (set by the 3D Room Builder)
  // leak onto other pages such as checkout
  useEffect(() => {
    if (page !== "room") document.body.style.overflow = "";
  }, [page]);

  // Apply admin-configured SEO settings to the document head
  useEffect(() => {
    getDoc(doc(db, "settings", "seo")).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.siteTitle) document.title = data.siteTitle;
      if (data.metaDescription) {
        let tag = document.querySelector('meta[name="description"]');
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute("name", "description");
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", data.metaDescription);
      }
      if (data.focusKeywords) {
        let tag = document.querySelector('meta[name="keywords"]');
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute("name", "keywords");
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", data.focusKeywords);
      }
    }).catch(() => {});
  }, []);

  // Load Google Analytics (GA4) if enabled from Admin → Settings
  useEffect(() => {
    getDoc(doc(db, "settings", "analytics")).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      const gaId = data.gaId?.trim();
      if (!data.enabled || !gaId) return;

      const script1 = document.createElement("script");
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", gaId);
    }).catch(() => {});
  }, []);

  // Room Builder + Live Chat can be toggled off from Admin → Settings
  const [roomBuilderEnabled, setRoomBuilderEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(false);
  useEffect(() => {
    getDoc(doc(db, "settings", "store")).then(snap => {
      const d = snap.exists() ? snap.data() : {};
      if (d.roomBuilderEnabled === false) setRoomBuilderEnabled(false);
      setChatEnabled(d.chatEnabled !== false);   // default on
    }).catch(() => setChatEnabled(true));
  }, []);

  // Load the Tawk.to chat script once, only when enabled
  useEffect(() => {
    if (!chatEnabled) return;
    if (document.getElementById("tawk-embed")) return;
    const s = document.createElement("script");
    s.id = "tawk-embed";
    s.async = true;
    s.src = "https://embed.tawk.to/6a1789cc4298741c3c115eee/1jplv4hmb";
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.body.appendChild(s);
  }, [chatEnabled]);

  // Hide the Tawk.to widget while the cart drawer / checkout is open, or if disabled
  useEffect(() => {
    const shouldHide = !chatEnabled || cartOpen || page === "checkout";
    const apply = () => { shouldHide ? window.Tawk_API?.hideWidget?.() : window.Tawk_API?.showWidget?.(); };
    apply();
    // In case Tawk's script hasn't finished loading yet, re-apply once it's ready
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = apply;
  }, [cartOpen, page, chatEnabled]);

  useEffect(() => {
    const unsub = onAuthChange(userData => {
      setUser(userData);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── History API integration ───────────────────────────────────────────────
  // Stamp the initial history entry with current page state
  useEffect(() => {
    window.history.replaceState(
      { page: pathToPage(window.location.pathname) },
      "",
      window.location.pathname + window.location.search
    );
  }, []);

  // Listen for browser back / forward
  useEffect(() => {
    const onPop = (e) => {
      const state = e.state || {};
      const target = state.page || pathToPage(window.location.pathname);
      if (target === "product" && state.product) setSelProduct(state.product);
      setPageState(target);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Central navigation — every page transition goes through here
  const navigate = useCallback((p, opts = {}) => {
    const path = (PAGE_PATH[p] || "/") + (opts.urlSuffix || "");
    const histState = { page: p, ...opts.histExtra };
    if (opts.replace) {
      window.history.replaceState(histState, "", path);
    } else {
      window.history.pushState(histState, "", path);
    }
    setPageState(p);
    if (!opts.noScroll) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (page === "room" && !roomBuilderEnabled) navigate("home", { replace: true });
  }, [page, roomBuilderEnabled, navigate]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const addToCart = (p, qty = 1) => {
    setCart(prev => {
      const key = p.id + (p.selSize || "") + (p.selColor || "");
      const existing = prev.find(i => i.cartId === key);
      if (existing) return prev.map(i => i.cartId === key ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...p, cartId: key, qty }];
    });
    showToast(`${p.name} added to cart!`);
  };

  const updateQty = (cartId, qty) => {
    if (qty <= 0) removeFromCart(cartId);
    else setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, qty } : i));
  };

  const removeFromCart = cartId => setCart(prev => prev.filter(i => i.cartId !== cartId));

  const handleAuth = (userData) => {
    setUser(userData);
    setAuthMode(null);
    showToast(`Welcome, ${userData.name || userData.email}! 🎉`);
  };

  const openProduct = (p) => {
    setSelProduct(p);
    navigate("product", { histExtra: { product: p }, urlSuffix: `?id=${p.id}` });
  };

  // Restore product when page is opened directly via shared link (/product?id=X)
  useEffect(() => {
    if (page === "product" && !selProduct && products.length > 0) {
      const id = new URLSearchParams(window.location.search).get("id");
      if (id) {
        const found = products.find(pr => String(pr.id) === id);
        if (found) setSelProduct(found);
      }
    }
  }, [page, products, selProduct]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const related = selProduct ? (() => {
    const sameCat = products.filter(p => p.category === selProduct.category && p.id !== selProduct.id);
    const otherCat = products.filter(p => p.category !== selProduct.category);
    return [...sameCat, ...otherCat].slice(0, 8);
  })() : [];

  if (authLoading) {
    return (
      <>
        <style>{S}</style>
        <div style={{
          minHeight:"100vh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"#18100A", gap:28,
          animation:"fadeIn .4s ease",
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes ld-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

          {/* Brand logo */}
          <img src={logo} alt="Telugu Seemalo" className="splash-logo logo-mark" />

          <div style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(2.2rem,6vw,3.2rem)",
            fontWeight:700, letterSpacing:".04em", lineHeight:1,
            color:"#C9901A",
          }}>
            Telugu <span style={{color:"#E8620A"}}>Seemalo</span>
          </div>

          {/* Tagline */}
          <div style={{
            fontFamily:"'DM Sans',sans-serif",
            fontSize:".78rem", fontWeight:600,
            letterSpacing:".14em", textTransform:"uppercase",
            color:"#6B4C38",
          }}>
            Authentic Craft
          </div>

          {/* Dot loader */}
          <div style={{display:"flex", gap:8, marginTop:8}}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width:8, height:8, borderRadius:"50%",
                background:"#E8620A",
                animation:`ld-pulse 1.2s ${i*0.22}s ease-in-out infinite`,
              }}/>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (page === "admin") {
    return (
      <>
        <style>{S}</style>
        <AdminPage user={user} setUser={setUser} setPage={navigate}/>
        {toast && <Toast msg={toast.msg} type={toast.type}/>}
      </>
    );
  }

  return (
    <div className="app" style={page === "room" ? { overflow: "hidden", height: "100vh", display: "flex", flexDirection: "column" } : {}}>
      <style>{S}</style>
      <ScrollProgress/>
      {page !== "room" && <AnnouncementBar/>}

      <Nav
        page={page}
        setPage={navigate}
        cartCount={cartCount}
        setCartOpen={setCartOpen}
        user={user}
        setAuthMode={setAuthMode}
        roomBuilderEnabled={roomBuilderEnabled}
      />

      {page === "home"     && <HomePage setPage={navigate} onOpen={openProduct} onAdd={addToCart}/>}
      {page === "shop"     && <ShopPage onOpen={openProduct} onAdd={addToCart}/>}
      {page === "product"  && selProduct && <ProductPage p={selProduct} onBack={() => navigate("shop")} onAdd={addToCart} onOpen={openProduct} related={related} user={user}/>}
      {page === "about"    && <AboutPage setPage={navigate}/>}
      {page === "checkout" && <CheckoutPage cart={cart} setPage={navigate} setCart={setCart} setLastOrder={setLastOrder} user={user}/>}
      {page === "success"  && <SuccessPage order={lastOrder} setPage={navigate}/>}
      {page === "profile"  && <ProfilePage user={user} setUser={setUser} setPage={navigate} products={products} onOpen={openProduct} roomBuilderEnabled={roomBuilderEnabled}/>}
      {page === "track"    && <TrackOrderPage user={user} setPage={navigate}/>}
      {page === "contact"  && <ContactPage setPage={navigate} user={user}/>}
      {page === "room"     && <RoomBuilderPage products={products} setPage={navigate} addToCart={addToCart} user={user}/>}
      {page === "terms"    && <PolicyPage docId="termsPolicy" title="Terms & Conditions" subtitle="Please read these terms carefully before using our site or placing an order." defaultSections={DEFAULT_TERMS_SECTIONS}/>}
      {page === "privacy-policy"  && <PolicyPage docId="privacyPolicy" title="Privacy Policy" subtitle="How we collect, use, and protect your personal information." defaultSections={DEFAULT_PRIVACY_SECTIONS}/>}
      {page === "shipping-policy" && <PolicyPage docId="shippingPolicy" title="Shipping Policy" subtitle="Everything you need to know about how we ship your order." defaultSections={DEFAULT_SHIPPING_SECTIONS}/>}
      {page === "return-policy"   && <PolicyPage docId="returnPolicy" title="Return Policy" subtitle="Our process for returns, exchanges, and refunds." defaultSections={DEFAULT_RETURN_SECTIONS}/>}

      <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onQty={updateQty} onRemove={removeFromCart} setPage={navigate}/>
      <AuthModal mode={authMode} setMode={setAuthMode} onAuth={handleAuth}/>

      {page !== "checkout" && page !== "success" && page !== "room" && <Footer setPage={navigate}/>}

      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <CookieBanner/>
    </div>
  );
}
