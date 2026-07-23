import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";

const ASPECTS = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
  { label: "9:16", value: 9 / 16 },
];

export default function ImageCropModal({ imageSrc, aspectDefault = null, onCancel, onCropped, remaining = 0 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState(aspectDefault === null ? "Free" : (ASPECTS.find(a => a.value === aspectDefault)?.label || "Free"));
  const [aspect, setAspect] = useState(aspectDefault);
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onMediaLoaded = useCallback((media) => {
    setNaturalAspect(media.width / media.height);
  }, []);

  const onCropComplete = useCallback((_, areaPixels) => setCroppedAreaPixels(areaPixels), []);

  const reset = () => { setZoom(1); setCrop({ x: 0, y: 0 }); };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropped(blob);
    } catch (err) {
      alert(err.message || "Could not crop image");
      setBusy(false);
    }
  };

  const activeLabel = aspectKey;

  return (
    <div className="crop-modal-bg">
      <div className="crop-modal">
        <div className="crop-modal-hd">
          <div className="crop-modal-title">
            ✂️ Crop &amp; Adjust Image
            <span className="crop-frame-badge">{activeLabel} Frame</span>
            {remaining > 0 && <span className="crop-remaining-badge">{remaining} more after this</span>}
          </div>
          <button className="crop-modal-close" onClick={onCancel} aria-label="Cancel">✕</button>
        </div>

        <div className="crop-modal-controls">
          <span className="crop-ctrl-label">Aspect</span>
          {ASPECTS.map(a => (
            <button key={a.label} className={`crop-aspect-btn ${aspectKey === a.label ? "act" : ""}`}
              onClick={() => { setAspectKey(a.label); setAspect(a.value === null ? naturalAspect : a.value); }}>
              {a.label}
            </button>
          ))}
          <button className="crop-reset-btn" onClick={reset}>↺ Reset</button>
          {croppedAreaPixels && (
            <span className="crop-dims">{Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)}</span>
          )}
        </div>

        <div className="crop-modal-zoom">
          <span>Zoom</span>
          <button onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}>−</button>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(+e.target.value)} />
          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}>+</button>
          <span className="crop-zoom-pct">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="crop-modal-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect || naturalAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
          />
        </div>

        <div className="crop-modal-footer">
          <span className="crop-hint">Drag to reposition · Scroll or use slider to zoom</span>
          <div className="crop-modal-actions">
            <button className="admin-btn admin-btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={handleConfirm} disabled={busy || !croppedAreaPixels}>
              {busy ? "Cropping…" : "✂️ Crop & Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
