export default function AboutPage({setPage}) {
  return (
    <div>
      <div className="about-hero">
        <h1>Our Story</h1>
        <p>Preserving the 400-year-old legacy of Cheriyal lacquer art from Karimnagar, Telangana.</p>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div className="about-grid">
          <div className="about-img">🏺</div>
          <div className="about-text">
            <h2>The Art of Cheriyal</h2>
            <p>Cheriyal is a small town in Karimnagar district of Telangana, home to a 400-year-old tradition of lacquer art. Local artisans hand-paint clay pots, wooden objects, and textiles using natural pigments and traditional techniques passed down through generations.</p>
            <p>This craft is recognised as an authentic cultural heritage of Telangana.</p>
            <ul>
              <li><span>🏅</span><span>Recognised Cultural Heritage of Telangana</span></li>
              <li><span>👨‍🎨</span><span>Supporting 50+ artisan families in Karimnagar</span></li>
              <li><span>🌿</span><span>Natural lacquer pigments – no harmful chemicals</span></li>
              <li><span>📦</span><span>Direct from artisan to your doorstep</span></li>
            </ul>
          </div>
        </div>
        <div style={{padding:"0 20px 60px"}}>
          <div className="sec-hd"><h2>Why Telugu Seemalo?</h2><div className="divider"/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:20}}>
            {[
              ["🤝","Direct from Artisans","We source directly from certified Cheriyal artisans — no middlemen — so more money reaches the craftspeople."],
              ["✅","Authenticity Guaranteed","Every product comes with a certification card confirming its authentic Cheriyal origin."],
              ["🌱","Eco-friendly Craft","Natural lacquer paints derived from plant and mineral sources — safe for families and the environment."],
              ["💝","Gifting Excellence","Premium packaging with a handwritten note option — perfect for festivals, weddings, and corporate gifting."],
            ].map(([ic,title,desc]) => (
              <div key={title} style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <div style={{fontSize:"2rem",marginBottom:12}}>{ic}</div>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",fontWeight:700,marginBottom:8}}>{title}</h3>
                <p style={{color:"var(--mt)",fontSize:".88rem",lineHeight:1.7}}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:36}}>
            <button className="btn-sf" onClick={() => setPage("shop")}>Explore Our Collection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
