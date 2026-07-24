import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadAboutImage } from "../../firebase/storageService";
import { useCropUpload } from "../../hooks/useCropUpload";
import ImageCropModal from "../../components/ImageCropModal";
import { DEFAULT_ABOUT } from "../AboutPage";

function SectionLabel({ children }) {
  return (
    <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#6B4C38",marginBottom:14,marginTop:20,borderBottom:"1px solid #F0E8DF",paddingBottom:6}}>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{background:"none",border:"1.5px dashed var(--bd)",borderRadius:8,padding:"9px 20px",
        cursor:"pointer",color:"#6B4C38",fontWeight:600,fontSize:".85rem",
        fontFamily:"DM Sans,sans-serif",width:"100%",marginBottom:16,transition:"all .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#E8620A";e.currentTarget.style.color="#E8620A";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--bd)";e.currentTarget.style.color="#6B4C38";}}>
      {label}
    </button>
  );
}

function RemoveButton({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{background:"none",border:"1.5px solid #E8D5C0",borderRadius:8,color:"#C0392B",
        cursor: disabled ? "not-allowed" : "pointer",padding:"7px 12px",fontWeight:700,fontSize:".8rem",
        opacity: disabled ? .5 : 1,flexShrink:0,alignSelf:"flex-start"}}>
      ✕
    </button>
  );
}

export default function AdminAbout() {
  const [a, setA]       = useState(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);
  const imgCrop = useCropUpload(uploadAboutImage, 1);

  const load = () => {
    setLoading(true);
    getDoc(doc(db, "settings", "aboutPage"))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setA({
            ...DEFAULT_ABOUT, ...data,
            storyParagraphs: data.storyParagraphs?.length ? data.storyParagraphs : DEFAULT_ABOUT.storyParagraphs,
            storyFeatures:   data.storyFeatures?.length   ? data.storyFeatures   : DEFAULT_ABOUT.storyFeatures,
            whyItems:        data.whyItems?.length        ? data.whyItems        : DEFAULT_ABOUT.whyItems,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setA(f => ({ ...f, [k]: v }));

  const uploadImage = (file) => {
    imgCrop.open([file], (urls) => { if (urls[0]) set("storyImage", urls[0]); });
  };

  // Paragraphs
  const paraSet    = (i, v) => setA(f => ({ ...f, storyParagraphs: f.storyParagraphs.map((x, j) => j === i ? v : x) }));
  const paraAdd     = () => setA(f => ({ ...f, storyParagraphs: [...f.storyParagraphs, "New paragraph…"] }));
  const paraRemove  = (i) => setA(f => f.storyParagraphs.length <= 1 ? f : ({ ...f, storyParagraphs: f.storyParagraphs.filter((_, j) => j !== i) }));

  // Story features (icon + text)
  const featSet    = (i, k, v) => setA(f => ({ ...f, storyFeatures: f.storyFeatures.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const featAdd     = () => setA(f => ({ ...f, storyFeatures: [...f.storyFeatures, { icon: "✦", text: "New feature" }] }));
  const featRemove  = (i) => setA(f => f.storyFeatures.length <= 1 ? f : ({ ...f, storyFeatures: f.storyFeatures.filter((_, j) => j !== i) }));

  // Why items (icon + title + desc)
  const whySet    = (i, k, v) => setA(f => ({ ...f, whyItems: f.whyItems.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const whyAdd     = () => setA(f => ({ ...f, whyItems: [...f.whyItems, { icon: "✦", title: "New Reason", desc: "" }] }));
  const whyRemove  = (i) => setA(f => f.whyItems.length <= 1 ? f : ({ ...f, whyItems: f.whyItems.filter((_, j) => j !== i) }));

  const handleSave = async () => {
    if (!window.confirm("Save changes to the About page? This will update the live site.")) return;
    await setDoc(doc(db, "settings", "aboutPage"), a);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="admin-loading">Loading About page…</div>;

  return (
    <div className="admin-content">
      <div className="admin-card" style={{maxWidth:900,marginBottom:20}}>
        <div className="admin-card-hd">
          <h3>About Page</h3>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:".78rem",color:"#6B4C38",fontWeight:500}}>Public page: /about</span>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={load}>↺ Refresh</button>
          </div>
        </div>

        <div style={{padding:"8px 0 20px"}}>
          <SectionLabel>Hero</SectionLabel>
          <div className="admin-form-grid">
            <div className="admin-inp-grp">
              <label>Hero Title</label>
              <input value={a.heroTitle} onChange={e => set("heroTitle", e.target.value)}/>
            </div>
            <div className="admin-inp-grp">
              <label>Hero Subtitle</label>
              <input value={a.heroSubtitle} onChange={e => set("heroSubtitle", e.target.value)}/>
            </div>
          </div>

          <SectionLabel>The Story Section</SectionLabel>
          <div style={{display:"flex",gap:14,marginBottom:14,alignItems:"flex-start"}}>
            <div style={{flexShrink:0,width:100}}>
              <div style={{width:100,height:100,borderRadius:8,border:"1.5px solid #E8D5C0",background:"#FCEFE2",
                display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:6,fontSize:"2.4rem"}}>
                {a.storyImage
                  ? <img src={a.storyImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : a.storyEmoji}
              </div>
              <input type="file" accept="image/*" id="about-story-img" style={{display:"none"}}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}/>
              <button className="admin-btn admin-btn-outline admin-btn-sm" style={{width:"100%",marginBottom:4}}
                onClick={() => document.getElementById("about-story-img").click()}>
                Upload
              </button>
              {a.storyImage && (
                <button className="admin-btn admin-btn-outline admin-btn-sm" style={{width:"100%",color:"#C0392B"}}
                  onClick={() => set("storyImage", "")}>
                  Use Emoji
                </button>
              )}
            </div>
            <div style={{flex:1,display:"grid",gap:14}}>
              <div className="admin-inp-grp" style={{margin:0}}>
                <label>Heading</label>
                <input value={a.storyHeading} onChange={e => set("storyHeading", e.target.value)}/>
              </div>
              <div className="admin-inp-grp" style={{margin:0}}>
                <label>Emoji (used if no image)</label>
                <input value={a.storyEmoji} onChange={e => set("storyEmoji", e.target.value)} style={{width:100}}/>
              </div>
            </div>
          </div>

          <div className="admin-inp-grp">
            <label>Paragraphs</label>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
              {a.storyParagraphs.map((p, i) => (
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <textarea rows={2} value={p} onChange={e => paraSet(i, e.target.value)}
                    style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--bd)",borderRadius:8,
                      fontFamily:"DM Sans,sans-serif",fontSize:".85rem",resize:"vertical"}}/>
                  <RemoveButton onClick={() => paraRemove(i)} disabled={a.storyParagraphs.length <= 1}/>
                </div>
              ))}
            </div>
            <AddButton onClick={paraAdd} label="+ Add Paragraph"/>
          </div>

          <div className="admin-inp-grp">
            <label>Feature Bullets</label>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              {a.storyFeatures.map((f, i) => (
                <div key={i} style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={f.icon} onChange={e => featSet(i, "icon", e.target.value)} placeholder="🏅"
                    style={{width:52,padding:"7px 8px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:"1rem",textAlign:"center"}}/>
                  <input value={f.text} onChange={e => featSet(i, "text", e.target.value)} placeholder="Feature text"
                    style={{flex:1,padding:"7px 10px",border:"1.5px solid #E8D5C0",borderRadius:7,fontSize:".88rem",fontFamily:"DM Sans,sans-serif"}}/>
                  <RemoveButton onClick={() => featRemove(i)} disabled={a.storyFeatures.length <= 1}/>
                </div>
              ))}
            </div>
            <AddButton onClick={featAdd} label="+ Add Feature"/>
          </div>

          <SectionLabel>"Why Us" Section</SectionLabel>
          <div className="admin-inp-grp">
            <label>Section Heading</label>
            <input value={a.whyHeading} onChange={e => set("whyHeading", e.target.value)}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
            {a.whyItems.map((item, i) => (
              <div key={i} style={{border:"1.5px solid #E8D5C0",borderRadius:12,padding:16,background:"#FFFCF7"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span style={{fontWeight:700,color:"#18100A"}}>Card {i + 1}</span>
                  <RemoveButton onClick={() => whyRemove(i)} disabled={a.whyItems.length <= 1}/>
                </div>
                <div className="admin-form-grid" style={{gridTemplateColumns:"80px 1fr"}}>
                  <div className="admin-inp-grp">
                    <label>Icon</label>
                    <input value={item.icon} onChange={e => whySet(i, "icon", e.target.value)} style={{textAlign:"center"}}/>
                  </div>
                  <div className="admin-inp-grp">
                    <label>Title</label>
                    <input value={item.title} onChange={e => whySet(i, "title", e.target.value)}/>
                  </div>
                </div>
                <div className="admin-inp-grp" style={{marginBottom:0}}>
                  <label>Description</label>
                  <textarea rows={2} value={item.desc} onChange={e => whySet(i, "desc", e.target.value)}/>
                </div>
              </div>
            ))}
          </div>
          <AddButton onClick={whyAdd} label="+ Add Card"/>

          <SectionLabel>Call to Action</SectionLabel>
          <div className="admin-inp-grp">
            <label>Button Label</label>
            <input value={a.ctaLabel} onChange={e => set("ctaLabel", e.target.value)} style={{maxWidth:320}}/>
          </div>

          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>Save About Page</button>
            {saved && <span style={{color:"#2D7D46",fontSize:".88rem",fontWeight:600}}>✓ Saved!</span>}
          </div>
        </div>
      </div>

      {imgCrop.cropProps && <ImageCropModal {...imgCrop.cropProps} />}
    </div>
  );
}
