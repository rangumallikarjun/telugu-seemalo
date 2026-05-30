import { useState } from "react";
import useRoomBuilderStore from "../../store/roomBuilderStore";
import { FURNITURE_CATEGORIES, FLOOR_OPTIONS, WALL_COLORS, CEILING_OPTIONS, WINDOW_STYLES, CURTAIN_STYLES, CURTAIN_COLORS, LIGHT_MODES } from "../../data/roomConfig";

// Maps product category → 3-D shape + default dimensions + color
const CATEGORY_TO_SHAPE = {
  "Pots":        { shape: "vase",     w: 0.28, d: 0.28, h: 0.45, color: "#C0392B" },
  "Clocks":      { shape: "stone_clock", w: 0.42, d: 0.06, h: 0.40, color: "#B09048" },
  "Curtains":    { shape: "painting", w: 1.20, d: 0.05, h: 2.20, color: "#8B5A2B" },
  "Bed Sheets":  { shape: "rug",      w: 1.60, d: 2.00, h: 0.02, color: "#C09040" },
  "Home Decor":  { shape: "vase",     w: 0.30, d: 0.30, h: 0.40, color: "#A0522D" },
  "Furniture":   { shape: "armchair", w: 0.85, d: 0.85, h: 0.90, color: "#8B7355" },
  "Paintings":   { shape: "painting", w: 0.90, d: 0.06, h: 0.70, color: "#6B4914" },
  "Weaving":     { shape: "painting", w: 0.80, d: 0.05, h: 0.90, color: "#7B5A2A" },
  "Textiles":    { shape: "rug",      w: 1.40, d: 0.90, h: 0.02, color: "#B08040" },
  "Lamps":       { shape: "lamp",     w: 0.35, d: 0.35, h: 1.60, color: "#C9901A" },
  "Toys":        { shape: "vase",     w: 0.20, d: 0.20, h: 0.25, color: "#E8620A" },
  "Jewellery":   { shape: "vase",     w: 0.15, d: 0.15, h: 0.15, color: "#C9901A" },
  "default":     { shape: "vase",     w: 0.28, d: 0.28, h: 0.40, color: "#C0392B" },
};

function getProductShape(category) {
  return CATEGORY_TO_SHAPE[category] || CATEGORY_TO_SHAPE.default;
}

const TAB_ICONS = { furniture: "🪑", materials: "🎨", products: "🏺" };

export default function FurnitureSidebar({ roomCfg, products = [], onAddToQuote }) {
  const store = useRoomBuilderStore();
  const { sidebarTab, setSidebarTab, setPlacingItem, selectedProduct, setSelectedProduct } = store;
  const settings = store.getRoomSettings(roomCfg.id);
  const [searchQ, setSearchQ] = useState("");
  const [expandedCat, setExpandedCat] = useState(null);

  // ── Furniture tab ─────────────────────────────────────────────────────────
  const renderFurniture = () => {
    const filtered = FURNITURE_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(i =>
        !searchQ || i.label.toLowerCase().includes(searchQ.toLowerCase())
      ),
    })).filter(cat => cat.items.length > 0);

    return (
      <div style={{ padding: "10px 0" }}>
        <div style={{ padding: "0 12px 10px" }}>
          <input
            placeholder="Search furniture…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#2A1E14", border: "1px solid #4A3828",
              borderRadius: 6, color: "#F0E8D8", padding: "7px 10px",
              fontSize: 13, outline: "none",
            }}
          />
        </div>

        {filtered.map(cat => (
          <div key={cat.id}>
            {/* category header */}
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between",
                background: expandedCat === cat.id ? "#3A2A1A" : "transparent",
                border: "none", borderBottom: "1px solid #3A2A1A",
                color: "#C9A96E", padding: "9px 14px",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              <span>{cat.icon} {cat.label}</span>
              <span style={{ fontSize: 10 }}>{expandedCat === cat.id ? "▲" : "▼"}</span>
            </button>

            {/* items grid */}
            {expandedCat === cat.id && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, padding: "10px 12px",
                background: "#1E1410",
              }}>
                {cat.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPlacingItem({ ...item });
                      setSidebarTab("furniture");
                    }}
                    style={{
                      background: "#2A1E14", border: "1px solid #4A3828",
                      borderRadius: 8, padding: "10px 8px",
                      cursor: "pointer", textAlign: "center",
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#C9901A"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#4A3828"}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 6,
                      background: item.color || "#8B7355",
                      margin: "0 auto 6px",
                      opacity: 0.85,
                    }} />
                    <div style={{ fontSize: 11, color: "#C9A96E", lineHeight: 1.2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#6B5040", marginTop: 2 }}>
                      {item.w.toFixed(1)}×{item.d.toFixed(1)}m
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── Materials tab ─────────────────────────────────────────────────────────
  const renderMaterials = () => (
    <div style={{ padding: "12px 14px" }}>

      <Section label="Lighting">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LIGHT_MODES.map(lm => {
            const active = (settings.lightMode || "day") === lm.id;
            const palettes = {
              bright:  { sky: "#FFF8F0", glow: "#FFEECC" },
              day:     { sky: "#FFF0D0", glow: "#FFD890" },
              evening: { sky: "#E07020", glow: "#C04010" },
              night:   { sky: "#1A1420", glow: "#8B4010" },
            };
            const p = palettes[lm.id];
            return (
              <button
                key={lm.id}
                onClick={() => store.updateRoomSettings(roomCfg.id, { lightMode: lm.id })}
                style={{
                  background: active ? "#3A2A1A" : "#2A1E14",
                  border: `1.5px solid ${active ? "#C9901A" : "#4A3828"}`,
                  borderRadius: 8, cursor: "pointer",
                  padding: "10px 6px", textAlign: "center",
                }}
              >
                {/* mini scene preview */}
                <div style={{
                  width: "100%", height: 32, borderRadius: 4, marginBottom: 5,
                  background: `linear-gradient(to bottom, ${p.sky} 0%, #2A1E14 70%)`,
                  position: "relative", overflow: "hidden",
                }}>
                  {/* sconce glow dots */}
                  {[25, 58, 90].map(x => (
                    <div key={x} style={{
                      position: "absolute", top: 6, left: `${x}%`,
                      width: 8, height: 8, borderRadius: "50%",
                      background: p.glow,
                      boxShadow: `0 0 6px 3px ${p.glow}`,
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? "#C9901A" : "#8B6040" }}>
                  {lm.label}
                </div>
                <div style={{ fontSize: 9, color: "#6B5040", marginTop: 1 }}>{lm.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Floor">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FLOOR_OPTIONS.map(f => (
            <button
              key={f.id}
              onClick={() => store.updateRoomSettings(roomCfg.id, { floorType: f.id })}
              style={{
                border: settings.floorType === f.id ? "2px solid #C9901A" : "2px solid #3A2A1A",
                borderRadius: 8, background: "#2A1E14", cursor: "pointer",
                padding: "6px 8px", textAlign: "center",
              }}
            >
              <div style={{ width: 36, height: 24, borderRadius: 4, background: f.preview, margin: "0 auto 4px" }} />
              <div style={{ fontSize: 10, color: "#C9A96E" }}>{f.label}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section label="Wall Color">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {WALL_COLORS.map(w => (
            <button
              key={w.id}
              onClick={() => store.updateRoomSettings(roomCfg.id, { wallColor: w.id })}
              title={w.label}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: w.id,
                border: settings.wallColor === w.id ? "3px solid #C9901A" : "3px solid transparent",
                outline: "1px solid #4A3828",
                cursor: "pointer",
              }}
            />
          ))}
          {/* custom color */}
          <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "conic-gradient(red,yellow,green,blue,red)",
              border: "3px solid #4A3828",
            }} />
            <input
              type="color"
              value={settings.wallColor}
              onChange={e => store.updateRoomSettings(roomCfg.id, { wallColor: e.target.value })}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </Section>

      <Section label="Ceiling">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {CEILING_OPTIONS.map(c => (
            <button
              key={c.id}
              onClick={() => store.updateRoomSettings(roomCfg.id, { ceilingType: c.id })}
              style={{
                background: settings.ceilingType === c.id ? "#3A2A1A" : "transparent",
                border: `1px solid ${settings.ceilingType === c.id ? "#C9901A" : "#3A2A1A"}`,
                borderRadius: 6, color: "#C9A96E", padding: "7px 12px",
                cursor: "pointer", textAlign: "left", fontSize: 13,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Window Style">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {WINDOW_STYLES.map(ws => {
            const active = (settings.windowStyle || "large") === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => store.updateRoomSettings(roomCfg.id, { windowStyle: ws.id })}
                style={{
                  background: active ? "#3A2A1A" : "#2A1E14",
                  border: `1px solid ${active ? "#C9901A" : "#4A3828"}`,
                  borderRadius: 8, cursor: "pointer", padding: "8px 4px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                }}
              >
                <WindowPreview id={ws.id} />
                <span style={{ fontSize: 10, color: active ? "#C9901A" : "#8B6040", fontWeight: 600 }}>
                  {ws.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Curtain Style">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CURTAIN_STYLES.map(cs => {
            const active = (settings.curtainStyle || "panel") === cs.id;
            return (
              <button
                key={cs.id}
                onClick={() => store.updateRoomSettings(roomCfg.id, { curtainStyle: cs.id })}
                style={{
                  background: active ? "#3A2A1A" : "#2A1E14",
                  border: `1px solid ${active ? "#C9901A" : "#4A3828"}`,
                  borderRadius: 8, cursor: "pointer", padding: "8px 4px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                }}
              >
                <CurtainPreview id={cs.id} color={settings.curtainColor || "#E8E0D0"} />
                <span style={{ fontSize: 10, color: active ? "#C9901A" : "#8B6040", fontWeight: 600 }}>
                  {cs.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {(settings.curtainStyle || "panel") !== "none" && (
        <Section label="Curtain Color">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CURTAIN_COLORS.map(cc => (
              <button
                key={cc.id}
                onClick={() => store.updateRoomSettings(roomCfg.id, { curtainColor: cc.id })}
                title={cc.label}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: cc.id,
                  border: (settings.curtainColor || "#E8E0D0") === cc.id
                    ? "3px solid #C9901A" : "3px solid transparent",
                  outline: "1px solid #4A3828",
                  cursor: "pointer",
                }}
              />
            ))}
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "conic-gradient(red,yellow,green,blue,red)",
                border: "3px solid #4A3828",
              }} />
              <input
                type="color"
                value={settings.curtainColor || "#E8E0D0"}
                onChange={e => store.updateRoomSettings(roomCfg.id, { curtainColor: e.target.value })}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </Section>
      )}
    </div>
  );

  // ── Products tab ──────────────────────────────────────────────────────────
  const renderProducts = () => {
    const filtered = products.filter(p =>
      !searchQ ||
      p.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQ.toLowerCase())
    );

    return (
      <div style={{ padding: "10px 0" }}>
        <div style={{ padding: "0 12px 10px" }}>
          <input
            placeholder="Search products…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#2A1E14", border: "1px solid #4A3828",
              borderRadius: 6, color: "#F0E8D8", padding: "7px 10px",
              fontSize: 13, outline: "none",
            }}
          />
        </div>

        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            roomCfg={roomCfg}
            onAddToQuote={onAddToQuote}
            onClose={() => setSelectedProduct(null)}
            onPlace={() => {
              const shapeInfo = getProductShape(selectedProduct.category);
              setPlacingItem({
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                label: selectedProduct.name,
                ...shapeInfo,
              });
              setSelectedProduct(null);
            }}
          />
        )}

        <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.slice(0, 40).map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              style={{
                background: "#2A1E14", border: "1px solid #4A3828",
                borderRadius: 8, padding: "10px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#C9901A"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#4A3828"}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                background: "#3A2A1A", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20,
              }}>
                {p.emoji || "🏺"}
              </div>
              <div>
                <div style={{ color: "#C9A96E", fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#8B6040", fontSize: 11 }}>{p.category}</div>
                <div style={{ color: "#E8A83A", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                  ₹{p.price?.toLocaleString("en-IN")}
                </div>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div style={{ color: "#6B5040", textAlign: "center", padding: 24, fontSize: 13 }}>
              No products found
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: "#1A1208", borderRight: "1px solid #3A2A1A",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* tab bar */}
      <div style={{
        display: "flex", borderBottom: "1px solid #3A2A1A",
        background: "#120E08",
      }}>
        {Object.entries(TAB_ICONS).map(([t, icon]) => (
          <button
            key={t}
            onClick={() => { setSidebarTab(t); setSearchQ(""); }}
            style={{
              flex: 1, border: "none", background: "none",
              borderBottom: sidebarTab === t ? "2px solid #C9901A" : "2px solid transparent",
              color: sidebarTab === t ? "#C9901A" : "#6B5040",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: ".05em", transition: "all .15s",
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            {t}
          </button>
        ))}
      </div>

      {/* content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sidebarTab === "furniture" && renderFurniture()}
        {sidebarTab === "materials" && renderMaterials()}
        {sidebarTab === "products"  && renderProducts()}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6040", letterSpacing: ".08em",
                    textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Window style mini-preview ─────────────────────────────────────────────────
function WindowPreview({ id }) {
  const base = { border: "1.5px solid #444", background: "#1A2A3E", boxSizing: "border-box" };
  if (id === "large") return (
    <div style={{ ...base, width: 40, height: 30, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, padding: 2 }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: "#4A7090" }} />)}
    </div>
  );
  if (id === "arched") return (
    <div style={{ width: 40, height: 34, position: "relative" }}>
      <div style={{ ...base, position: "absolute", bottom: 0, left: 4, right: 4, height: 20 }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 26, height: 15, borderRadius: "50% 50% 0 0", border: "1.5px solid #444", borderBottom: "none", background: "#4A7090" }} />
    </div>
  );
  if (id === "small") return (
    <div style={{ ...base, width: 22, height: 22, margin: "4px auto" }} />
  );
  return (
    <div style={{ width: 40, height: 30, background: "#2A1E14", border: "1.5px solid #4A3828", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B5040", fontSize: 13 }}>✕</div>
  );
}

// ── Curtain style mini-preview ────────────────────────────────────────────────
function CurtainPreview({ id, color }) {
  if (id === "panel") return (
    <div style={{ width: 32, height: 34, background: `linear-gradient(to right, rgba(0,0,0,0.25) 0%, ${color} 15%, ${color} 35%, rgba(0,0,0,0.2) 50%, ${color} 65%, ${color} 85%, rgba(0,0,0,0.25) 100%)`, border: "1px solid #4A3828" }} />
  );
  if (id === "sheer") return (
    <div style={{ width: 32, height: 34, background: color, opacity: 0.45, border: "1px dashed #888" }} />
  );
  if (id === "roman") return (
    <div style={{ width: 32, height: 34, background: color, border: "1px solid #4A3828", display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: "3px 0" }}>
      {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 2, background: "rgba(0,0,0,0.3)", margin: "0 3px" }} />)}
    </div>
  );
  return (
    <div style={{ width: 32, height: 34, background: "#2A1E14", border: "1px solid #4A3828", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B5040", fontSize: 13 }}>✕</div>
  );
}

function ProductDetail({ product, roomCfg, onAddToQuote, onClose, onPlace }) {
  return (
    <div style={{
      background: "#2A1A0A", border: "1px solid #C9901A",
      borderRadius: 10, margin: "0 12px 12px", padding: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 22 }}>{product.emoji || "🏺"}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B6040", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ color: "#C9A96E", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{product.name}</div>
      <div style={{ color: "#8B6040", fontSize: 11, marginBottom: 6 }}>{product.category}</div>
      <div style={{ color: "#E8A83A", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
        ₹{product.price?.toLocaleString("en-IN")}
      </div>
      <div style={{ color: "#A09070", fontSize: 11, lineHeight: 1.5, marginBottom: 12 }}>
        {product.description?.slice(0, 100)}…
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onPlace}
          style={{
            flex: 1, background: "#3A2A1A", border: "1px solid #C9901A",
            borderRadius: 6, color: "#C9901A", padding: "7px 4px",
            cursor: "pointer", fontSize: 11, fontWeight: 700,
          }}
        >
          📍 Place in Room
        </button>
        <button
          onClick={() => onAddToQuote(product, roomCfg.name)}
          style={{
            flex: 1, background: "#C9901A", border: "none",
            borderRadius: 6, color: "#fff", padding: "7px 4px",
            cursor: "pointer", fontSize: 11, fontWeight: 700,
          }}
        >
          + Add to Quote
        </button>
      </div>
    </div>
  );
}
