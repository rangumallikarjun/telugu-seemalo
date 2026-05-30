import { useState, useEffect, useRef } from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { fmt, disc, Stars } from "../utils/helpers";
import ProductCard from "../components/ProductCard";
import { trackView } from "../utils/recentlyViewed";
import { uploadReviewImage, uploadReviewVideo } from "../firebase/storageService";

const SHIP_DEFAULTS = { standardDays: "5–7", expressDays: "2–3", enableExpress: true };

// ── helpers ───────────────────────────────────────────────────────────────────
const rvUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.6rem",
            color: n <= (hover || value) ? "#F0BB50" : "#D1C5BB", padding:"0 2px", lineHeight:1 }}>
          ★
        </button>
      ))}
    </div>
  );
}

// ── Customer write-review form ────────────────────────────────────────────────
function WriteReviewForm({ productId, user, onSubmitted }) {
  const [name, setName]   = useState(user?.name || "");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText]   = useState("");
  const [imgFiles, setImgFiles]     = useState([]);
  const [imgPreviews, setImgPreviews] = useState([]);
  const [vidFile, setVidFile]       = useState(null);
  const [vidPreview, setVidPreview] = useState("");
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState("");
  const [error, setError]           = useState("");
  const imgRef = useRef(null);
  const vidRef = useRef(null);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImgFiles(files);
    setImgPreviews(files.map(f => URL.createObjectURL(f)));
  };
  const removeImg = (i) => {
    setImgFiles(p => p.filter((_, j) => j !== i));
    setImgPreviews(p => p.filter((_, j) => j !== i));
  };
  const handleVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVidFile(file);
    setVidPreview(URL.createObjectURL(file));
  };
  const removeVideo = () => { setVidFile(null); setVidPreview(""); if (vidRef.current) vidRef.current.value = ""; };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!text.trim()) { setError("Please write your review."); return; }
    setError(""); setUploading(true);
    try {
      setUploadMsg("Uploading images…");
      const imageUrls = await Promise.all(imgFiles.map(f => uploadReviewImage(f)));
      if (vidFile) setUploadMsg("Uploading video…");
      const videoUrl = vidFile ? await uploadReviewVideo(vidFile) : "";
      setUploadMsg("Saving review…");
      const review = {
        id: rvUid(), name: name.trim(), rating, title: title.trim(),
        text: text.trim(), images: imageUrls, video: videoUrl,
        date: new Date().toISOString().slice(0, 10),
        verified: false, visible: true,
      };
      const ref  = doc(db, "productReviews", String(productId));
      const snap = await getDoc(ref);
      const prev = snap.exists() ? (snap.data().reviews || []) : [];
      await setDoc(ref, { reviews: [...prev, review] });
      onSubmitted();
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false); setUploadMsg("");
    }
  };

  return (
    <div className="rv-form">
      <h4 className="rv-form-hd">Write a Review</h4>

      <div className="rv-form-grid">
        <div className="rv-form-grp">
          <label>Your Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" disabled={uploading}/>
        </div>
        <div className="rv-form-grp">
          <label>Rating *</label>
          <StarPicker value={rating} onChange={setRating}/>
        </div>
        <div className="rv-form-grp" style={{ gridColumn:"1/-1" }}>
          <label>Review Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarise your experience" disabled={uploading}/>
        </div>
        <div className="rv-form-grp" style={{ gridColumn:"1/-1" }}>
          <label>Review *</label>
          <textarea value={text} rows={4} onChange={e => setText(e.target.value)}
            placeholder="Share details about your experience with this product…" disabled={uploading}
            style={{ width:"100%", padding:"10px 12px", border:"1.5px solid var(--bd)", borderRadius:10,
              fontFamily:"DM Sans,sans-serif", fontSize:".88rem", resize:"vertical", outline:"none" }}/>
        </div>
      </div>

      {/* Image upload */}
      <div className="rv-form-grp" style={{ marginBottom:12 }}>
        <label>Photos <span style={{ fontWeight:400, color:"var(--mt)" }}>(up to 5)</span></label>
        {imgPreviews.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
            {imgPreviews.map((src, i) => (
              <div key={i} style={{ position:"relative" }}>
                <img src={src} alt="" style={{ width:72, height:72, objectFit:"cover", borderRadius:8, border:"1.5px solid var(--bd)" }}/>
                <button onClick={() => removeImg(i)} disabled={uploading}
                  style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%",
                    background:"#C0392B", color:"#fff", border:"none", cursor:"pointer",
                    fontSize:".7rem", fontWeight:900, lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  ✕
                </button>
              </div>
            ))}
            {imgPreviews.length < 5 && (
              <button onClick={() => imgRef.current?.click()} disabled={uploading}
                style={{ width:72, height:72, border:"1.5px dashed var(--bd)", borderRadius:8,
                  background:"#FFFCF7", cursor:"pointer", fontSize:"1.4rem", color:"var(--mt)" }}>
                +
              </button>
            )}
          </div>
        )}
        <input ref={imgRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleImages}/>
        {imgPreviews.length === 0 && (
          <button className="rv-upload-btn" onClick={() => imgRef.current?.click()} disabled={uploading}>
            📷 Add Photos
          </button>
        )}
      </div>

      {/* Video upload */}
      <div className="rv-form-grp" style={{ marginBottom:16 }}>
        <label>Video <span style={{ fontWeight:400, color:"var(--mt)" }}>(optional, 1 clip)</span></label>
        {vidPreview ? (
          <div style={{ position:"relative", display:"inline-block", marginTop:6 }}>
            <video src={vidPreview} style={{ width:200, height:120, objectFit:"cover", borderRadius:10, border:"1.5px solid var(--bd)" }} controls/>
            <button onClick={removeVideo} disabled={uploading}
              style={{ position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%",
                background:"#C0392B", color:"#fff", border:"none", cursor:"pointer",
                fontSize:".75rem", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
          </div>
        ) : (
          <>
            <input ref={vidRef} type="file" accept="video/*" style={{ display:"none" }} onChange={handleVideo}/>
            <button className="rv-upload-btn" onClick={() => vidRef.current?.click()} disabled={uploading}>
              🎥 Add Video
            </button>
          </>
        )}
      </div>

      {error && <div style={{ color:"#C0392B", fontSize:".83rem", marginBottom:10 }}>{error}</div>}
      {uploadMsg && <div style={{ color:"var(--sf)", fontSize:".83rem", marginBottom:10, fontWeight:600 }}>{uploadMsg}</div>}

      <button className="pd-add" onClick={handleSubmit} disabled={uploading || !name || !text}
        style={{ minWidth:160 }}>
        {uploading ? "Submitting…" : "Submit Review"}
      </button>
      <p style={{ fontSize:".75rem", color:"var(--mt)", marginTop:10 }}>
        Your review has been published. Thank you!
      </p>
    </div>
  );
}

// ── Product Reviews Tab ───────────────────────────────────────────────────────
const PAGE_SIZE = 5;
const SORT_OPTS = [
  { value:"newest",  label:"Newest First" },
  { value:"oldest",  label:"Oldest First" },
  { value:"highest", label:"Highest Rated" },
  { value:"lowest",  label:"Lowest Rated" },
];

function ReviewsTab({ productId, rating, reviewCount, user }) {
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [filterRating, setFilterRating] = useState(0);  // 0 = all
  const [sortBy, setSortBy]             = useState("newest");
  const [currentPage, setCurrentPage]   = useState(1);

  const load = () => {
    setLoading(true);
    getDoc(doc(db, "productReviews", String(productId)))
      .then(snap => setReviews(snap.exists() ? (snap.data().reviews || []).filter(r => r.visible !== false) : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [productId]);  // eslint-disable-line

  // Reset page when filter/sort changes
  useEffect(() => { setCurrentPage(1); }, [filterRating, sortBy]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : rating;

  // Apply filter + sort
  const filtered = reviews
    .filter(r => filterRating === 0 || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === "newest")  return (b.date || "").localeCompare(a.date || "");
      if (sortBy === "oldest")  return (a.date || "").localeCompare(b.date || "");
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest")  return a.rating - b.rating;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onSubmitted = () => {
    setSubmitted(true);
    setShowForm(false);
    load(); // reload to show new review immediately
  };

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:9998,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out",
        }}>
          <img src={lightbox.url} alt="" style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:10, objectFit:"contain" }}/>
        </div>
      )}

      {/* Summary */}
      <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ textAlign:"center", minWidth:70 }}>
          <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"3.2rem", fontWeight:700, color:"var(--dk)", lineHeight:1 }}>{avg}</div>
          <div style={{ color:"#F0BB50", fontSize:"1rem", letterSpacing:2, margin:"4px 0 2px" }}>
            {"★".repeat(Math.round(avg))}{"☆".repeat(5-Math.round(avg))}
          </div>
          <div style={{ fontSize:".75rem", color:"var(--mt)" }}>{reviews.length || reviewCount} reviews</div>
        </div>

        {reviews.length > 0 && (
          <div style={{ flex:1, minWidth:160 }}>
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct   = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:".73rem", color:"var(--mt)", width:10 }}>{star}</span>
                  <span style={{ color:"#F0BB50", fontSize:".68rem" }}>★</span>
                  <div style={{ flex:1, height:6, background:"#F0E8DF", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:"#F0BB50", borderRadius:4, transition:"width .5s" }}/>
                  </div>
                  <span style={{ fontSize:".72rem", color:"var(--mt)", width:18, textAlign:"right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}

        <button className="rv-write-btn" onClick={() => { setShowForm(v => !v); setSubmitted(false); }}>
          {showForm ? "✕ Cancel" : "✍ Write a Review"}
        </button>
      </div>

      {/* Write review form */}
      {showForm && !submitted && (
        <WriteReviewForm productId={productId} user={user} onSubmitted={onSubmitted}/>
      )}
      {submitted && (
        <div style={{ background:"#E8F5E9", border:"1.5px solid #A8D5B0", borderRadius:12, padding:"18px 20px",
          marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:"1.6rem" }}>✅</span>
          <div>
            <div style={{ fontWeight:700, color:"#1E6B3C" }}>Review published!</div>
            <div style={{ fontSize:".82rem", color:"#2D7D46", marginTop:2 }}>
              Thank you! Your review is now live.
            </div>
          </div>
        </div>
      )}

      {/* Filter + sort bar */}
      {reviews.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
          marginBottom:20, paddingBottom:16, borderBottom:"1px solid var(--bd)" }}>
          {/* Rating filter pills */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[0,5,4,3,2,1].map(star => {
              const active = filterRating === star;
              const count = star === 0 ? reviews.length : reviews.filter(r => r.rating === star).length;
              return (
                <button key={star} onClick={() => setFilterRating(star)}
                  style={{
                    padding:"5px 13px", borderRadius:20, border:"1.5px solid",
                    borderColor: active ? "var(--sf)" : "var(--bd)",
                    background: active ? "var(--sf)" : "#fff",
                    color: active ? "#fff" : "var(--mt)",
                    fontSize:".78rem", fontWeight:600, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                  }}>
                  {star === 0 ? `All (${count})` : `${"★".repeat(star)} (${count})`}
                </button>
              );
            })}
          </div>
          {/* Sort dropdown */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ marginLeft:"auto", padding:"6px 12px", border:"1.5px solid var(--bd)",
              borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:".82rem",
              background:"#fff", color:"var(--dk)", cursor:"pointer", outline:"none" }}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div style={{ color:"var(--mt)", padding:"20px 0" }}>Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div style={{ color:"var(--mt)", padding:"20px 0", fontSize:".9rem" }}>
          No reviews yet — be the first to share your experience!
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color:"var(--mt)", padding:"20px 0", fontSize:".9rem" }}>
          No {filterRating}★ reviews yet.{" "}
          <button onClick={() => setFilterRating(0)}
            style={{ color:"var(--sf)", background:"none", border:"none", cursor:"pointer", fontWeight:600, fontSize:".9rem" }}>
            Show all
          </button>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {paginated.map((r, i) => (
              <div key={r.id} style={{ borderBottom: i < paginated.length-1 ? "1px solid var(--bd)" : "none", padding:"18px 0" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,var(--sf),var(--gd))",
                    color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:700, fontSize:".82rem", flexShrink:0 }}>
                    {r.name?.slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize:".88rem", display:"block" }}>{r.name}</strong>
                    <span style={{ color:"#F0BB50", fontSize:".8rem", letterSpacing:1 }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                    </span>
                  </div>
                  {r.verified && (
                    <span style={{ fontSize:".7rem", background:"#E8F5E9", color:"#2D7D46",
                      padding:"2px 8px", borderRadius:10, fontWeight:600 }}>✓ Verified</span>
                  )}
                  {r.date && <span style={{ fontSize:".72rem", color:"var(--mt)", marginLeft:"auto" }}>{r.date}</span>}
                </div>

                {r.title && <div style={{ fontWeight:700, fontSize:".88rem", marginBottom:4 }}>{r.title}</div>}
                <p style={{ fontSize:".86rem", color:"var(--mt)", lineHeight:1.75, margin:"0 0 12px" }}>{r.text}</p>

                {/* Review images */}
                {r.images?.length > 0 && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: r.video ? 10 : 0 }}>
                    {r.images.map((url, idx) => (
                      <img key={idx} src={url} alt="" onClick={() => setLightbox({ url })}
                        style={{ width:80, height:80, objectFit:"cover", borderRadius:8,
                          cursor:"zoom-in", border:"1.5px solid var(--bd)" }}/>
                    ))}
                  </div>
                )}

                {/* Review video */}
                {r.video && (
                  <video src={r.video} controls
                    style={{ marginTop:8, width:"100%", maxWidth:360, borderRadius:10,
                      border:"1.5px solid var(--bd)" }}/>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:6, paddingTop:20, marginTop:4, borderTop:"1px solid var(--bd)" }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
                style={{ padding:"6px 14px", border:"1.5px solid var(--bd)", borderRadius:8,
                  background: currentPage === 1 ? "#F8F4F0" : "#fff", cursor: currentPage === 1 ? "default" : "pointer",
                  color: currentPage === 1 ? "#C4B49A" : "var(--dk)", fontWeight:600, fontSize:".85rem",
                  fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(pg => (
                <button key={pg} onClick={() => setCurrentPage(pg)}
                  style={{ width:34, height:34, border:"1.5px solid",
                    borderColor: pg === currentPage ? "var(--sf)" : "var(--bd)",
                    borderRadius:8, background: pg === currentPage ? "var(--sf)" : "#fff",
                    color: pg === currentPage ? "#fff" : "var(--dk)",
                    cursor:"pointer", fontWeight:700, fontSize:".85rem",
                    fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
                  {pg}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
                style={{ padding:"6px 14px", border:"1.5px solid var(--bd)", borderRadius:8,
                  background: currentPage === totalPages ? "#F8F4F0" : "#fff", cursor: currentPage === totalPages ? "default" : "pointer",
                  color: currentPage === totalPages ? "#C4B49A" : "var(--dk)", fontWeight:600, fontSize:".85rem",
                  fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
                Next →
              </button>
              <span style={{ fontSize:".78rem", color:"var(--mt)", marginLeft:6 }}>
                {filtered.length} review{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function parseRange(str = "") {
  const parts = String(str).split(/[–\-]/);
  return [parseInt(parts[0]) || 5, parseInt(parts[parts.length - 1]) || 7];
}

function addBusinessDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// ── Image + Video slider ──────────────────────────────────────────────────────
function MediaSlider({ images = [], video = "", emoji }) {
  const [idx, setIdx]           = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const total = images.length + (video ? 1 : 0);
  const hasMedia = total > 0;

  const prev = () => {
    setShowVideo(false);
    setIdx(i => (i - 1 + images.length) % images.length);
  };
  const next = () => {
    setShowVideo(false);
    setIdx(i => (i + 1) % images.length);
  };

  if (!hasMedia) {
    return <div className="pd-img">{emoji}</div>;
  }

  return (
    <div>
      {/* Main display */}
      <div className="pd-slider">
        {showVideo ? (
          <video className="pd-video-player" src={video} controls autoPlay/>
        ) : images.length > 0 ? (
          <img className="pd-slide-main" src={images[idx]} alt="product"/>
        ) : (
          <div className="pd-slide-emoji">{emoji}</div>
        )}

        {images.length > 1 && !showVideo && (
          <>
            <button className="pd-slide-arrow prev" onClick={prev}>‹</button>
            <button className="pd-slide-arrow next" onClick={next}>›</button>
            <div className="pd-slide-dots">
              {images.map((_, i) => (
                <button key={i} className={`pd-dot ${idx === i ? "act" : ""}`}
                  onClick={() => { setShowVideo(false); setIdx(i); }}/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="pd-thumbs">
          {images.map((url, i) => (
            <img key={i} className={`pd-thumb ${!showVideo && idx === i ? "act" : ""}`}
              src={url} alt={`thumb-${i}`}
              onClick={() => { setShowVideo(false); setIdx(i); }}/>
          ))}
          {video && (
            <div className={`pd-thumb-video ${showVideo ? "act" : ""}`}
              onClick={() => setShowVideo(true)} title="Play video">
              ▶
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ProductPage ──────────────────────────────────────────────────────────
export default function ProductPage({p, onBack, onAdd, onOpen, related, user}) {
  const [sz, setSz] = useState(p.sizes?.[0]);
  const [clr, setClr] = useState(p.colors?.[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [sgOpen, setSgOpen] = useState(false);
  const [shipCfg, setShipCfg] = useState(SHIP_DEFAULTS);
  const [copied, setCopied] = useState(false);
  const [viewers, setViewers] = useState(null);
  const [viewerCfg, setViewerCfg] = useState({ enabled: true, min: 12, max: 68 });
  const [stickyVisible, setStickyVisible] = useState(false);
  const atcRef = useRef(null);

  useEffect(() => {
    setSz(p.sizes?.[0]);
    setClr(p.colors?.[0]);
    setQty(1);
    setTab("desc");
    setSgOpen(false);
    trackView(p.id);
  }, [p.id]);

  useEffect(() => {
    getDoc(doc(db, "settings", "shipping"))
      .then(snap => { if (snap.exists()) setShipCfg(s => ({ ...s, ...snap.data() })); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setViewerCfg({
            enabled: d.viewerEnabled !== false,
            min: d.viewerMin || 12,
            max: d.viewerMax || 68,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!viewerCfg.enabled) { setViewers(null); return; }
    const { min, max } = viewerCfg;
    setViewers(Math.floor(Math.random() * (max - min + 1)) + min);
    const id = setInterval(() => {
      setViewers(v => {
        const delta = Math.random() < 0.5 ? 1 : -1;
        return Math.min(max, Math.max(min, v + delta));
      });
    }, 4000);
    return () => clearInterval(id);
  }, [viewerCfg]);

  useEffect(() => {
    const el = atcRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const shareUrl = `${window.location.origin}/product?id=${p.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    const text = `🏺 *${p.name}* — ${fmt(p.price)} (${disc(p.price, p.originalPrice)}% off!)\n\n${p.description?.slice(0, 100) || ""}…\n\n🔗 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const today = new Date();
  const [stdMin, stdMax] = parseRange(shipCfg.standardDays);
  const [expMin, expMax] = parseRange(shipCfg.expressDays);

  const handleAdd = () => onAdd({ ...p, selSize: sz, selColor: clr?.name }, qty);

  return (
    <div>
      <div className="pd-wrap">
        <button className="pd-back" onClick={onBack}>← Back to Shop</button>
        <div className="pd-grid">

          <MediaSlider images={p.images} video={p.video} emoji={p.emoji}/>

          <div className="pd-info">
            <div className="pd-cat">{p.category}</div>
            <h1 className="pd-name">{p.name}</h1>
            <div className="pd-stars"><Stars r={p.rating}/><span className="rv">{p.rating} · {p.reviews} reviews</span></div>
            <div className="pd-price-row">
              <span className="pd-price">{fmt(p.price)}</span>
              <span className="pd-oprice">{fmt(p.originalPrice)}</span>
              <span className="pd-disc">{disc(p.price, p.originalPrice)}% off</span>
            </div>
            <div className="pd-gi">🏷️ GI-Tagged · Karimnagar, Telangana</div>
            {viewers !== null && (
              <div className="viewer-badge">
                <span className="viewer-dot"/>
                {viewers} people viewing this right now
              </div>
            )}
            <p className="pd-desc">{p.description}</p>

            {p.sizes?.length > 0 && (
              <>
                <div className="pd-label">Size <span style={{fontWeight:400,color:"var(--mt)",textTransform:"none",letterSpacing:0}}>— {sz}</span></div>
                <div className="sz-row">
                  {p.sizes.map(s => (
                    <button key={s} className={`pd-sz ${sz === s ? "act" : ""}`} onClick={() => setSz(s)}>{s}</button>
                  ))}
                </div>

                {p.sg?.length > 0 && (
                  <>
                    <button className="sg-toggle" onClick={() => setSgOpen(!sgOpen)}>
                      📏 {sgOpen ? "Hide" : "View"} Size Guide
                    </button>
                    {sgOpen && (
                      <div className="sg-wrap">
                        <table className="sg-table">
                          <thead><tr><th>Size</th><th>Dimensions</th><th>Weight</th><th>Best For</th></tr></thead>
                          <tbody>
                            {p.sg.map(r => (
                              <tr key={r.sz} className={r.sz === sz ? "sg-act" : ""}>
                                <td>{r.sz}{r.sz === sz && <span className="sg-sel">Selected</span>}</td>
                                <td>{r.dim}</td><td>{r.wt}</td><td>{r.best}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {p.colors?.length > 0 && (
              <>
                <div className="pd-label">Colour</div>
                <div className="clr-row">
                  {p.colors.map(c => (
                    <div key={c.name} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={() => setClr(c)}>
                      <div className={`clr-dot ${clr?.name === c.name ? "act" : ""}`} style={{background:c.hex}} title={c.name}/>
                      <span className="clr-name" style={{fontWeight:clr?.name===c.name?700:400,color:clr?.name===c.name?"var(--sf)":"var(--mt)"}}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {p.stock <= 5 && p.stock > 0 && <div className="stock-low">⚠ Only {p.stock} left in stock!</div>}

            <div className="qty-row" ref={atcRef}>
              <div className="qty-ctrl">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(p.stock || 10, q + 1))}>+</button>
              </div>
              <button className="pd-add" disabled={p.stock === 0} onClick={handleAdd}>
                {p.stock === 0 ? "Sold Out" : "Add to Cart"}
              </button>
              <button className="pd-wish" title="Add to wishlist">♡</button>
            </div>

            {/* Estimated delivery */}
            {p.stock !== 0 && (
              <div className="pd-delivery">
                <div className="pd-delivery-hd">📦 Estimated Delivery</div>
                <div className="pd-del-row">
                  <span className="pd-del-icon">🚚</span>
                  <span>
                    Standard — {fmtDate(addBusinessDays(today, stdMin))} – {fmtDate(addBusinessDays(today, stdMax))}
                    <span className="pd-del-days">({shipCfg.standardDays} days)</span>
                  </span>
                </div>
                {shipCfg.enableExpress && (
                  <div className="pd-del-row">
                    <span className="pd-del-icon">⚡</span>
                    <span>
                      Express — {fmtDate(addBusinessDays(today, expMin))} – {fmtDate(addBusinessDays(today, expMax))}
                      <span className="pd-del-days">({shipCfg.expressDays} days)</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Share */}
            <div className="pd-share-row">
              <button className={`pd-share-btn pd-share-copy${copied ? " done" : ""}`} onClick={handleCopy}>
                {copied ? "✓ Copied!" : "🔗 Copy Link"}
              </button>
              <button className="pd-share-btn pd-share-wa" onClick={handleWhatsApp}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="tabs">
          {[["desc","Description"],["spec","Specifications"],["sizeguide","Size & Care"],["rev","Reviews"]].map(([k,l]) => (
            <button key={k} className={`tab ${tab === k ? "act" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="tab-body">
          {tab === "desc" && (
            <div>
              <p style={{marginBottom:16}}>{p.description}</p>
              {p.features?.length > 0 && (
                <ul className="feat-list">
                  {p.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>
          )}
          {tab === "spec" && (
            <table className="spec-table">
              <tbody>{(p.specs || []).map((s, i) => <tr key={i}><td>{s.key}</td><td>{s.val}</td></tr>)}</tbody>
            </table>
          )}
          {tab === "sizeguide" && (
            <div>
              {p.sg?.length > 0 ? (
                <>
                  <p style={{marginBottom:16,color:"var(--mt)"}}>Currently selected: <strong style={{color:"var(--sf)"}}>{sz}</strong>.</p>
                  <div className="sg-wrap">
                    <table className="sg-table">
                      <thead><tr><th>Size</th><th>Dimensions</th><th>Weight</th><th>Best For</th></tr></thead>
                      <tbody>
                        {p.sg.map(r => (
                          <tr key={r.sz} className={r.sz === sz ? "sg-act" : ""}>
                            <td>{r.sz}{r.sz === sz && <span className="sg-sel">Selected</span>}</td>
                            <td>{r.dim}</td><td>{r.wt}</td><td>{r.best}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : <p style={{color:"var(--mt)"}}>No size guide available for this product.</p>}
              <p style={{marginTop:14,color:"var(--mt)",fontSize:".85rem"}}>🌿 <strong>Care:</strong> Follow washing instructions on the label. Store in a cool dry place.</p>
            </div>
          )}
          {tab === "rev" && (
            <ReviewsTab productId={p.id} rating={p.rating} reviewCount={p.reviews} user={user}/>
          )}
        </div>
      </div>

      {stickyVisible && p.stock !== 0 && (
        <div className="sticky-atc">
          <div className="sticky-atc-info">
            <div className="sticky-atc-name">{p.name}</div>
            <div className="sticky-atc-price">{fmt(p.price)}</div>
          </div>
          <button className="sticky-atc-btn" onClick={handleAdd}>Add to Cart</button>
        </div>
      )}

      {related.length > 0 && (
        <div className="rel-sec">
          <div className="sec-hd"><h2>You May Also Like</h2><div className="divider"/></div>
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
            <div className="pgrid" style={{gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))"}}>
              {related.map((r, i) => (
                <ProductCard key={r.id} p={r} onOpen={onOpen} onAdd={() => onAdd(r)} delay={i * 80} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
