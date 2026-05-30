import { useState, useEffect } from "react";
import { getCoupons, addCoupon, updateCoupon, deleteCoupon, toggleCoupon } from "../../firebase/couponService";
import { fmt } from "../../utils/helpers";

const EMPTY = {
  code: "", type: "percent", value: "", minOrder: "",
  maxUses: "", maxDiscount: "", expiresAt: "", isActive: true,
  description: "", showToCustomers: false,
};

function CouponModal({ coupon, onSave, onClose }) {
  const [form, setForm] = useState(coupon ? { ...coupon, expiresAt: coupon.expiresAt?.toDate ? coupon.expiresAt.toDate().toISOString().slice(0,10) : coupon.expiresAt || "" } : { ...EMPTY });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.code.trim()) { setError("Coupon code is required."); return; }
    if (!form.value) { setError("Discount value is required."); return; }
    setError("");
    setSaving(true);
    const data = {
      code:        form.code.trim().toUpperCase(),
      type:        form.type,
      value:       +form.value,
      minOrder:    form.minOrder    ? +form.minOrder    : 0,
      maxUses:     form.maxUses     ? +form.maxUses     : null,
      maxDiscount: form.maxDiscount ? +form.maxDiscount : null,
      expiresAt:   form.expiresAt   ? new Date(form.expiresAt) : null,
      isActive:    form.isActive,
      description:      form.description || "",
      showToCustomers:  !!form.showToCustomers,
    };
    await onSave(data);
    setSaving(false);
  };

  return (
    <div className="admin-modal-bg" onClick={onClose}>
      <div className="admin-modal" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
        <h2>{coupon ? "Edit Coupon" : "Create Coupon"}</h2>

        <div className="admin-form-grid">
          <div className="admin-inp-grp">
            <label>Coupon Code *</label>
            <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10" style={{textTransform:"uppercase",letterSpacing:".08em",fontWeight:700}}/>
          </div>
          <div className="admin-inp-grp">
            <label>Discount Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div className="admin-inp-grp">
            <label>{form.type === "percent" ? "Discount %" : "Discount Amount (₹)"} *</label>
            <input type="number" value={form.value} onChange={e => set("value", e.target.value)}
              placeholder={form.type === "percent" ? "10" : "100"}
              min={1} max={form.type === "percent" ? 100 : undefined}/>
          </div>
          {form.type === "percent" && (
            <div className="admin-inp-grp">
              <label>Max Discount Cap (₹)</label>
              <input type="number" value={form.maxDiscount} onChange={e => set("maxDiscount", e.target.value)}
                placeholder="e.g. 500 (optional)"/>
            </div>
          )}
          <div className="admin-inp-grp">
            <label>Minimum Order Value (₹)</label>
            <input type="number" value={form.minOrder} onChange={e => set("minOrder", e.target.value)}
              placeholder="0 = no minimum"/>
          </div>
          <div className="admin-inp-grp">
            <label>Max Uses</label>
            <input type="number" value={form.maxUses} onChange={e => set("maxUses", e.target.value)}
              placeholder="Leave blank = unlimited"/>
          </div>
          <div className="admin-inp-grp">
            <label>Expiry Date</label>
            <input type="date" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)}/>
          </div>
        </div>

        <div className="admin-inp-grp">
          <label>Description (internal note)</label>
          <input value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="e.g. New customer welcome discount"/>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:6}}>
          <div className="admin-inp-grp" style={{display:"flex",alignItems:"center",gap:10,margin:0}}>
            <input type="checkbox" id="isActive" checked={!!form.isActive} onChange={e => set("isActive", e.target.checked)}/>
            <label htmlFor="isActive" style={{textTransform:"none",letterSpacing:0,margin:0,fontSize:".88rem"}}>Active (coupon can be used)</label>
          </div>
          <div className="admin-inp-grp" style={{display:"flex",alignItems:"center",gap:10,margin:0}}>
            <input type="checkbox" id="showToCustomers" checked={!!form.showToCustomers} onChange={e => set("showToCustomers", e.target.checked)}/>
            <label htmlFor="showToCustomers" style={{textTransform:"none",letterSpacing:0,margin:0,fontSize:".88rem"}}>
              Show to customers at checkout
              <span style={{marginLeft:6,fontSize:".76rem",color:"#6B4C38",fontWeight:400}}>(listed under "View available coupons")</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div style={{background:"#F4EDE5",borderRadius:8,padding:"10px 14px",fontSize:".82rem",color:"#6B4C38",marginBottom:14}}>
          <strong style={{color:"#18100A"}}>Preview: </strong>
          {form.code || "CODE"} gives{" "}
          {form.type === "percent"
            ? `${form.value || 0}% off${form.maxDiscount ? ` (max ₹${form.maxDiscount})` : ""}`
            : `₹${form.value || 0} off`}
          {form.minOrder ? ` on orders above ₹${form.minOrder}` : ""}
          {form.maxUses   ? ` · ${form.maxUses} uses` : " · unlimited uses"}
          {form.expiresAt ? ` · expires ${new Date(form.expiresAt).toLocaleDateString("en-IN")}` : ""}
        </div>

        {error && <p style={{color:"#C0392B",fontSize:".85rem",marginBottom:10}}>{error}</p>}

        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {coupon ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [search, setSearch]   = useState("");

  const load = () => getCoupons().then(c => { setCoupons(c); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    if (modal === "add") await addCoupon(data);
    else { const { docId, ...rest } = { ...modal, ...data }; await updateCoupon(modal.docId, rest); }
    setModal(null);
    load();
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this coupon?")) return;
    await deleteCoupon(docId);
    load();
  };

  const handleToggle = async (docId, current) => {
    await toggleCoupon(docId, !current);
    setCoupons(prev => prev.map(c => c.docId === docId ? { ...c, isActive: !current } : c));
  };

  const filtered = coupons.filter(c =>
    !search || c.code?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (c) => c.expiresAt && (c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt)) < new Date();

  if (loading) return <div className="admin-loading">Loading coupons…</div>;

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-hd">
          <h3>Coupons ({coupons.length})</h3>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
            <input className="admin-search" placeholder="Search coupons…" value={search} onChange={e => setSearch(e.target.value)}/>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal("add")}>+ Create Coupon</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><span>🎟️</span><p>No coupons yet. Create your first one!</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Conditions</th><th>Uses</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const expired = isExpired(c);
                const expiryDate = c.expiresAt
                  ? (c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt)).toLocaleDateString("en-IN")
                  : "—";
                return (
                  <tr key={c.docId}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontFamily:"monospace",fontWeight:800,fontSize:".95rem",letterSpacing:".06em",color:"#18100A"}}>{c.code}</span>
                        {c.showToCustomers && (
                          <span title="Shown to customers at checkout" style={{fontSize:".68rem",fontWeight:700,padding:"2px 7px",borderRadius:8,background:"#EAF2FF",color:"#1A5276"}}>👁 Public</span>
                        )}
                      </div>
                      {c.description && <div style={{fontSize:".75rem",color:"#6B4C38",marginTop:2}}>{c.description}</div>}
                    </td>
                    <td>
                      <span style={{fontWeight:700,color:"#E8620A"}}>
                        {c.type === "percent" ? `${c.value}%` : fmt(c.value)} off
                      </span>
                      {c.maxDiscount && <div style={{fontSize:".74rem",color:"#6B4C38"}}>max {fmt(c.maxDiscount)}</div>}
                    </td>
                    <td style={{fontSize:".82rem",color:"#6B4C38"}}>
                      {c.minOrder > 0 ? <div>Min order: {fmt(c.minOrder)}</div> : <div>No min order</div>}
                    </td>
                    <td>
                      <span style={{fontWeight:700}}>{c.usedCount || 0}</span>
                      <span style={{color:"#6B4C38",fontSize:".82rem"}}> / {c.maxUses || "∞"}</span>
                    </td>
                    <td style={{fontSize:".82rem",color: expired ? "#C0392B" : "#6B4C38"}}>
                      {expired ? `⚠ ${expiryDate}` : expiryDate}
                    </td>
                    <td>
                      {expired ? (
                        <span className="badge" style={{background:"#FDECEA",color:"#C0392B"}}>Expired</span>
                      ) : (
                        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                          onClick={() => handleToggle(c.docId, c.isActive)}>
                          <div style={{width:36,height:20,borderRadius:10,background: c.isActive ? "#E8620A" : "#D1C5BB",position:"relative",transition:"background .2s"}}>
                            <div style={{position:"absolute",top:2,left: c.isActive ? 18 : 2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                          </div>
                          <span style={{fontSize:".78rem",fontWeight:600,color: c.isActive ? "#2D7D46" : "#6B4C38"}}>
                            {c.isActive ? "Active" : "Off"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button className="admin-btn-icon" title="Edit" onClick={() => setModal(c)}>✏️</button>
                        <button className="admin-btn-icon" title="Delete" style={{borderColor:"#C0392B"}} onClick={() => handleDelete(c.docId)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <CouponModal
          coupon={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
