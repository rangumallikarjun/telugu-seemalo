import { useEffect, useRef, useState } from "react";

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
  const resolvedRef = useRef(false);

  useEffect(() => { openCheckout(); }, []); // eslint-disable-line

  // Razorpay's checkout.js locks page scroll and sometimes fails to restore
  // it on dismiss — force-clean on unmount.
  useEffect(() => () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.documentElement.style.overflow = "";
    document.querySelectorAll(".razorpay-container, .razorpay-backdrop").forEach((el) => el.remove());
  }, []);

  const openCheckout = async () => {
    setStatus("loading");
    setError("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError(
        "The payment window is being blocked — usually by an ad blocker or privacy " +
        "extension (AdBlock, uBlock, Brave Shields) or blocked cookies. Disable it for " +
        "this site, or try a different browser / a normal (non-incognito) window."
      );
      setStatus("error");
      return;
    }

    const options = {
      key:         process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount:      Math.round(amount * 100),
      currency:    "INR",
      name:        "Telugu Seemalo",
      description: purpose,
      image:       "",
      theme:       { color: "#E8620A" },
      remember_customer: true,
      handler: (response) => {
        resolvedRef.current = true;
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

      // If Razorpay never actually renders its window (blocked), surface an error.
      setTimeout(() => {
        if (resolvedRef.current) return;
        if (document.querySelector(".razorpay-container, .razorpay-checkout-frame")) return;
        setError(
          "The payment window didn't open. This is usually an ad blocker or privacy " +
          "extension (AdBlock, uBlock, Brave Shields) or blocked cookies. Disable it for " +
          "this site, or try a different browser / a normal (non-incognito) window."
        );
        setStatus("error");
      }, 4000);
    } catch (err) {
      setError("Failed to open Razorpay. " + err.message);
      setStatus("error");
    }
  };

  if (status === "idle") return null;

  const btn = { flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer",
    fontWeight: 700, fontSize: ".88rem", fontFamily: "DM Sans,sans-serif" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"36px 28px", maxWidth:360, width:"100%",
        textAlign:"center", fontFamily:"DM Sans,sans-serif", boxShadow:"0 24px 80px rgba(0,0,0,.4)" }}>

        {status === "loading" && (
          <>
            <div style={{ width:48, height:48, border:"3px solid #F1F5F9", borderTopColor:"#E8620A",
              borderRadius:"50%", animation:"rzp-spin .7s linear infinite", margin:"0 auto 18px" }}/>
            <div style={{ fontWeight:700, color:"#18100A", marginBottom:6 }}>Opening Razorpay…</div>
            <div style={{ fontSize:".82rem", color:"#94A3B8" }}>Preparing secure checkout for {fmt(amount)}</div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize:"2.5rem", marginBottom:14 }}>⚠️</div>
            <div style={{ fontWeight:700, color:"#DC2626", marginBottom:8 }}>Payment window blocked</div>
            <div style={{ fontSize:".84rem", color:"#64748B", marginBottom:18, lineHeight:1.5 }}>{error}</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={openCheckout}
                style={{ ...btn, border:"none", background:"linear-gradient(135deg,#E8620A,#C9901A)", color:"#fff" }}>
                Try Again
              </button>
              <button onClick={onClose}
                style={{ ...btn, border:"1.5px solid #E2E8F0", background:"none", color:"#64748B", fontWeight:600 }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes rzp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
