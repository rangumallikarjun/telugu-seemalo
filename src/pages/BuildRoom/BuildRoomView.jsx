import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import Scene3D from "./Scene3D";
import FurnitureSidebar from "./FurnitureSidebar";
import QuotePanel from "./QuotePanel";
import useRoomBuilderStore from "../../store/roomBuilderStore";

const QUICK_COLORS = [
  "#8B7355","#A08060","#6B4C2A","#4A3020","#C4A882",  // wood browns
  "#F5F0EB","#E8E4DC","#D4D0C8","#B8B4A8","#888880",  // neutrals
  "#2C6E49","#40916C","#74C69D","#556B2F","#8FBC8F",  // greens
  "#C0392B","#E8620A","#C9901A","#8B6914","#F5E6C8",  // warm
  "#2471A3","#1A3A6B","#4A6FA5","#87CEEB","#D0D8E8",  // blues
  "#9B7D5C","#7A5C3C","#5C3D1E","#3D2B1A","#2A1A0A",  // darks
];

const MODE_ICONS = {
  translate: "↔",
  rotate:    "↻",
  scale:     "⤡",
};

export default function BuildRoomView({ roomCfg, products = [], onExit, onRequestConsultation }) {
  const store = useRoomBuilderStore();
  const sceneRef = useRef(null);
  const {
    selectedItemId, setSelectedItemId,
    transformMode, setTransformMode,
    snapToGrid, toggleSnap,
    cameraPreset, setCameraPreset,
    removePlacedItem, clearRoom,
    updatePlacedItem,
  } = store;

  // currently selected item object
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return (store.getPlacedItems(roomCfg.id) || []).find(i => i.id === selectedItemId) || null;
  }, [selectedItemId, store, roomCfg.id]);

  const settings = store.getRoomSettings(roomCfg.id);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAddToQuote = useCallback((product, roomName) => {
    store.addToQuote(product, roomName);
  }, [store]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedItemId) {
      removePlacedItem(roomCfg.id, selectedItemId);
      setSelectedItemId(null);
    }
  }, [selectedItemId, roomCfg.id, removePlacedItem, setSelectedItemId]);

  // Global keyboard shortcuts — attached to window so canvas focus doesn't block them
  useEffect(() => {
    const handleKey = (e) => {
      // don't fire when user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        store.setPlacingItem(null);
        setSelectedItemId(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") handleDeleteSelected();
      if (e.key === "g") setTransformMode("translate");
      if (e.key === "r") setTransformMode("rotate");
      if (e.key === "s") setTransformMode("scale");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleDeleteSelected, setSelectedItemId, setTransformMode, store]);

  return (
    <div
      style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}
    >
      {/* ── Left sidebar ── */}
      <FurnitureSidebar
        roomCfg={roomCfg}
        products={products}
        onAddToQuote={handleAddToQuote}
      />

      {/* ── Centre: 3D viewport ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Top toolbar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          background: "rgba(18,14,8,.92)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #3A2A1A",
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", flexWrap: "wrap",
        }}>
          {/* back */}
          <button onClick={onExit} style={btnStyle("#4A3828")}>
            ← Rooms
          </button>

          <div style={{ width: 1, height: 24, background: "#3A2A1A", margin: "0 4px" }} />

          {/* room label */}
          <span style={{ color: "#C9901A", fontWeight: 700, fontSize: 13, marginRight: 4 }}>
            {roomCfg.icon} {roomCfg.name}
          </span>

          <div style={{ width: 1, height: 24, background: "#3A2A1A", margin: "0 4px" }} />

          {/* transform modes */}
          {Object.entries(MODE_ICONS).map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => setTransformMode(mode)}
              title={`${mode} [${mode[0]}]`}
              style={btnStyle(transformMode === mode ? "#C9901A" : "#4A3828", transformMode === mode ? "#fff" : "#C9A96E")}
            >
              {icon} {mode}
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: "#3A2A1A", margin: "0 4px" }} />

          {/* snap toggle */}
          <button onClick={toggleSnap} style={btnStyle(snapToGrid ? "#2A4A2A" : "#4A3828", snapToGrid ? "#6BCF6B" : "#C9A96E")}>
            {snapToGrid ? "⊞" : "⊟"} Snap
          </button>

          {/* camera presets */}
          {["perspective", "top", "front"].map(p => (
            <button
              key={p}
              onClick={() => setCameraPreset(p)}
              style={btnStyle(cameraPreset === p ? "#2A3A4A" : "#4A3828", cameraPreset === p ? "#6BBFCF" : "#C9A96E")}
            >
              {p === "perspective" ? "👁" : p === "top" ? "⬆" : "↗"} {p}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* delete selected */}
          {selectedItemId && (
            <button onClick={handleDeleteSelected} style={btnStyle("#4A2A2A", "#CF6B6B")}>
              🗑 Delete
            </button>
          )}

          {/* clear room */}
          {!showClearConfirm ? (
            <button onClick={() => setShowClearConfirm(true)} style={btnStyle("#3A2A1A")}>
              Clear Room
            </button>
          ) : (
            <>
              <span style={{ color: "#CF6B6B", fontSize: 12 }}>Clear all?</span>
              <button
                onClick={() => { clearRoom(roomCfg.id); setShowClearConfirm(false); }}
                style={btnStyle("#4A2A2A", "#CF6B6B")}
              >
                Yes
              </button>
              <button onClick={() => setShowClearConfirm(false)} style={btnStyle("#3A2A1A")}>
                No
              </button>
            </>
          )}
        </div>

        {/* 3D canvas */}
        <div style={{ position: "absolute", inset: 0, paddingTop: 48 }}>
          <Scene3D ref={sceneRef} roomCfg={roomCfg} settings={settings} />
        </div>

        {/* ── Color picker panel (appears when item selected) ── */}
        {selectedItem && (
          <div style={{
            position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
            zIndex: 20, background: "rgba(18,14,8,.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid #4A3828", borderRadius: 12,
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,.6)",
          }}>
            <div style={{ color: "#8B7060", fontSize: 11, whiteSpace: "nowrap" }}>
              Color:
            </div>

            {/* current color swatch */}
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: selectedItem.color || "#8B7355",
              border: "2px solid #C9901A",
            }} />

            {/* quick palette */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 240 }}>
              {QUICK_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updatePlacedItem(roomCfg.id, selectedItemId, { color: c })}
                  title={c}
                  style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: c, cursor: "pointer",
                    border: selectedItem.color === c ? "2px solid #fff" : "2px solid transparent",
                    padding: 0, flexShrink: 0,
                  }}
                />
              ))}
            </div>

            {/* custom color */}
            <label style={{ cursor: "pointer", flexShrink: 0 }} title="Custom color">
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: "conic-gradient(red,yellow,green,blue,red)",
                border: "2px solid #4A3828",
              }} />
              <input
                type="color"
                value={selectedItem.color || "#8B7355"}
                onChange={e => updatePlacedItem(roomCfg.id, selectedItemId, { color: e.target.value })}
                style={{ display: "none" }}
              />
            </label>

            {/* delete */}
            <button
              onClick={handleDeleteSelected}
              style={{
                background: "#3A1A1A", border: "1px solid #6B3A3A",
                borderRadius: 6, color: "#CF6B6B", padding: "5px 10px",
                cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              🗑 Delete
            </button>
          </div>
        )}

        {/* hints */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          pointerEvents: "none",
        }}>
          {store.placingItem ? (
            <Hint>Click anywhere in the room to place · Esc to cancel</Hint>
          ) : selectedItemId ? (
            <Hint>Drag gizmo to move · G/R/S to switch mode · Del to remove</Hint>
          ) : (
            <Hint>Click a furniture item to select · Orbit: drag · Zoom: scroll</Hint>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <QuotePanel
        roomCfg={roomCfg}
        sceneRef={sceneRef}
        onRequestConsultation={onRequestConsultation}
      />
    </div>
  );
}

function btnStyle(bg = "#4A3828", color = "#C9A96E") {
  return {
    background: bg, border: "none", borderRadius: 5, color,
    padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600,
    whiteSpace: "nowrap",
  };
}

function Hint({ children }) {
  return (
    <div style={{
      background: "rgba(18,14,8,.75)", backdropFilter: "blur(4px)",
      border: "1px solid #3A2A1A", borderRadius: 20,
      color: "#8B7060", fontSize: 11, padding: "5px 14px",
    }}>
      {children}
    </div>
  );
}
