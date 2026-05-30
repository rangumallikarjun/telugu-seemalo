import { useState } from "react";
import { login, signup, resetPassword, loginWithGoogle } from "../firebase/authService";
import { generateOtp, sendOtp } from "../firebase/otpService";
import { emailWelcome, emailLoginAlert } from "../services/emailService";
import { createNotif } from "../firebase/notifService";
import OtpVerifyModal from "./OtpVerifyModal";

export default function AuthModal({mode, setMode, onAuth}) {
  const [f, setF]               = useState({name:"",email:"",pass:""});
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpStep, setOtpStep]       = useState(false);
  const [otpFlow, setOtpFlow]   = useState("");   // "signup" | "reset"
  const [pendingOtp, setPendingOtp] = useState("");

  const switchMode = (m) => {
    setMode(m); setError(""); setSuccess("");
    setOtpStep(false); setPendingOtp(""); setOtpFlow("");
  };

  const submit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        const userData = await login(f.email, f.pass);
        emailLoginAlert({ to_email: f.email, to_name: userData.name || "" }).catch(() => {});
        onAuth(userData);
      } else {
        // signup and reset both go through OTP first
        const code = generateOtp();
        await sendOtp(f.email, code, mode === "signup" ? "Email Verification" : "Password Reset");
        setPendingOtp(code);
        setOtpFlow(mode);
        setOtpStep(true);
      }
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" || err.code === "auth/wrong-password"
          ? "Invalid email or password."
          : err.code === "auth/email-already-in-use"
          ? "Email already registered. Try logging in."
          : err.code === "auth/weak-password"
          ? "Password must be at least 6 characters."
          : err.code === "auth/user-not-found"
          ? "No account found with this email."
          : err.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (entered) => {
    if (entered !== pendingOtp) throw new Error("Invalid OTP. Please try again.");
    setOtpStep(false);
    setPendingOtp("");

    if (otpFlow === "signup") {
      try {
        const userData = await signup(f.name, f.email, f.pass);
        emailWelcome({ to_email: f.email, to_name: f.name }).catch(() => {});
        createNotif({
          userId:  userData.uid,
          type:    "welcome",
          title:   `Welcome to Telugu Seemalo, ${f.name}! 🎉`,
          message: "Your account is ready. Explore our collection of authentic Telugu crafts and cuisine.",
          link:    null,
        }).catch(() => {});
        onAuth(userData);
      } catch (err) {
        setError(
          err.code === "auth/email-already-in-use"
            ? "Email already registered. Try logging in."
            : err.code === "auth/weak-password"
            ? "Password must be at least 6 characters."
            : "Failed to create account. Please try again."
        );
      }
    } else {
      // reset flow
      try {
        await resetPassword(f.email);
        setSuccess("Reset link sent! Check your inbox and spam folder — click the link to set a new password.");
      } catch (err) {
        setError(
          err.code === "auth/user-not-found"
            ? "No account found with this email. Please sign up first."
            : err.code === "auth/too-many-requests"
            ? "Too many requests. Please wait a few minutes and try again."
            : "Failed to send reset link. Please try again."
        );
      }
    }
  };

  const handleGoogle = async () => {
    setError(""); setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle();
      emailLoginAlert({ to_email: userData.email, to_name: userData.name || "" }).catch(() => {});
      onAuth(userData);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(
          err.code === "auth/account-exists-with-different-credential"
            ? "An account with this email already exists. Try logging in with email & password."
            : err.code === "auth/popup-blocked"
            ? "Popup was blocked by your browser. Please allow popups for this site."
            : "Google sign-in failed. Please try again."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleOtpResend = async () => {
    const code = generateOtp();
    await sendOtp(f.email, code, otpFlow === "signup" ? "Email Verification" : "Password Reset");
    setPendingOtp(code);
  };

  if (!mode) return null;

  return (
    <>
      <div className="modal-bg" onClick={() => setMode(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={() => setMode(null)}>✕</button>

          {mode === "login"  && <><h2>Welcome back</h2><p>Sign in to track your orders</p></>}
          {mode === "signup" && <><h2>Create account</h2><p>We'll verify your email with a one-time code</p></>}
          {mode === "reset"  && <><h2>Reset password</h2><p>We'll verify your email with a one-time code first</p></>}

          <form onSubmit={submit}>
            {mode === "signup" && (
              <div className="inp-grp">
                <label>Full Name</label>
                <input required placeholder="Your name" value={f.name}
                  onChange={e => setF({...f, name: e.target.value})}/>
              </div>
            )}

            <div className="inp-grp">
              <label>Email</label>
              <input required type="email" placeholder="you@email.com" value={f.email}
                onChange={e => setF({...f, email: e.target.value})}/>
            </div>

            {mode !== "reset" && (
              <div className="inp-grp" style={{position:"relative"}}>
                <label>Password</label>
                <input required type={showPass ? "text" : "password"} placeholder="••••••••"
                  value={f.pass} onChange={e => setF({...f, pass: e.target.value})}
                  style={{paddingRight:44}}/>
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{position:"absolute",right:10,bottom:9,background:"none",border:"none",cursor:"pointer",fontSize:".82rem",color:"#6B4C38",padding:"2px 4px",fontFamily:"DM Sans,sans-serif"}}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div style={{textAlign:"right",marginTop:-8,marginBottom:12}}>
                <button type="button" onClick={() => switchMode("reset")}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#E8620A",fontSize:".82rem",fontFamily:"DM Sans,sans-serif",fontWeight:600,padding:0}}>
                  Forgot password?
                </button>
              </div>
            )}


            {error   && <p style={{color:"#C0392B",fontSize:".85rem",marginBottom:10}}>{error}</p>}
            {success && (
              <div style={{background:"#E8F5EC",color:"#2D7D46",borderRadius:8,padding:"12px 14px",fontSize:".85rem",marginBottom:12}}>
                <div style={{fontWeight:700,marginBottom:6}}>✅ {success}</div>
                <button type="button"
                  style={{background:"none",border:"none",cursor:"pointer",color:"#2D7D46",fontSize:".8rem",padding:0,textDecoration:"underline",fontFamily:"DM Sans,sans-serif"}}
                  onClick={async () => { try { await resetPassword(f.email); } catch(_){} }}>
                  Didn't receive it? Resend
                </button>
              </div>
            )}

            <button type="submit" className="modal-btn" disabled={loading}>
              {loading
                ? "Sending code…"
                : mode === "login"  ? "Login"
                : mode === "signup" ? "Send Verification Code"
                : "Send Verification Code"}
            </button>
          </form>

          {mode !== "reset" && (
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"16px 0"}}>
                <div style={{flex:1,height:1,background:"#E8D5C0"}}/>
                <span style={{fontSize:".78rem",color:"#9B8472",fontWeight:600,whiteSpace:"nowrap"}}>or continue with</span>
                <div style={{flex:1,height:1,background:"#E8D5C0"}}/>
              </div>

              <button type="button" onClick={handleGoogle} disabled={googleLoading}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  padding:"11px 0",border:"1.5px solid #E8D5C0",borderRadius:10,background:"#fff",
                  cursor: googleLoading ? "not-allowed" : "pointer",fontFamily:"DM Sans,sans-serif",
                  fontWeight:600,fontSize:".9rem",color:"#18100A",transition:"border-color .15s, box-shadow .15s",
                  boxShadow:"0 1px 3px rgba(0,0,0,.06)",opacity: googleLoading ? 0.7 : 1}}
                onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor="#4285F4"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#E8D5C0"; }}>
                {googleLoading ? (
                  <span className="spinner spinner-sm"/>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? "Signing in…" : "Continue with Google"}
              </button>
            </>
          )}

          <div className="modal-sw">
            {mode === "login"  && <>No account? <button onClick={() => switchMode("signup")}>Sign up</button></>}
            {mode === "signup" && <>Have an account? <button onClick={() => switchMode("login")}>Login</button></>}
            {mode === "reset"  && <>Remember it? <button onClick={() => switchMode("login")}>Back to login</button></>}
          </div>
        </div>
      </div>

      {otpStep && (
        <OtpVerifyModal
          email={f.email}
          purpose={otpFlow === "signup" ? "Account Verification" : "Password Reset"}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onClose={() => { setOtpStep(false); setPendingOtp(""); setOtpFlow(""); }}
        />
      )}
    </>
  );
}
