import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadReviewImage, uploadReviewVideo } from "../../firebase/storageService";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);

const SITE_DEFAULTS = [
  { id:"r1", name:"Priya Reddy",   init:"PR", loc:"Hyderabad",  rating:5, product:"Lacquer Art Pot",        text:"The pot I ordered is breathtaking! The intricate brushwork and vibrant colours are even more beautiful in person. It's now the centrepiece of my living room.", visible:true },
  { id:"r2", name:"Anil Kumar",    init:"AK", loc:"Bangalore",  rating:5, product:"Artisan Wall Clock",     text:"Gifted this clock to my parents for their anniversary. They were moved to tears by the authentic craftsmanship. Beautifully packed and delivered ahead of schedule.", visible:true },
  { id:"r3", name:"Meera Sharma",  init:"MS", loc:"Mumbai",     rating:5, product:"Heritage Bed Sheet Set", text:"These bed sheets are a work of art! Every morning feels special waking up surrounded by these gorgeous traditional patterns. Truly a piece of Telangana's heritage.", visible:true },
  { id:"r4", name:"Ravi Teja",     init:"RT", loc:"Chennai",    rating:5, product:"Artisan Home Decor",     text:"As someone who values authentic Indian handicrafts, Telugu Seemalo delivers exactly what they promise — GI-certified, handcrafted pieces with a story behind every stroke.", visible:true },
  { id:"r5", name:"Sunitha Nair",  init:"SN", loc:"Kochi",      rating:5, product:"Artisan Curtain Pair",   text:"The curtains transformed my living room completely! The colours are so rich and the quality is exceptional. This is my second order and I'm already planning a third.", visible:true },
  { id:"r6", name:"Venkat Prasad", init:"VP", loc:"Vijayawada", rating:5, product:"Lacquer Art Pot",        text:"Proud to display a GI-tagged piece of our own Telugu heritage at home. The artisans' skill is extraordinary — every line is so precise and full of meaning.", visible:true },
];

const BLANK_SITE = { name:"", init:"", loc:"", rating:5, product:"", text:"", visible:true };
const BLANK_PROD = { name:"", rating:5, title:"", text:"", date:"", verified:false, visible:true, images:[], video:"" };

function StarInput({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.3rem",
            color: n <= value ? "#F0BB50" : "#D1C5BB", padding:"0 2px" }}>
          ★
        </button>
      ))}
    </div>
  );
}

/* Shared image upload UI for product reviews */
function ReviewImageUpload({ images = [], onAdd, onRemove, uploading }) {
  const imgRef = useRef(null);
  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = 5 - images.length;
    if (!files.length || allowed <= 0) return;
    onAdd(files.slice(0, allowed));
    e.target.value = "";
  };
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:".78rem", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:"#6B4C38", marginBottom:6 }}>
        Photos <span style={{ fontWeight:400 }}>(up to 5)</span>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {images.map((src, i) => (
          <div key={i} style={{ position:"relative" }}>
            <img src={src} alt="" style={{ width:68, height:68, objectFit:"cover", borderRadius:8, border:"1.5px solid #E8D5C0" }}/>
            <button onClick={() => onRemove(i)} disabled={uploading}
              style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%",
                background:"#C0392B", color:"#fff", border:"none", cursor:"pointer",
                fontSize:".7rem", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <>
            <input ref={imgRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handle}/>
            <button onClick={() => imgRef.current?.click()} disabled={uploading}
              style={{ width:68, height:68, border:"1.5px dashed #E8D5C0", borderRadius:8,
                background:"#FFFCF7", cursor:"pointer", fontSize:"1.4rem", color:"#6B4C38",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              {uploading ? "…" : "+"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Shared video upload UI for product reviews */
function ReviewVideoUpload({ video, onAdd, onRemove, uploading }) {
  const vidRef = useRef(null);
  const handle = (e) => {
    const file = e.target.files?.[0];
    if (file) { onAdd(file); e.target.value = ""; }
  };
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:".78rem", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:"#6B4C38", marginBottom:6 }}>
        Video <span style={{ fontWeight:400 }}>(optional)</span>
      </div>
      {video ? (
        <div style={{ position:"relative", display:"inline-block" }}>
          <video src={video} controls style={{ width:200, height:120, objectFit:"cover", borderRadius:10, border:"1.5px solid #E8D5C0", display:"block" }}/>
          <button onClick={onRemove} disabled={uploading}
            style={{ position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%",
              background:"#C0392B", color:"#fff", border:"none", cursor:"pointer",
              fontSize:".75rem", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <input ref={vidRef} type="file" accept="video/*" style={{ display:"none" }} onChange={handle}/>
          <button className="rv-upload-btn" onClick={() => vidRef.current?.click()} disabled={uploading}>
            🎥 Add Video
          </button>
        </>
      )}
    </div>
  );
}

export default function AdminReviews() {
  const [section, setSection]   = useState("site");
  const [loading, setLoading]   = useState(true);

  // ── Site reviews ──
  const [siteRevs, setSiteRevs] = useState([]);
  const [editSite, setEditSite] = useState(null);
  const [addSite, setAddSite]   = useState(false);
  const [newSite, setNewSite]   = useState(BLANK_SITE);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteMsg, setSiteMsg]   = useState("");

  // ── Product reviews ──
  const [products, setProducts] = useState([]);
  const [selProd, setSelProd]   = useState("");
  const [prodRevs, setProdRevs] = useState([]);
  const [editProd, setEditProd] = useState(null);
  const [addProd, setAddProd]   = useState(false);
  const [newProd, setNewProd]   = useState(BLANK_PROD);
  const [prodSaving, setProdSaving] = useState(false);
  const [prodMsg, setProdMsg]   = useState("");
  const [prodLoading, setProdLoading] = useState(false);

  // ── Upload state ──
  const [newImgUploading, setNewImgUploading] = useState(false);
  const [newVidUploading, setNewVidUploading] = useState(false);
  const [editUploading,   setEditUploading]   = useState(false);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, "settings", "siteReviews")),
      getDocs(collection(db, "products")),
    ]).then(([siteSnap, prodSnap]) => {
      setSiteRevs(siteSnap.exists() ? siteSnap.data().items || SITE_DEFAULTS : SITE_DEFAULTS);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(() => {
      setSiteRevs(SITE_DEFAULTS);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selProd) return;
    setProdLoading(true);
    getDoc(doc(db, "productReviews", selProd))
      .then(snap => setProdRevs(snap.exists() ? snap.data().reviews || [] : []))
      .catch(() => setProdRevs([]))
      .finally(() => setProdLoading(false));
  }, [selProd]);

  // ── Site review actions ──
  const saveSite = async () => {
    setSiteSaving(true);
    await setDoc(doc(db, "settings", "siteReviews"), { items: siteRevs });
    setSiteSaving(false);
    setSiteMsg("Saved!"); setTimeout(() => setSiteMsg(""), 2500);
  };
  const addSiteReview = () => {
    if (!newSite.name || !newSite.text) return;
    setSiteRevs(p => [...p, { ...newSite, id: uid(), init: initials(newSite.name) || newSite.init }]);
    setNewSite(BLANK_SITE); setAddSite(false);
  };
  const updateSite = (id, k, v) => setSiteRevs(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const deleteSite = (id)      => setSiteRevs(p => p.filter(r => r.id !== id));

  // ── Product review actions ──
  const saveProd = async () => {
    if (!selProd) return;
    setProdSaving(true);
    await setDoc(doc(db, "productReviews", selProd), { reviews: prodRevs });
    setProdSaving(false);
    setProdMsg("Saved!"); setTimeout(() => setProdMsg(""), 2500);
  };
  const addProdReview = () => {
    if (!newProd.name || !newProd.text) return;
    const r = { ...newProd, id: uid(), date: newProd.date || new Date().toISOString().slice(0, 10) };
    setProdRevs(p => [...p, r]);
    setNewProd(BLANK_PROD); setAddProd(false);
  };
  const updateProd = (id, k, v) => setProdRevs(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const deleteProd = (id)      => setProdRevs(p => p.filter(r => r.id !== id));

  // ── Upload handlers for NEW review ──
  const handleNewImages = async (files) => {
    setNewImgUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadReviewImage(f)));
      setNewProd(s => ({ ...s, images: [...(s.images || []), ...urls] }));
    } catch (e) { alert("Image upload failed: " + e.message); }
    setNewImgUploading(false);
  };
  const handleNewVideo = async (file) => {
    setNewVidUploading(true);
    try {
      const url = await uploadReviewVideo(file);
      setNewProd(s => ({ ...s, video: url }));
    } catch (e) { alert("Video upload failed: " + e.message); }
    setNewVidUploading(false);
  };

  // ── Upload handlers for EDIT review ──
  const handleEditImages = async (id, files, existing) => {
    setEditUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadReviewImage(f)));
      updateProd(id, "images", [...(existing || []), ...urls]);
    } catch (e) { alert("Image upload failed: " + e.message); }
    setEditUploading(false);
  };
  const handleEditVideo = async (id, file) => {
    setEditUploading(true);
    try {
      const url = await uploadReviewVideo(file);
      updateProd(id, "video", url);
    } catch (e) { alert("Video upload failed: " + e.message); }
    setEditUploading(false);
  };

  if (loading) return <div className="admin-loading">Loading reviews…</div>;

  const newProdUploading = newImgUploading || newVidUploading;

  return (
    <div className="admin-content">

      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[["site","🏠 Site Reviews"],["product","🏺 Product Reviews"]].map(([k,l]) => (
          <button key={k} onClick={() => setSection(k)}
            className={`admin-btn ${section===k ? "admin-btn-primary" : "admin-btn-outline"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SITE REVIEWS ───────────────────────────────────────────────── */}
      {section === "site" && (
        <div className="admin-card" style={{ maxWidth:860 }}>
          <div className="admin-card-hd">
            <div>
              <h3>Homepage Testimonials</h3>
              <p style={{ fontSize:".8rem", color:"#9B8472", marginTop:2 }}>
                {siteRevs.filter(r => r.visible).length} visible · {siteRevs.length} total
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => { setAddSite(v => !v); setNewSite(BLANK_SITE); }}>
                {addSite ? "✕ Cancel" : "+ Add Review"}
              </button>
              <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={saveSite} disabled={siteSaving}>
                {siteSaving ? "Saving…" : "💾 Save All"}
              </button>
              {siteMsg && <span style={{ color:"#2D7D46", fontWeight:700, fontSize:".85rem" }}>✓ {siteMsg}</span>}
            </div>
          </div>

          {/* Add form */}
          {addSite && (
            <div style={{ padding:"18px 20px", background:"#FFF3ED", borderBottom:"1px solid #F0E8DF" }}>
              <div style={{ fontWeight:700, fontSize:".88rem", marginBottom:14, color:"#18100A" }}>New Site Review</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12, marginBottom:12 }}>
                <div className="admin-inp-grp"><label>Customer Name *</label>
                  <input value={newSite.name} placeholder="Priya Reddy"
                    onChange={e => setNewSite(s => ({ ...s, name:e.target.value, init:initials(e.target.value) }))}/></div>
                <div className="admin-inp-grp"><label>Initials</label>
                  <input value={newSite.init} maxLength={2} placeholder="PR"
                    onChange={e => setNewSite(s => ({ ...s, init:e.target.value.toUpperCase() }))}/></div>
                <div className="admin-inp-grp"><label>City / Location</label>
                  <input value={newSite.loc} placeholder="Hyderabad"
                    onChange={e => setNewSite(s => ({ ...s, loc:e.target.value }))}/></div>
                <div className="admin-inp-grp"><label>Product Name</label>
                  <input value={newSite.product} placeholder="Lacquer Art Pot"
                    onChange={e => setNewSite(s => ({ ...s, product:e.target.value }))}/></div>
              </div>
              <div className="admin-inp-grp" style={{ marginBottom:10 }}>
                <label>Rating</label>
                <StarInput value={newSite.rating} onChange={v => setNewSite(s => ({ ...s, rating:v }))}/>
              </div>
              <div className="admin-inp-grp" style={{ marginBottom:14 }}><label>Review Text *</label>
                <textarea value={newSite.text} rows={3} placeholder="Write the customer's review…"
                  onChange={e => setNewSite(s => ({ ...s, text:e.target.value }))}
                  style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--bd)", borderRadius:8, fontFamily:"DM Sans,sans-serif", fontSize:".85rem", resize:"vertical" }}/></div>
              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={addSiteReview}
                disabled={!newSite.name || !newSite.text}>Add Review</button>
            </div>
          )}

          {/* List */}
          <div>
            {siteRevs.length === 0 && (
              <div style={{ textAlign:"center", padding:"48px", color:"#9B8472" }}>No reviews yet. Add one above.</div>
            )}
            {siteRevs.map((r, i) => (
              <div key={r.id} style={{
                borderBottom: i < siteRevs.length-1 ? "1px solid #F0E8DF" : "none",
                background: r.visible ? "#fff" : "#F8F4F0",
                transition:"background .2s",
              }}>
                {editSite === r.id ? (
                  <div style={{ padding:"18px 20px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
                      <div className="admin-inp-grp"><label>Name</label>
                        <input value={r.name} onChange={e => { updateSite(r.id,"name",e.target.value); updateSite(r.id,"init",initials(e.target.value)||r.init); }}/></div>
                      <div className="admin-inp-grp"><label>Initials</label>
                        <input value={r.init} maxLength={2} onChange={e => updateSite(r.id,"init",e.target.value.toUpperCase())}/></div>
                      <div className="admin-inp-grp"><label>Location</label>
                        <input value={r.loc} onChange={e => updateSite(r.id,"loc",e.target.value)}/></div>
                      <div className="admin-inp-grp"><label>Product</label>
                        <input value={r.product} onChange={e => updateSite(r.id,"product",e.target.value)}/></div>
                    </div>
                    <div className="admin-inp-grp" style={{ marginBottom:10 }}>
                      <label>Rating</label>
                      <StarInput value={r.rating} onChange={v => updateSite(r.id,"rating",v)}/>
                    </div>
                    <div className="admin-inp-grp" style={{ marginBottom:12 }}><label>Review Text</label>
                      <textarea value={r.text} rows={3} onChange={e => updateSite(r.id,"text",e.target.value)}
                        style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--bd)", borderRadius:8, fontFamily:"DM Sans,sans-serif", fontSize:".85rem", resize:"vertical" }}/></div>
                    <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setEditSite(null)}>✓ Done</button>
                  </div>
                ) : (
                  <div style={{ padding:"14px 20px", display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0, display:"flex",
                      alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:".9rem",
                      fontFamily:"Cormorant Garamond,serif", color:"#fff",
                      background:"linear-gradient(135deg,#E8620A,#C9901A)" }}>
                      {r.init}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                        <strong style={{ fontSize:".88rem" }}>{r.name}</strong>
                        <span style={{ fontSize:".73rem", color:"#9B8472" }}>{r.loc}{r.product ? ` · ${r.product}` : ""}</span>
                        <span style={{ color:"#F0BB50", fontSize:".8rem", letterSpacing:1 }}>{"★".repeat(r.rating)}</span>
                        {!r.visible && <span style={{ fontSize:".68rem", background:"#F0E8DF", color:"#9B8472", padding:"1px 8px", borderRadius:10, fontWeight:600 }}>Hidden</span>}
                      </div>
                      <p style={{ fontSize:".81rem", color:"#6B4C38", margin:0, lineHeight:1.6,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:480 }}>
                        {r.text}
                      </p>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button className="admin-btn admin-btn-sm admin-btn-outline"
                        onClick={() => updateSite(r.id,"visible",!r.visible)}>
                        {r.visible ? "Hide" : "Show"}
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-outline"
                        onClick={() => setEditSite(r.id)}>Edit</button>
                      <button onClick={() => deleteSite(r.id)}
                        style={{ background:"#FEF0EF", color:"#C0392B", border:"1.5px solid #FADBD8",
                          borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:".85rem", fontWeight:700 }}>
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRODUCT REVIEWS ──────────────────────────────────────────────── */}
      {section === "product" && (
        <div className="admin-card" style={{ maxWidth:900 }}>
          <div className="admin-card-hd"><h3>Product Reviews</h3></div>

          {/* Product selector */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #F0E8DF" }}>
            <div className="admin-inp-grp" style={{ maxWidth:420, margin:0 }}>
              <label>Select Product</label>
              <select value={selProd}
                onChange={e => { setSelProd(e.target.value); setEditProd(null); setAddProd(false); }}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid var(--bd)", borderRadius:8,
                  fontFamily:"DM Sans,sans-serif", fontSize:".88rem", background:"#fff", cursor:"pointer" }}>
                <option value="">— choose a product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {!selProd && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#9B8472" }}>
              Select a product above to view and manage its reviews.
            </div>
          )}

          {selProd && (
            <>
              {/* Toolbar */}
              <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0E8DF", display:"flex", gap:10, alignItems:"center" }}>
                <button className="admin-btn admin-btn-sm admin-btn-outline"
                  onClick={() => { setAddProd(v => !v); setNewProd(BLANK_PROD); }}>
                  {addProd ? "✕ Cancel" : "+ Add Review"}
                </button>
                <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={saveProd} disabled={prodSaving}>
                  {prodSaving ? "Saving…" : "💾 Save All"}
                </button>
                {prodMsg && <span style={{ color:"#2D7D46", fontWeight:700, fontSize:".85rem" }}>✓ {prodMsg}</span>}
                <span style={{ marginLeft:"auto", fontSize:".8rem", color:"#9B8472" }}>
                  {prodRevs.filter(r=>r.visible!==false).length} visible · {prodRevs.length} total
                </span>
              </div>

              {/* Add form */}
              {addProd && (
                <div style={{ padding:"18px 20px", background:"#FFF3ED", borderBottom:"1px solid #F0E8DF" }}>
                  <div style={{ fontWeight:700, fontSize:".88rem", marginBottom:14 }}>New Product Review</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
                    <div className="admin-inp-grp"><label>Customer Name *</label>
                      <input value={newProd.name} placeholder="Customer Name"
                        onChange={e => setNewProd(s => ({ ...s, name:e.target.value }))}/></div>
                    <div className="admin-inp-grp"><label>Review Title</label>
                      <input value={newProd.title} placeholder="Great product!"
                        onChange={e => setNewProd(s => ({ ...s, title:e.target.value }))}/></div>
                    <div className="admin-inp-grp"><label>Date</label>
                      <input type="date" value={newProd.date}
                        onChange={e => setNewProd(s => ({ ...s, date:e.target.value }))}/></div>
                  </div>
                  <div className="admin-inp-grp" style={{ marginBottom:10 }}>
                    <label>Rating</label>
                    <StarInput value={newProd.rating} onChange={v => setNewProd(s => ({ ...s, rating:v }))}/>
                  </div>
                  <div className="admin-inp-grp" style={{ marginBottom:12 }}><label>Review Text *</label>
                    <textarea value={newProd.text} rows={3} placeholder="Write the customer's review…"
                      onChange={e => setNewProd(s => ({ ...s, text:e.target.value }))}
                      style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--bd)", borderRadius:8, fontFamily:"DM Sans,sans-serif", fontSize:".85rem", resize:"vertical" }}/></div>

                  {/* Image upload */}
                  <ReviewImageUpload
                    images={newProd.images || []}
                    onAdd={handleNewImages}
                    onRemove={i => setNewProd(s => ({ ...s, images: s.images.filter((_,idx) => idx !== i) }))}
                    uploading={newImgUploading}
                  />
                  {newImgUploading && <div style={{ fontSize:".8rem", color:"#E8620A", marginBottom:8, fontWeight:600 }}>Uploading images…</div>}

                  {/* Video upload */}
                  <ReviewVideoUpload
                    video={newProd.video}
                    onAdd={handleNewVideo}
                    onRemove={() => setNewProd(s => ({ ...s, video:"" }))}
                    uploading={newVidUploading}
                  />
                  {newVidUploading && <div style={{ fontSize:".8rem", color:"#E8620A", marginBottom:8, fontWeight:600 }}>Uploading video…</div>}

                  <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem", marginBottom:14, cursor:"pointer" }}>
                    <input type="checkbox" checked={newProd.verified}
                      onChange={e => setNewProd(s => ({ ...s, verified:e.target.checked }))}/>
                    Mark as Verified Purchase
                  </label>
                  <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={addProdReview}
                    disabled={!newProd.name || !newProd.text || newProdUploading}>Add Review</button>
                </div>
              )}

              {/* Product reviews list */}
              {prodLoading ? (
                <div style={{ textAlign:"center", padding:"48px", color:"#9B8472" }}>Loading reviews…</div>
              ) : prodRevs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px", color:"#9B8472" }}>No reviews yet for this product.</div>
              ) : prodRevs.map((r, i) => (
                <div key={r.id} style={{
                  borderBottom: i < prodRevs.length-1 ? "1px solid #F0E8DF" : "none",
                  background: r.visible === false ? "#F8F4F0" : "#fff",
                }}>
                  {editProd === r.id ? (
                    <div style={{ padding:"18px 20px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
                        <div className="admin-inp-grp"><label>Name</label>
                          <input value={r.name} onChange={e => updateProd(r.id,"name",e.target.value)}/></div>
                        <div className="admin-inp-grp"><label>Title</label>
                          <input value={r.title||""} onChange={e => updateProd(r.id,"title",e.target.value)}/></div>
                        <div className="admin-inp-grp"><label>Date</label>
                          <input type="date" value={r.date||""} onChange={e => updateProd(r.id,"date",e.target.value)}/></div>
                      </div>
                      <div className="admin-inp-grp" style={{ marginBottom:10 }}>
                        <label>Rating</label>
                        <StarInput value={r.rating} onChange={v => updateProd(r.id,"rating",v)}/>
                      </div>
                      <div className="admin-inp-grp" style={{ marginBottom:12 }}><label>Review Text</label>
                        <textarea value={r.text} rows={3} onChange={e => updateProd(r.id,"text",e.target.value)}
                          style={{ width:"100%", padding:"8px 12px", border:"1.5px solid var(--bd)", borderRadius:8, fontFamily:"DM Sans,sans-serif", fontSize:".85rem", resize:"vertical" }}/></div>

                      {/* Image upload in edit */}
                      <ReviewImageUpload
                        images={r.images || []}
                        onAdd={files => handleEditImages(r.id, files, r.images || [])}
                        onRemove={idx => updateProd(r.id, "images", (r.images || []).filter((_,j) => j !== idx))}
                        uploading={editUploading}
                      />
                      {editUploading && <div style={{ fontSize:".8rem", color:"#E8620A", marginBottom:8, fontWeight:600 }}>Uploading…</div>}

                      {/* Video upload in edit */}
                      <ReviewVideoUpload
                        video={r.video || ""}
                        onAdd={file => handleEditVideo(r.id, file)}
                        onRemove={() => updateProd(r.id, "video", "")}
                        uploading={editUploading}
                      />

                      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem", marginBottom:12, cursor:"pointer" }}>
                        <input type="checkbox" checked={r.verified||false}
                          onChange={e => updateProd(r.id,"verified",e.target.checked)}/>
                        Verified Purchase
                      </label>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setEditProd(null)}>✓ Done</button>
                    </div>
                  ) : (
                    <div style={{ padding:"14px 20px", display:"flex", gap:12, alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                          <strong style={{ fontSize:".88rem" }}>{r.name}</strong>
                          {r.verified && <span style={{ fontSize:".7rem", background:"#E8F5E9", color:"#2D7D46", padding:"1px 8px", borderRadius:10, fontWeight:600 }}>✓ Verified</span>}
                          <span style={{ color:"#F0BB50", fontSize:".82rem", letterSpacing:1 }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                          </span>
                          {r.date && <span style={{ fontSize:".73rem", color:"#9B8472" }}>{r.date}</span>}
                          {r.visible === false && (
                            <span style={{ fontSize:".68rem", background:"#FFF3E0", color:"#E65100", padding:"1px 8px", borderRadius:10, fontWeight:600 }}>
                              Pending Approval
                            </span>
                          )}
                        </div>
                        {r.title && <div style={{ fontWeight:700, fontSize:".85rem", marginBottom:3 }}>{r.title}</div>}
                        <p style={{ fontSize:".81rem", color:"#6B4C38", margin:0, lineHeight:1.6, marginBottom: (r.images?.length || r.video) ? 8 : 0 }}>{r.text}</p>

                        {/* Media thumbnails */}
                        {(r.images?.length > 0 || r.video) && (
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                            {(r.images || []).map((src, idx) => (
                              <img key={idx} src={src} alt="" style={{ width:52, height:52, objectFit:"cover", borderRadius:6, border:"1.5px solid #E8D5C0" }}/>
                            ))}
                            {r.video && (
                              <div style={{ width:52, height:52, borderRadius:6, border:"1.5px solid #E8D5C0",
                                background:"#18100A", display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:"1.3rem" }}>
                                🎥
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        {r.visible === false && (
                          <button className="admin-btn admin-btn-sm"
                            style={{ background:"#E8F5E9", color:"#2D7D46", border:"1.5px solid #A5D6A7", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:".82rem", fontWeight:700 }}
                            onClick={() => updateProd(r.id,"visible",true)}>
                            ✓ Approve
                          </button>
                        )}
                        <button className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => updateProd(r.id,"visible", r.visible === false ? true : false)}>
                          {r.visible === false ? "Show" : "Hide"}
                        </button>
                        <button className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => setEditProd(r.id)}>Edit</button>
                        <button onClick={() => deleteProd(r.id)}
                          style={{ background:"#FEF0EF", color:"#C0392B", border:"1.5px solid #FADBD8",
                            borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:".85rem", fontWeight:700 }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
