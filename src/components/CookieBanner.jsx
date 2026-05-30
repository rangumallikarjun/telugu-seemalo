import { useState, useEffect } from "react";

const KEY = "ts_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [detail, setDetail]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const accept  = () => { localStorage.setItem(KEY, "accepted");  setVisible(false); };
  const decline = () => { localStorage.setItem(KEY, "declined");  setVisible(false); };

  if (!visible) return null;

  return (
    <div className="cookie-wrap">
      <div className="ck-box">

        {/* Header row */}
        <div className="ck-hd">
          <span className="ck-icon">🍪</span>
          <div className="ck-body">
            <div className="ck-title">We use cookies</div>
            <div className="ck-desc">
              We use essential cookies for Firebase authentication and optional cookies to
              improve your shopping experience (cart, preferences).{" "}
              {!detail && (
                <button className="ck-more" onClick={() => setDetail(true)}>Learn more</button>
              )}
            </div>

            {/* Expanded detail */}
            {detail && (
              <div className="ck-detail">
                {[
                  { icon:"🔐", label:"Essential (always on)",  desc:"Firebase Auth session, login state, security tokens. Required for the site to work.", required:true },
                  { icon:"🛒", label:"Functional",              desc:"Cart contents, shipping preferences, coupon state. Makes shopping seamless." },
                  { icon:"📊", label:"Analytics (optional)",   desc:"Anonymous usage data to improve the site. No personal data stored." },
                ].map(c => (
                  <div key={c.label} className="ck-row">
                    <span className="ck-row-icon">{c.icon}</span>
                    <div>
                      <div className="ck-row-label">
                        {c.label}
                        {c.required && <span className="ck-req">Required</span>}
                      </div>
                      <div className="ck-row-desc">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="ck-actions">
          <button className="ck-decline" onClick={decline}>Decline optional</button>
          <button className="ck-accept"  onClick={accept}>Accept all</button>
        </div>

        {/* Legal */}
        <div className="ck-legal">
          By using this site you agree to our use of essential cookies.
          Your preference is saved locally and can be changed anytime.
        </div>
      </div>
    </div>
  );
}


export const cookiesAccepted = () => localStorage.getItem(KEY) === "accepted";
