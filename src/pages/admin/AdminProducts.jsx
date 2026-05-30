import { useState, useEffect, useRef } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../../firebase/productService";
import { uploadProductImage, uploadProductVideo, deleteFileByUrl } from "../../firebase/storageService";
import { CATS } from "../../data/products";
import { fmt } from "../../utils/helpers";

const EMPTY = {
  id: Date.now(), name: "", category: "Pots", price: "", originalPrice: "",
  emoji: "🏺", description: "", stock: "", isNew: false,
  sizes: [], colors: [], features: [], specs: [], sg: [],
  images: [], video: "",
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size = "md" }) {
  return <span className={`spinner spinner-${size}`}/>;
}

// ── Dynamic string list ───────────────────────────────────────────────────────
function StringList({ label, items, onChange }) {
  const [input, setInput] = useState("");
  const add = () => { if (!input.trim()) return; onChange([...items, input.trim()]); setInput(""); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="admin-inp-grp">
      <label>{label}</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
        {items.map((item, i) => (
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:"#F4EDE5",padding:"4px 10px",borderRadius:20,fontSize:".82rem"}}>
            {item}
            <button type="button" onClick={() => remove(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#C0392B",fontWeight:700,padding:0,lineHeight:1}}>×</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={`Add ${label.toLowerCase()}…`}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          style={{flex:1,padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
        <button type="button" onClick={add} className="admin-btn admin-btn-outline admin-btn-sm">+ Add</button>
      </div>
    </div>
  );
}

// ── Color list ────────────────────────────────────────────────────────────────
function ColorList({ colors, onChange }) {
  const [name, setName] = useState("");
  const [hex, setHex]   = useState("#E8620A");
  const add = () => { if (!name.trim()) return; onChange([...colors, { name: name.trim(), hex }]); setName(""); setHex("#E8620A"); };
  const remove = (i) => onChange(colors.filter((_, idx) => idx !== i));
  return (
    <div className="admin-inp-grp">
      <label>Colors</label>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
        {colors.map((c, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#F4EDE5",padding:"6px 10px",borderRadius:8}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:c.hex,border:"2px solid #fff",boxShadow:"0 0 0 1px #E8D5C0"}}/>
            <span style={{flex:1,fontSize:".85rem"}}>{c.name}</span>
            <span style={{fontSize:".75rem",color:"#6B4C38"}}>{c.hex}</span>
            <button type="button" onClick={() => remove(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#C0392B",fontWeight:700}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Colour name…"
          style={{flex:1,padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
        <input type="color" value={hex} onChange={e => setHex(e.target.value)}
          style={{width:40,height:34,border:"1.5px solid #E8D5C0",borderRadius:7,cursor:"pointer",padding:2}}/>
        <button type="button" onClick={add} className="admin-btn admin-btn-outline admin-btn-sm">+ Add</button>
      </div>
    </div>
  );
}

// ── Specs list ────────────────────────────────────────────────────────────────
function SpecsList({ specs, onChange }) {
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  const add = () => { if (!k.trim() || !v.trim()) return; onChange([...specs, { key: k.trim(), val: v.trim() }]); setK(""); setV(""); };
  const remove = (i) => onChange(specs.filter((_, idx) => idx !== i));
  return (
    <div className="admin-inp-grp">
      <label>Specifications</label>
      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>
        {specs.map((s, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#F4EDE5",padding:"6px 10px",borderRadius:8,fontSize:".85rem"}}>
            <span style={{fontWeight:700,minWidth:100,color:"#2D1E12"}}>{s.key}</span>
            <span style={{flex:1,color:"#6B4C38"}}>{s.val}</span>
            <button type="button" onClick={() => remove(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#C0392B",fontWeight:700}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={k} onChange={e => setK(e.target.value)} placeholder="Field (e.g. Material)"
          style={{width:140,padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
        <input value={v} onChange={e => setV(e.target.value)} placeholder="Value (e.g. Clay)"
          style={{flex:1,padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none"}}/>
        <button type="button" onClick={add} className="admin-btn admin-btn-outline admin-btn-sm">+ Add</button>
      </div>
    </div>
  );
}

// ── Media uploader (photos) ───────────────────────────────────────────────────
function MediaUploader({ images, productId, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const inputRef = useRef();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    try {
      const total = files.length;
      let done = 0;
      const urls = await Promise.all(
        files.map(f =>
          uploadProductImage(f, productId, p => setProgress(Math.round((done * 100 + p) / total)))
            .then(url => { done++; return url; })
        )
      );
      onChange([...images, ...urls]);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (url, i) => {
    onChange(images.filter((_, idx) => idx !== i));
    deleteFileByUrl(url);
  };

  const moveFirst = (i) => {
    const next = [...images];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="admin-inp-grp">
      <label>Product Photos</label>

      {images.length > 0 && (
        <div className="media-grid">
          {images.map((url, i) => (
            <div key={url} className="media-thumb">
              <img src={url} alt={`photo-${i}`}/>
              <button className="media-thumb-del" onClick={() => remove(url, i)}>×</button>
              {i === 0
                ? <span className="media-thumb-badge">MAIN</span>
                : <button className="media-thumb-badge" style={{cursor:"pointer",background:"rgba(45,30,18,.75)"}}
                    onClick={() => moveFirst(i)}>SET MAIN</button>}
            </div>
          ))}
        </div>
      )}

      <div className="upload-zone" style={{pointerEvents: uploading ? "none" : "auto"}}>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles}/>
        {uploading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <Spinner size="md"/>
            <span style={{fontSize:".82rem",color:"#6B4C38"}}>Uploading… {progress}%</span>
            <div className="upload-prog" style={{width:"100%"}}>
              <div className="upload-prog-bar" style={{width:`${progress}%`}}/>
            </div>
          </div>
        ) : (
          <>
            <div style={{fontSize:"1.8rem",marginBottom:6}}>🖼️</div>
            <div style={{fontSize:".85rem",fontWeight:600,color:"#2D1E12"}}>Click or drag photos here</div>
            <div style={{fontSize:".75rem",color:"#6B4C38",marginTop:3}}>PNG, JPG, WebP · multiple allowed</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Video uploader ────────────────────────────────────────────────────────────
function VideoUploader({ video, productId, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadProductVideo(file, productId, setProgress);
      onChange(url);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    if (video) deleteFileByUrl(video);
    onChange("");
  };

  return (
    <div className="admin-inp-grp">
      <label>Product Video</label>

      {video && (
        <div className="video-preview-wrap">
          <video src={video} controls/>
          <button className="media-thumb-del" style={{position:"absolute",top:8,right:8}}
            onClick={removeVideo}>×</button>
        </div>
      )}

      <div className="upload-zone" style={{pointerEvents: uploading ? "none" : "auto"}}>
        <input ref={inputRef} type="file" accept="video/*" onChange={handleFile}/>
        {uploading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <Spinner size="md"/>
            <span style={{fontSize:".82rem",color:"#6B4C38"}}>Uploading video… {progress}%</span>
            <div className="upload-prog" style={{width:"100%"}}>
              <div className="upload-prog-bar" style={{width:`${progress}%`}}/>
            </div>
          </div>
        ) : (
          <>
            <div style={{fontSize:"1.8rem",marginBottom:6}}>🎬</div>
            <div style={{fontSize:".85rem",fontWeight:600,color:"#2D1E12"}}>
              {video ? "Replace video" : "Click or drag a video"}
            </div>
            <div style={{fontSize:".75rem",color:"#6B4C38",marginTop:3}}>MP4, MOV, WebM</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────────────────────
function ProductModal({ product, onSave, onClose }) {
  const [form, setForm]   = useState(product ? { ...product } : { ...EMPTY, id: Date.now() });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price || !form.originalPrice) { setError("Price fields are required."); return; }
    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, price: +form.price, originalPrice: +form.originalPrice, stock: +form.stock });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" style={{maxWidth:640}} onClick={e => e.stopPropagation()}>
        <h2>{product ? "Edit Product" : "Add Product"}</h2>

        <div className="admin-form-grid">
          <div className="admin-inp-grp">
            <label>Product Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Product name"/>
          </div>
          <div className="admin-inp-grp">
            <label>Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}>
              {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-inp-grp">
            <label>Selling Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="1299"/>
          </div>
          <div className="admin-inp-grp">
            <label>Original / MRP (₹) *</label>
            <input type="number" value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} placeholder="1800"/>
          </div>
          <div className="admin-inp-grp">
            <label>Emoji (fallback)</label>
            <input value={form.emoji} onChange={e => set("emoji", e.target.value)} placeholder="🏺"/>
          </div>
          <div className="admin-inp-grp">
            <label>Stock Quantity</label>
            <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0"/>
          </div>
        </div>

        <div className="admin-inp-grp">
          <label>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Product description…"/>
        </div>

        <div className="admin-inp-grp" style={{display:"flex",alignItems:"center",gap:10}}>
          <input type="checkbox" id="isnew" checked={!!form.isNew} onChange={e => set("isNew", e.target.checked)}/>
          <label htmlFor="isnew" style={{textTransform:"none",letterSpacing:0,margin:0,fontSize:".88rem"}}>Mark as New Arrival</label>
        </div>

        <MediaUploader images={form.images || []} productId={form.id} onChange={v => set("images", v)}/>
        <VideoUploader video={form.video || ""} productId={form.id} onChange={v => set("video", v)}/>

        <StringList label="Sizes" items={form.sizes || []} onChange={v => set("sizes", v)}/>
        <ColorList colors={form.colors || []} onChange={v => set("colors", v)}/>
        <StringList label="Features" items={form.features || []} onChange={v => set("features", v)}/>
        <SpecsList specs={form.specs || []} onChange={v => set("specs", v)}/>

        {error && <p style={{color:"#C0392B",fontSize:".85rem",marginBottom:10}}>{error}</p>}

        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}
            style={{display:"flex",alignItems:"center",gap:8}}>
            {saving && <Spinner size="sm"/>}
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline stock edit cell ────────────────────────────────────────────────────
function StockCell({ docId, stock, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(stock));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) { setVal(String(stock)); setEditing(false); return; }
    setSaving(true);
    await updateProduct(docId, { stock: n });
    onUpdate(n);
    setSaving(false);
    setEditing(false);
  };

  if (editing) return (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <input type="number" value={val} onChange={e => setVal(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key==="Enter") save(); if (e.key==="Escape") { setEditing(false); setVal(String(stock)); }}}
        style={{ width:58, padding:"3px 7px", border:"1.5px solid var(--sf)", borderRadius:6, fontSize:".85rem", fontFamily:"DM Sans,sans-serif", outline:"none" }}/>
      <button onClick={save} disabled={saving}
        style={{ background:"var(--sf)", color:"#fff", border:"none", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:".8rem", minWidth:26 }}>
        {saving ? "…" : "✓"}
      </button>
      <button onClick={() => { setEditing(false); setVal(String(stock)); }}
        style={{ background:"none", border:"none", cursor:"pointer", color:"#9B8472", fontSize:".9rem", padding:"2px 4px" }}>
        ✕
      </button>
    </div>
  );

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}
      onClick={() => { setEditing(true); setVal(String(stock)); }} title="Click to update stock">
      <span style={{ color: stock <= 5 ? "#C0392B" : "#2D7D46", fontWeight:700 }}>{stock}</span>
      {stock <= 5 && <span style={{ fontSize:".62rem", background:"#FDECEA", color:"#C0392B", padding:"1px 5px", borderRadius:4, fontWeight:700 }}>LOW</span>}
      {stock === 0 && <span style={{ fontSize:".62rem", background:"#E8D5C0", color:"#6B4C38", padding:"1px 5px", borderRadius:4, fontWeight:700 }}>OUT</span>}
      <span style={{ fontSize:".65rem", color:"#C4B49A" }}>✏</span>
    </div>
  );
}

// ── Main AdminProducts ────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const load = () => getProducts().then(p => { setProducts(p); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (modal === "add") {
      await addProduct(form);
    } else {
      const { docId, ...data } = form;
      await updateProduct(docId, data);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    await deleteProduct(docId);
    load();
  };

  const filtered = products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="admin-loading">
      <Spinner size="lg"/>
      <span>Loading products…</span>
    </div>
  );

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Products ({products.length})</h3>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
            <select className="status-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              {["All","Pots","Clocks","Curtains","Bed Sheets","Home Decor"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="admin-search" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}/>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal("add")}>+ Add Product</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>🏺</span><p>No products found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th></th><th>Name</th><th>Category</th><th>Price / MRP</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.docId}>
                  <td className="emoji-cell">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" style={{width:44,height:44,objectFit:"cover",borderRadius:8}}/>
                      : p.emoji}
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.isNew && <span className="badge badge-shipped" style={{marginLeft:8}}>NEW</span>}
                    {p.video && <span style={{marginLeft:6,fontSize:".7rem",color:"#6B4C38"}}>🎬</span>}
                    {p.images?.length > 0 && <span style={{marginLeft:4,fontSize:".7rem",color:"#6B4C38"}}>🖼️×{p.images.length}</span>}
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <strong>{fmt(p.price)}</strong>
                    <span style={{fontSize:".75rem",color:"#6B4C38",textDecoration:"line-through",marginLeft:6}}>{fmt(p.originalPrice)}</span>
                  </td>
                  <td>
                    <StockCell docId={p.docId} stock={p.stock}
                      onUpdate={(n) => setProducts(prev => prev.map(pr => pr.docId === p.docId ? { ...pr, stock: n } : pr))}/>
                  </td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <button className="admin-btn-icon" title="Edit" onClick={() => setModal(p)}>✏️</button>
                      <button className="admin-btn-icon" title="Delete" style={{borderColor:"#C0392B"}} onClick={() => handleDelete(p.docId)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
