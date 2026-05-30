import { useState } from "react";
import { ROOM_CONFIGS } from "../../data/roomConfig";
import useRoomBuilderStore from "../../store/roomBuilderStore";

export default function RoomSelector({ onSelectRoom, onBack }) {
  const store = useRoomBuilderStore();
  const { quotedItems } = store;
  const [hovered, setHovered] = useState(null);
  const total = quotedItems.reduce((s, q) => s + q.price * q.qty, 0);

  return (
    <div style={{
      flex: 1, minHeight: 0, overflow: "hidden",
      background: "#0E0A06",
      display: "flex", flexDirection: "column",
    }}>
      {/* header */}
      <div style={{
        background: "#1A1208", borderBottom: "1px solid #3A2A1A",
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={onBack}
              style={{
                background: "none", border: "1px solid #4A3828", borderRadius: 6,
                color: "#8B7060", padding: "5px 12px", cursor: "pointer", fontSize: 12,
              }}
            >
              ← Back to Shop
            </button>
            <div>
              <h1 style={{
                margin: 0, color: "#C9901A",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 700,
              }}>
                3D Room Builder
              </h1>
              <p style={{ margin: "2px 0 0", color: "#6B5040", fontSize: 11 }}>
                Design your space · Place products · Get a quote
              </p>
            </div>
          </div>
        </div>

        {/* quote summary badge */}
        {quotedItems.length > 0 && (
          <div style={{
            background: "#2A1A0A", border: "1px solid #C9901A", borderRadius: 10,
            padding: "10px 18px", textAlign: "right",
          }}>
            <div style={{ color: "#8B6040", fontSize: 11 }}>{quotedItems.length} items in quote</div>
            <div style={{ color: "#E8A83A", fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              ₹{total.toLocaleString("en-IN")}
            </div>
            <button
              onClick={() => store.clearQuote()}
              style={{ background: "none", border: "none", color: "#8B4040", cursor: "pointer", fontSize: 10, marginTop: 4 }}
            >
              Clear quote
            </button>
          </div>
        )}
      </div>

      {/* instructions */}
      <div style={{
        display: "flex", gap: 12, padding: "8px 20px",
        flexWrap: "wrap", borderBottom: "1px solid #1E1408",
      }}>
        {[
          { icon: "🏠", label: "Choose a room below" },
          { icon: "🪑", label: "Add furniture from the sidebar" },
          { icon: "🏺", label: "Browse & place products" },
          { icon: "📋", label: "Build your quote" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#6B5040", fontSize: 11,
          }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
            {i < 3 && <span style={{ color: "#3A2A1A", margin: "0 2px" }}>→</span>}
          </div>
        ))}
      </div>

      {/* room grid */}
      <div style={{
        flex: 1, minHeight: 0, padding: "10px 20px 16px",
        overflowY: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14, alignContent: "start",
      }}>
        {ROOM_CONFIGS.map(room => {
          const itemCount = (store.getPlacedItems(room.id) || []).length;
          const isHov = hovered === room.id;

          return (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              onMouseEnter={() => setHovered(room.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHov ? "#2A1A0A" : "#1A1208",
                border: `1px solid ${isHov ? "#C9901A" : "#3A2A1A"}`,
                borderRadius: 14, padding: 0, cursor: "pointer",
                textAlign: "left", overflow: "hidden",
                transition: "all .2s",
                transform: isHov ? "translateY(-2px)" : "none",
                boxShadow: isHov ? "0 8px 24px rgba(0,0,0,.5)" : "none",
              }}
            >
              {/* room preview */}
              <div style={{
                height: 100, position: "relative",
                background: `linear-gradient(135deg, ${getRoomGradient(room.id)})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 40, filter: "drop-shadow(0 2px 8px rgba(0,0,0,.4))" }}>
                  {room.icon}
                </span>

                {/* dimensions badge */}
                <div style={{
                  position: "absolute", top: 7, right: 8,
                  background: "rgba(18,14,8,.8)", borderRadius: 5,
                  padding: "2px 7px", fontSize: 10, color: "#8B7060",
                }}>
                  {room.h === 0 ? `${room.w}×${room.d}m` : `${room.w}×${room.d}×${room.h}m`}
                </div>

                {/* item count badge */}
                {itemCount > 0 && (
                  <div style={{
                    position: "absolute", top: 7, left: 8,
                    background: "#C9901A", borderRadius: 5,
                    padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 700,
                  }}>
                    {itemCount} items
                  </div>
                )}
              </div>

              <div style={{ padding: "10px 14px 12px" }}>
                <div style={{ color: "#C9A96E", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                  {room.name}
                </div>
                <div style={{ color: "#6B5040", fontSize: 11, lineHeight: 1.3, marginBottom: 8 }}>
                  {room.description}
                </div>

                {/* furniture tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {room.furniture.slice(0, 3).map(f => (
                    <span key={f} style={{
                      background: "#2A1A0A", border: "1px solid #3A2A1A",
                      borderRadius: 4, padding: "1px 6px",
                      fontSize: 9, color: "#8B7060",
                    }}>
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                  {room.furniture.length > 3 && (
                    <span style={{
                      background: "#2A1A0A", border: "1px solid #3A2A1A",
                      borderRadius: 4, padding: "1px 6px",
                      fontSize: 9, color: "#6B5040",
                    }}>
                      +{room.furniture.length - 3}
                    </span>
                  )}
                </div>

                <div style={{
                  marginTop: 10, background: isHov ? "#C9901A" : "#2A1A0A",
                  border: `1px solid ${isHov ? "transparent" : "#4A3828"}`,
                  borderRadius: 7, padding: "6px 10px",
                  color: isHov ? "#fff" : "#C9A96E",
                  fontSize: 11, fontWeight: 700, textAlign: "center",
                  transition: "all .2s",
                }}>
                  {itemCount > 0 ? "Edit Room →" : "Open in 3D →"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getRoomGradient(id) {
  const map = {
    living:    "#2A1A0A, #3A2A14",
    bedroom1:  "#1A1A2A, #2A1A2E",
    bedroom2:  "#1A2A1A, #1E3A1E",
    kitchen:   "#2A2A1A, #3A3A14",
    balcony1:  "#1A2A1A, #1A3A14",
    balcony2:  "#1A2A1A, #1A3A14",
    dining:    "#2A1A1A, #3A1A14",
    penthouse: "#1A2A1A, #0E1E0E",
  };
  return map[id] || "#1A1208, #2A1A0A";
}
