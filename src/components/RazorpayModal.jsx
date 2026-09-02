import { useEffect, useRef, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/config";
import { callCreatePaymentLink, callFetchPaymentLink } from "../services/razorpayService";

const fns = getFunctions(app);
const createRazorpayOrder   = httpsCallable(fns, "createRazorpayOrder");
const verifyRazorpayPayment = httpsCallable(fns, "verifyRazorpayPayment");

const fmt = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    if (document.getElementById("razorpay-sdk")) {
      const wait = setInterval(() => {
        if (window.Razorpay) { clearInterval(wait); resolve(true); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id  = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayModal({ amount, purpose = "Payment", prefill = {}, onSuccess, onClose }) {
  const [status, setStatus] = useState("loading");
  const [error,  setError]  = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const resolvedRef = useRef(false);
  const linkIdRef   = useRef(null);

  useEffect(() => { openCheckout(); }, []); // eslint-disable-line

  // Razorpay's checkout.js locks page scroll (body overflow + padding) while
  // its iframe is open and, on dismiss, occasionally fails to restore it —
  // leaving the page underneath unscrollable. Force-clean on unmount.
  useEffect(() => () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.documentElement.style.overflow = "";
    document.querySelectorAll(".razorpay-container, .razorpay-backdrop")
      .forEach(el => el.remove());
  }, []);

  // While the hosted payment page is open in another tab, poll its status.
  useEffect(() => {
    if (status !== "link" || !linkIdRef.current) return;
    let stop = false;
    const check = async () => {
      try {
        const res = await callFetchPaymentLink({ id: linkIdRef.current });
        if (!stop && res.data?.paid) {
          resolvedRef.current = true;
          onSuccess(res.data.paymentId || "paid_via_link");
        }
      } catch { /* keep polling */ }
    };
    const t = setInterval(check, 3500);
    check();
    return () => { stop = true; clearInterval(t); };
  }, [status]); // eslint-disable-line

  const openCheckout = async () => {
    setStatus("loading");
    setError("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError(
        "The payment window is being blocked — usually by an ad blocker or privacy " +
        "extension (AdBlock, uBlock, Brave Shields) or blocked cookies."
      );
      setStatus("error");
      return;
    }

    // Ask our backend for a real order + a Razorpay customer id. With these,
    // Razorpay Checkout shows the "Saved Cards" section and a "Save card"
    // option. We only USE the server response when it also returns `keyId`
    // (i.e. the updated Cloud Function is deployed) — otherwise a key /
    // account mismatch between the order and the client key would stop
    // Checkout from opening at all. No server order → plain amount-only
    // checkout, exactly as before.
    let server = null;
    try {
      const res = await Promise.race([
        createRazorpayOrder({ amount, purpose, customer: prefill }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
      ]);
      const d = res?.data;
      if (d && d.orderId && d.keyId) server = d;
    } catch (err) {
      console.warn("[Razorpay] server order unavailable, using basic checkout:", err.message);
    }

    const options = {
      key:         server?.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount:      server?.amount || Math.round(amount * 100),
      currency:    "INR",
      name:        "Telugu Seemalo",
      description: purpose,
      image:       "",
      theme:       { color: "#E8620A" },
      remember_customer: true,
      ...(server?.orderId    ? { order_id:    server.orderId }    : {}),
      ...(server?.customerId ? { customer_id: server.customerId } : {}),
      handler: async (response) => {
        resolvedRef.current = true;
        if (server?.orderId && response.razorpay_signature) {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount, purpose,
            });
          } catch (err) {
            console.warn("[Razorpay] verify failed (payment still captured):", err.message);
          }
        }
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => { resolvedRef.current = true; onClose(); },
        escape:    false,
      },
      prefill: {
        name:    prefill.name    || "",
        email:   prefill.email   || "",
        contact: (prefill.contact || "").replace(/[^\d+]/g, ""),
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        resolvedRef.current = true;
        setError(`Payment failed: ${resp.error.description}`);
        setStatus("error");
      });
      rzp.open();
      setStatus("idle");

      // If Razorpay never renders its window (blocked by an ad blocker /
      // privacy extension, unsupported browser, popup blocked), fall back
      // to the hosted payment page instead of leaving a dead screen.
      setTimeout(() => {
        if (resolvedRef.current) return;
        if (document.querySelector(".razorpay-container, .razorpay-checkout-frame")) return;
        setError(
          "The payment window is being blocked — usually by an ad blocker or privacy " +
          "extension (AdBlock, uBlock, Brave Shields) or blocked cookies."
        );
        setStatus("error");
      }, 4000);
    } catch (err) {
      setError("Failed to open Razorpay. " + err.message);
      setStatus("error");
    }
  };

  // Fallback: open Razorpay's own hosted payment page in a new tab. Works
  // even when checkout.js is blocked, because it's a plain web page.
  const openHostedPage = async () => {
    // Open the tab synchronously (inside the click) so it isn't popup-blocked
    const tab = window.open("about:blank", "_blank");
    setStatus("link-loading");
    setError("");
    try {
      const res = await callCreatePaymentLink({ amount, purpose, customer: prefill });
      linkIdRef.current = res.data.id;
      setLinkUrl(res.data.url);
      if (tab) tab.location.href = res.data.url;
      else window.location.href = res.data.url;
      setStatus("link");
    } catch (err) {
      if (tab) tab.close();
      setError(
        "Couldn't open the payment page. Please log in and try again, or disable your ad blocker. " +
        (err.message || "")
      );
      setStatus("error");
    }
  };

  if (status === "idle") return null;

  const btnPrimary = { flex:1, padding:"11px", border:"none", borderRadius:10, cursor:"pointer",
    background:"linear-gradient(135deg,#E8620A,#C9901A)", color:"#fff",
    fontWeight:700, fontSize:".88rem", fontFamily:"DM Sans,sans-serif" };
  const btnGhost = { flex:1, padding:"11px", border:"1.5px solid #E2E8F0", borderRadius:10,
    cursor:"pointer", background:"none", color:"#64748B",
    fontWeight:600, fontSize:".88rem", fontFamily:"DM Sans,sans-serif" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"36px 28px", maxWidth:360, width:"100%",
        textAlign:"center", fontFamily:"DM Sans,sans-serif", boxShadow:"0 24px 80px rgba(0,0,0,.4)" }}>

        {(status === "loading" || status === "link-loading") && (
          <>
            <div style={{ width:48, height:48, border:"3px solid #F1F5F9", borderTopColor:"#E8620A",
              borderRadius:"50%", animation:"rzp-spin .7s linear infinite", margin:"0 auto 18px" }}/>
            <div style={{ fontWeight:700, color:"#18100A", marginBottom:6 }}>
              {status === "link-loading" ? "Opening payment page…" : "Opening Razorpay…"}
            </div>
            <div style={{ fontSize:".82rem", color:"#94A3B8" }}>Preparing secure checkout for {fmt(amount)}</div>
          </>
        )}

        {status === "link" && (
          <>
            <div style={{ fontSize:"2.2rem", marginBottom:12 }}>🔗</div>
            <div style={{ fontWeight:700, color:"#18100A", marginBottom:8 }}>Complete payment in the new tab</div>
            <div style={{ fontSize:".84rem", color:"#64748B", marginBottom:16, lineHeight:1.5 }}>
              A secure Razorpay page opened in another tab. Pay {fmt(amount)} there — this window will
              update automatically once it's done.
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              fontSize:".8rem", color:"#94A3B8", marginBottom:18 }}>
              <span style={{ width:14, height:14, border:"2px solid #E2E8F0", borderTopColor:"#E8620A",
                borderRadius:"50%", display:"inline-block", animation:"rzp-spin .7s linear infinite" }}/>
              Waiting for payment…
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {linkUrl && (
                <a href={linkUrl} target="_blank" rel="noopener noreferrer"
                  style={{ ...btnPrimary, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  Reopen page
                </a>
              )}
              <button onClick={onClose} style={btnGhost}>Cancel</button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize:"2.5rem", marginBottom:14 }}>⚠️</div>
            <div style={{ fontWeight:700, color:"#DC2626", marginBottom:8 }}>Payment window blocked</div>
            <div style={{ fontSize:".84rem", color:"#64748B", marginBottom:18, lineHeight:1.5 }}>{error}</div>
            {amount > 0 && (
              <button onClick={openHostedPage}
                style={{ ...btnPrimary, width:"100%", marginBottom:10 }}>
                Continue on secure payment page →
              </button>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={openCheckout} style={btnGhost}>Try Again</button>
              <button onClick={onClose} style={btnGhost}>Cancel</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes rzp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
