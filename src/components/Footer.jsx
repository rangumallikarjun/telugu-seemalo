export default function Footer({setPage}) {
  return (
    <footer>
      <div className="foot-grid">
        <div className="foot-brand">
          <div className="logo">Telugu <span>Seemalo</span></div>
          <p>Authentic GI-tagged Cheriyal lacquer art from Karimnagar, Telangana. Supporting artisan families since 2020.</p>
          <div className="foot-social">
            <a href="https://instagram.com/telugu_seemalo" target="_blank" rel="noreferrer">📷</a>
            <a href="#" rel="noreferrer">👍</a>
            <a href="#" rel="noreferrer">🐦</a>
          </div>
        </div>
        <div className="foot-col">
          <h4>Shop</h4>
          <ul>
            {["Pots","Clocks","Curtains","Bed Sheets","Home Decor"].map(c => (
              <li key={c}><button onClick={() => setPage("shop")}>{c}</button></li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <h4>Info</h4>
          <ul>
            {[["About Us","about"],["Shop","shop"]].map(([l,p]) => (
              <li key={l}><button onClick={() => setPage(p)}>{l}</button></li>
            ))}
            <li><a href="#">Shipping Policy</a></li>
            <li><a href="#">Return Policy</a></li>
            <li><button onClick={() => setPage("contact")} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontFamily:"inherit",fontSize:"inherit",padding:0,textAlign:"left"}}>Contact Us</button></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Contact</h4>
          <ul>
            <li><span>📧 hello@teluguseeamalo.in</span></li>
            <li><span>📞 +91 9876 543 210</span></li>
            <li><span>📍 Karimnagar, Telangana</span></li>
          </ul>
          <div className="foot-pay">
            {["UPI","Visa","Mastercard","Razorpay"].map(p => <span key={p} className="pay-badge">{p}</span>)}
          </div>
        </div>
      </div>
      <div className="gi-strip">🏅 Cheriyal Art is a GI-Tagged craft of Telangana, India · Certified by the Government of India</div>
      <div className="foot-bottom">
        <span>© 2025 Telugu Seemalo · All rights reserved</span>
        <span style={{color:"var(--sf2)"}}>♥ Made with love for Cheriyal artisans</span>
      </div>
      <div style={{textAlign:"center",padding:"10px 20px 16px",fontSize:".78rem",color:"#6B5040",borderTop:"1px solid rgba(255,255,255,.06)"}}>
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
