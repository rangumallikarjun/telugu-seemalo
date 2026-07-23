import { useState, useEffect } from "react";
import { getReturnByOrderDocId } from "../firebase/returnService";
import { fmt, NoImageIcon } from "../utils/helpers";

const STEP_COLOR = {
  done:     { bg:"#E8620A", border:"#E8620A", text:"#fff" },
  active:   { bg:"#FFF3ED", border:"#E8620A", text:"#E8620A" },
  rejected: { bg:"#FDECEA", border:"#C0392B", text:"#C0392B" },
  pending:  { bg:"#F8F4F0", border:"#D1C5BB", text:"#9B8472" },
};

function Step({ icon, label, desc, note, date, state }) {
  const c = STEP_COLOR[state] || STEP_COLOR.pending;
  return (
    <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:c.bg,border:`2px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem",color:c.text,fontWeight:700,transition:"all .3s"}}>
          {icon}
        </div>
      </div>
      <div style={{flex:1,paddingBottom:24}}>
        <div style={{fontWeight:700,fontSize:".9rem",color: state === "pending" ? "#9B8472" : "#18100A"}}>{label}</div>
        <div style={{fontSize:".78rem",color:"#6B4C38",marginTop:2}}>{desc}</div>
        {note && <div style={{marginTop:6,background:"#F8F4F0",borderRadius:7,padding:"7px 10px",fontSize:".78rem",color:"#6B4C38",fontStyle:"italic"}}>"{note}"</div>}
        {date && <div style={{fontSize:".73rem",color:"#9B8472",marginTop:4}}>{date}</div>}
      </div>
    </div>
  );
}

function Line({ active }) {
  return (
    <div style={{width:2,height:24,background: active ? "#E8620A" : "#E8D5C0",marginLeft:17,marginTop:-18,marginBottom:-6,transition:"background .3s"}}/>
  );
}

export default function ReturnTrackingModal({ order, onClose }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReturnByOrderDocId(order.docId)
      .then(r => { setRequest(r); setLoading(false); });
  }, [order.docId]);

  const fmtDate = (ts) =>
    ts?.toDate?.()?.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) ?? null;

  const status   = request?.status || order.returnStatus || "Pending";
  const type     = request?.type   || order.returnType   || "Return";
  const isDone   = (s) => ["Approved","Rejected","Completed"].includes(s);
  const isRejected = status === "Rejected";
  const isCompleted = status === "Completed";

  const steps = [
    {
      icon: "📋",
      label: `${type} Request Submitted`,
      desc: "Your request has been received and logged.",
      date: fmtDate(request?.requestedAt),
      state: "done",
    },
    {
      icon: "🔍",
      label: "Under Review",
      desc: "Our team is reviewing your request.",
      state: isDone(status) ? "done" : "active",
    },
    {
      icon: isRejected ? "✕" : "✓",
      label: isRejected
        ? "Request Rejected"
        : status === "Approved" || isCompleted
        ? `${type} Approved`
        : `Awaiting Decision`,
      desc: isRejected
        ? "We were unable to process this request."
        : status === "Approved" || isCompleted
        ? `Your ${type.toLowerCase()} request has been approved.`
        : "Waiting for admin decision.",
      note: (isRejected || isDone(status)) && request?.adminNotes ? request.adminNotes : null,
      date: (isRejected || isDone(status)) ? fmtDate(request?.resolvedAt) : null,
      state: isRejected ? "rejected" : isDone(status) ? "done" : "pending",
    },
    {
      icon: type === "Exchange" ? "📦" : "💰",
      label: type === "Exchange" ? "Replacement Dispatched" : "Refund Processed",
      desc: type === "Exchange"
        ? "The replacement item has been dispatched to you."
        : "Your refund has been processed.",
      date: isCompleted ? fmtDate(request?.resolvedAt) : null,
      state: isCompleted ? "done" : isRejected ? "pending" : "pending",
    },
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.18)"}}>

        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #F0E8DF",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:"1.2rem"}}>{type === "Exchange" ? "🔄" : "↩"}</span>
              <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.4rem",fontWeight:700}}>{type} Tracking</h2>
            </div>
            <p style={{fontSize:".82rem",color:"#6B4C38"}}>Order {order.id}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#6B4C38"}}>✕</button>
        </div>

        <div style={{padding:"20px 24px"}}>
          {loading ? (
            <div style={{textAlign:"center",padding:"32px",color:"#6B4C38"}}>
              <span className="spinner spinner-md"/> Loading…
            </div>
          ) : !request ? (
            <div style={{textAlign:"center",padding:"32px",color:"#9B8472"}}>No request found for this order.</div>
          ) : (
            <>
              {/* Items */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:".73rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:10}}>Items in Request</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(request.items || []).map((it, i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#F8F4F0",borderRadius:9}}>
                      <div style={{width:28,height:28,borderRadius:6,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#F4EDE5",flexShrink:0}}>
                        {it.images?.[0] ? <img src={it.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <NoImageIcon size="60%"/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:".85rem"}}>{it.name}</div>
                        {(it.selSize || it.selColor) && <div style={{fontSize:".73rem",color:"#6B4C38"}}>{[it.selSize,it.selColor].filter(Boolean).join(" · ")}</div>}
                      </div>
                      <span style={{fontSize:".82rem",fontWeight:700}}>×{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div style={{background:"#FFF3ED",borderRadius:9,padding:"10px 14px",fontSize:".83rem",color:"#6B4C38",marginBottom:24}}>
                <strong style={{color:"#18100A"}}>Reason: </strong>{request.reason}
                {request.notes && <div style={{marginTop:4}}><strong style={{color:"#18100A"}}>Notes: </strong>{request.notes}</div>}
              </div>

              {/* Timeline */}
              <div style={{fontSize:".73rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#6B4C38",marginBottom:14}}>Timeline</div>
              <div>
                {steps.map((s, i) => (
                  <div key={i}>
                    <Step {...s}/>
                    {i < steps.length - 1 && <Line active={s.state === "done"}/>}
                  </div>
                ))}
              </div>

              {/* Current status pill */}
              <div style={{marginTop:8,textAlign:"center"}}>
                {(() => {
                  const colors = {
                    Pending:   "#B7770D", Approved: "#2D7D46",
                    Rejected:  "#C0392B", Completed:"#1A5276",
                  };
                  const bgs = {
                    Pending:   "#FFF3DC", Approved: "#E8F5EC",
                    Rejected:  "#FDECEA", Completed:"#EAF2FF",
                  };
                  return (
                    <span style={{display:"inline-block",padding:"6px 20px",borderRadius:20,background:bgs[status]||"#F8F4F0",color:colors[status]||"#6B4C38",fontWeight:700,fontSize:".82rem"}}>
                      Current Status: {status}
                    </span>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
