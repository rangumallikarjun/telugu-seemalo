import { useState, useRef, useEffect } from "react";

export default function OtpVerifyModal({ email, purpose, onVerify, onClose, onResend }) {
  const [digits, setDigits]       = useState(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleInput = (i, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
        inputs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft"  && i > 0) inputs.current[i - 1]?.focus();
    else if   (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("").map((_, i) => text[i] || "");
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const code = digits.join("");

  const handleVerify = async () => {
    if (code.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setVerifying(true);
    setError("");
    try {
      await onVerify(code);
    } catch (e) {
      setError(e.message || "Invalid code. Please try again.");
      setDigits(Array(6).fill(""));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setDigits(Array(6).fill(""));
    try {
      await onResend();
      setCountdown(60);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } catch (e) {
      setError(e.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:400,padding:"36px 28px 28px",boxShadow:"0 12px 48px rgba(0,0,0,.22)",textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"#FFF3ED",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",margin:"0 auto 16px"}}>
          📧
        </div>
        <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.6rem",fontWeight:700,marginBottom:8,color:"#18100A"}}>
          Verify your email
        </h3>
        <p style={{fontSize:".85rem",color:"#6B4C38",marginBottom:6,lineHeight:1.5}}>
          We sent a 6-digit code to<br/>
          <strong style={{color:"#18100A"}}>{email}</strong>
        </p>
        <p style={{fontSize:".76rem",color:"#9B8472",marginBottom:6}}>Check your inbox and spam folder.</p>
        <p style={{fontSize:".76rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#E8620A",marginBottom:24,background:"#FFF3ED",display:"inline-block",padding:"3px 12px",borderRadius:20}}>
          {purpose}
        </p>

        {/* 6-digit boxes */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              autoFocus={i === 0}
              style={{
                width:44, height:54, textAlign:"center",
                fontSize:"1.5rem", fontWeight:700,
                border:`2px solid ${d ? "#E8620A" : "#E8D5C0"}`,
                borderRadius:10, outline:"none",
                fontFamily:"DM Sans,sans-serif",
                background: d ? "#FFF3ED" : "#fff",
                color:"#18100A",
                transition:"border-color .15s,background .15s",
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"9px 14px",fontSize:".83rem",marginBottom:16,textAlign:"left"}}>
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying || code.length < 6}
          style={{
            width:"100%", padding:"13px 0", border:"none", borderRadius:10,
            background: code.length < 6 ? "#D1C5BB" : "#E8620A",
            color:"#fff", fontWeight:700, fontSize:".95rem",
            cursor: code.length < 6 ? "not-allowed" : "pointer",
            fontFamily:"DM Sans,sans-serif", marginBottom:14,
            transition:"background .15s",
          }}
        >
          {verifying ? "Verifying…" : "Verify & Continue"}
        </button>

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontSize:".82rem"}}>
          {countdown > 0 ? (
            <span style={{color:"#9B8472"}}>Resend in {countdown}s</span>
          ) : (
            <button onClick={handleResend} disabled={resending}
              style={{background:"none",border:"none",cursor:"pointer",color:"#E8620A",fontWeight:700,fontSize:".82rem",fontFamily:"DM Sans,sans-serif",padding:0}}>
              {resending ? "Sending…" : "↺ Resend code"}
            </button>
          )}
          <span style={{color:"#E8D5C0"}}>|</span>
          <button onClick={onClose}
            style={{background:"none",border:"none",cursor:"pointer",color:"#6B4C38",fontSize:".82rem",fontFamily:"DM Sans,sans-serif",padding:0}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
