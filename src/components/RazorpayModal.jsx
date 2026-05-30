import { useEffect, useState } from "react";

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

export default function RazorpayModal({ amount, purpose = "Payment", onSuccess, onClose }) {
  const [status, setStatus] = useState("loading");
  const [error,  setError]  = useState("");

  useEffect(() => { openCheckout(); }, []); // eslint-disable-line

  const openCheckout = async () => {
    setStatus("loading");
    setError("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Could not load Razorpay. Check your internet connection.");
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
      handler: (response) => {
        onSuccess(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: onClose,
        escape:    false,
      },
      prefill: {
        name:    "",
        email:   "",
        contact: "",
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setStatus("error");
      });
      rzp.open();
      setStatus("idle");
    } catch (err) {
      setError("Failed to open Razorpay. " + err.message);
      setStatus("error");
    }
  };

  if (status === "idle") return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"36px 28px", maxWidth:340, width:"100%",
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
            <div style={{ fontWeight:700, color:"#DC2626", marginBottom:8 }}>Payment Error</div>
            <div style={{ fontSize:".84rem", color:"#64748B", marginBottom:20, lineHeight:1.5 }}>{error}</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={openCheckout}
                style={{ flex:1, padding:"11px", border:"none", borderRadius:10, cursor:"pointer",
                  background:"linear-gradient(135deg,#E8620A,#C9901A)", color:"#fff",
                  fontWeight:700, fontSize:".88rem", fontFamily:"DM Sans,sans-serif" }}>
                Try Again
              </button>
              <button onClick={onClose}
                style={{ flex:1, padding:"11px", border:"1.5px solid #E2E8F0", borderRadius:10,
                  cursor:"pointer", background:"none", color:"#64748B",
                  fontWeight:600, fontSize:".88rem", fontFamily:"DM Sans,sans-serif" }}>
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
