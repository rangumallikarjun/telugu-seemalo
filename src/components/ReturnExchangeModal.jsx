import { useState } from "react";
import { createReturnRequest } from "../firebase/returnService";
import { updateOrderReturnStatus } from "../firebase/orderService";
import { notifyReturnRequested } from "../firebase/notificationService";
import { generateOtp, sendOtp } from "../firebase/otpService";
import OtpVerifyModal from "./OtpVerifyModal";

const REASONS_RETURN = [
  "Damaged / defective item",
  "Wrong item received",
  "Item not as described",
  "Changed my mind",
  "Other",
];

const REASONS_EXCHANGE = [
  "Wrong size ordered",
  "Want a different colour",
  "Damaged / defective — want replacement",
  "Other",
];

export default function ReturnExchangeModal({ order, user, onClose, onSubmitted }) {
  const [type, setType]         = useState("Return");
  const [items, setItems]       = useState(
    (order.items || []).map((it, i) => ({ ...it, idx: i, selected: false, qty: 1 }))
  );
  const [reason, setReason]     = useState("");
  const [notes, setNotes]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const [otpStep, setOtpStep]   = useState(false);
  const [pendingOtp, setPendingOtp] = useState("");

  const toggleItem = (idx) =>
    setItems(prev => prev.map(it => it.idx === idx ? { ...it, selected: !it.selected } : it));

  const changeQty = (idx, val) =>
    setItems(prev => prev.map(it => it.idx === idx ? { ...it, qty: Math.max(1, Math.min(it.qty, val)) } : it));

  const selectedItems = items.filter(it => it.selected);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) { setError("Please select at least one item."); return; }
    if (!reason) { setError("Please select a reason."); return; }
    setError("");
    setSubmitting(true);
    try {
      const code = generateOtp();
      await sendOtp(user.email, code, `${type} Request`);
      setPendingOtp(code);
      setOtpStep(true);
    } catch (e) {
      setError(e.message || "Failed to send verification email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const doSubmit = async () => {
    const requestData = {
      orderId:    order.id,
      orderDocId: order.docId,
      userId:     user.uid,
      userEmail:  user.email,
      userName:   user.name || user.email,
      type,
      reason,
      notes: notes.trim(),
      items: selectedItems.map(it => ({
        name:     it.name,
        emoji:    it.emoji || "",
        price:    it.price,
        qty:      it.qty,
        selSize:  it.selSize  || "",
        selColor: it.selColor || "",
      })),
    };
    await createReturnRequest(requestData);
    await updateOrderReturnStatus(order.docId, "Pending", type);
    notifyReturnRequested(requestData);
    onSubmitted?.();
    onClose();
  };

  const handleOtpVerify = async (entered) => {
    if (entered !== pendingOtp) throw new Error("Invalid OTP. Please try again.");
    await doSubmit();
  };

  const handleOtpResend = async () => {
    const code = generateOtp();
    await sendOtp(user.email, code, `${type} Request`);
    setPendingOtp(code);
  };

  return (
    <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
        onClick={e => e.target === e.currentTarget && !otpStep && onClose()}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.18)"}}>
          {/* Header */}
          <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0E8DF",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.5rem",fontWeight:700,marginBottom:4}}>Return / Exchange</h2>
              <p style={{fontSize:".82rem",color:"#6B4C38"}}>Order {order.id}</p>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#6B4C38",lineHeight:1,padding:4}}>✕</button>
          </div>

          <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:20}}>
            {/* Type toggle */}
            <div>
              <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Request Type</div>
              <div style={{display:"flex",gap:8}}>
                {["Return","Exchange"].map(t => (
                  <button key={t} onClick={() => { setType(t); setReason(""); }}
                    style={{flex:1,padding:"10px 0",border:`2px solid ${type===t ? "#E8620A" : "#E8D5C0"}`,borderRadius:10,background:type===t ? "#FFF3ED" : "#fff",
                      color:type===t ? "#E8620A" : "#6B4C38",fontWeight:700,fontSize:".9rem",cursor:"pointer",transition:"all .15s",fontFamily:"DM Sans,sans-serif"}}>
                    {t === "Return" ? "↩ Return" : "🔄 Exchange"}
                  </button>
                ))}
              </div>
            </div>

            {/* Item selection */}
            <div>
              <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Select Items</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {items.map(it => (
                  <label key={it.idx} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",border:`1.5px solid ${it.selected ? "#E8620A" : "#E8D5C0"}`,borderRadius:10,cursor:"pointer",background:it.selected ? "#FFF3ED" : "#fff",transition:"all .15s"}}>
                    <input type="checkbox" checked={it.selected} onChange={() => toggleItem(it.idx)} style={{accentColor:"#E8620A",width:16,height:16,cursor:"pointer"}}/>
                    <span style={{fontSize:"1.4rem"}}>{it.emoji || "🏺"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:".88rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.name}</div>
                      {(it.selSize || it.selColor) && (
                        <div style={{fontSize:".74rem",color:"#6B4C38"}}>{[it.selSize,it.selColor].filter(Boolean).join(" · ")}</div>
                      )}
                    </div>
                    {it.selected && (
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                        <button onClick={e=>{e.preventDefault();changeQty(it.idx, it.qty-1);}} style={{width:24,height:24,borderRadius:6,border:"1px solid #E8D5C0",background:"#fff",cursor:"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <span style={{fontSize:".85rem",fontWeight:700,minWidth:16,textAlign:"center"}}>{it.qty}</span>
                        <button onClick={e=>{e.preventDefault();changeQty(it.idx, it.qty+1);}} style={{width:24,height:24,borderRadius:6,border:"1px solid #E8D5C0",background:"#fff",cursor:"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Reason</div>
              <select value={reason} onChange={e => setReason(e.target.value)}
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E8D5C0",borderRadius:9,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",color: reason ? "#18100A" : "#9B8472",background:"#fff"}}>
                <option value="">— Select a reason —</option>
                {(type === "Return" ? REASONS_RETURN : REASONS_EXCHANGE).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Additional notes */}
            <div>
              <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:8}}>Additional Notes <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Describe the issue or your exchange preference…"
                style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E8D5C0",borderRadius:9,fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            </div>

            {error && <div style={{background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"10px 14px",fontSize:".84rem"}}>{error}</div>}

            {/* Submit */}
            <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{flex:1,padding:"11px 0",border:"1.5px solid #E8D5C0",borderRadius:10,background:"#fff",color:"#6B4C38",fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:".9rem"}}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{flex:2,padding:"11px 0",border:"none",borderRadius:10,background: submitting ? "#ccc" : "#E8620A",color:"#fff",fontWeight:700,cursor: submitting ? "not-allowed" : "pointer",fontFamily:"DM Sans,sans-serif",fontSize:".9rem",transition:"background .15s"}}>
                {submitting ? "Sending OTP…" : `Submit ${type} Request`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {otpStep && (
        <OtpVerifyModal
          email={user.email}
          purpose={`${type} Request`}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onClose={() => setOtpStep(false)}
        />
      )}
    </>
  );
}
