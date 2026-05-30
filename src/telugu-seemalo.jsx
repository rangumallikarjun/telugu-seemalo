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
import { onAuthChange } from "./firebase/authService";
import { getProducts } from "./firebase/productService";
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
};

const pathToPage = (pathname) => {
  const entry = Object.entries(PAGE_PATH).find(([, p]) => p === pathname);
  return entry ? entry[0] : "home";
};

export default function App() {
  const [page, setPageState]    = useState(() => pathToPage(window.location.pathname));
  const [cart, setCart]         = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast]       = useState(null);
  const [selProduct, setSelProduct] = useState(null);
  const [lastOrder, setLastOrder]   = useState(null);
  const [products, setProducts]     = useState([]);

  useEffect(() => { getProducts().then(setProducts); }, []);

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
      window.location.pathname
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
            GI-Tagged · Authentic Craft
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
      />

      {page === "home"     && <HomePage setPage={navigate} onOpen={openProduct} onAdd={addToCart}/>}
      {page === "shop"     && <ShopPage onOpen={openProduct} onAdd={addToCart}/>}
      {page === "product"  && selProduct && <ProductPage p={selProduct} onBack={() => navigate("shop")} onAdd={addToCart} onOpen={openProduct} related={related} user={user}/>}
      {page === "about"    && <AboutPage setPage={navigate}/>}
      {page === "checkout" && <CheckoutPage cart={cart} setPage={navigate} setCart={setCart} setLastOrder={setLastOrder} user={user}/>}
      {page === "success"  && <SuccessPage order={lastOrder} setPage={navigate}/>}
      {page === "profile"  && <ProfilePage user={user} setUser={setUser} setPage={navigate} products={products} onOpen={openProduct}/>}
      {page === "track"    && <TrackOrderPage user={user} setPage={navigate}/>}
      {page === "contact"  && <ContactPage setPage={navigate} user={user}/>}
      {page === "room"     && <RoomBuilderPage products={products} setPage={navigate} addToCart={addToCart} user={user}/>}

      <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onQty={updateQty} onRemove={removeFromCart} setPage={navigate}/>
      <AuthModal mode={authMode} setMode={setAuthMode} onAuth={handleAuth}/>

      {page !== "checkout" && page !== "success" && page !== "room" && <Footer setPage={navigate}/>}

      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <CookieBanner/>
    </div>
  );
}
