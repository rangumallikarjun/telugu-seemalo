import { useState, useCallback, useEffect } from "react";
import RoomSelector from "./BuildRoom/RoomSelector";
import BuildRoomView from "./BuildRoom/BuildRoomView";
import useRoomBuilderStore from "../store/roomBuilderStore";

function useMobileCheck() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function RoomBuilderPage({ products = [], setPage, addToCart, user }) {
  const isMobile = useMobileCheck();
  const store = useRoomBuilderStore();
  const { activeRoom, setActiveRoom, exitRoom, quotedItems } = store;
  const [consultOpen, setConsultOpen] = useState(false);

  const handleSelectRoom = useCallback((room) => {
    setActiveRoom(room);
  }, [setActiveRoom]);

  const handleExit = useCallback(() => {
    exitRoom();
  }, [exitRoom]);

  const handleRequestConsultation = useCallback(() => {
    setConsultOpen(true);
  }, []);

  // Lock body scroll while 3D builder is active; restore on unmount or when mobile
  useEffect(() => {
    if (isMobile) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isMobile]);

  if (isMobile) {
    return <MobileBlockScreen onBack={() => setPage("shop")} />;
  }

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: "flex", flexDirection: "column",
      overflow: "hidden", background: "#0E0A06",
    }}>
      {activeRoom ? (
        <BuildRoomView
          roomCfg={activeRoom}
          products={products}
          onExit={handleExit}
          onRequestConsultation={handleRequestConsultation}
        />
      ) : (
        <RoomSelector
          onSelectRoom={handleSelectRoom}
          onBack={() => setPage("shop")}
        />
      )}

      {/* consultation modal */}
      {consultOpen && (
        <ConsultModal
          quotedItems={quotedItems}
          user={user}
          onClose={() => setConsultOpen(false)}
          onSubmit={() => {
            setConsultOpen(false);
            setPage("contact");
          }}
        />
      )}
    </div>
  );
}

// ── Mobile block screen ───────────────────────────────────────────────────────
function MobileBlockScreen({ onBack }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "#0E0A06",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", textAlign: "center",
    }}>
      {/* icon */}
      <div style={{ fontSize: 64, marginBottom: 24 }}>🖥️</div>

      {/* heading */}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        color: "#C9901A", fontSize: "1.7rem", fontWeight: 700,
        margin: "0 0 12px", letterSpacing: ".02em",
      }}>
        Desktop Experience Only
      </h2>

      {/* sub-heading */}
      <p style={{
        color: "#8B7060", fontSize: "1rem", lineHeight: 1.6,
        maxWidth: 320, margin: "0 0 32px",
      }}>
        The 3D Room Builder requires a larger screen to give you the best design experience.
      </p>

      {/* divider */}
      <div style={{
        width: 48, height: 2,
        background: "linear-gradient(90deg, transparent, #C9901A, transparent)",
        marginBottom: 32,
      }} />

      {/* instruction card */}
      <div style={{
        background: "#1A1208", border: "1px solid #3A2A1A",
        borderRadius: 14, padding: "22px 28px", maxWidth: 320, width: "100%",
        marginBottom: 32,
      }}>
        <div style={{ color: "#C9A96E", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
          How to access the Room Builder:
        </div>
        {[
          { icon: "💻", text: "Open on a laptop or desktop computer" },
          { icon: "↔️", text: "Screen width of at least 1024px required" },
          { icon: "🔗", text: "Use the same link — your design saves automatically" },
        ].map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            marginBottom: i < 2 ? 14 : 0,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{step.icon}</span>
            <span style={{ color: "#A09070", fontSize: 13, lineHeight: 1.5 }}>{step.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
        <button
          onClick={onBack}
          style={{
            background: "#C9901A", border: "none", borderRadius: 10,
            color: "#fff", padding: "14px 0",
            fontWeight: 700, fontSize: 15, cursor: "pointer",
            letterSpacing: ".02em",
          }}
        >
          Browse Products Instead →
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "Telugu Seemalo Room Builder", url: window.location.href });
            } else {
              navigator.clipboard?.writeText(window.location.href);
            }
          }}
          style={{
            background: "transparent", border: "1px solid #4A3828",
            borderRadius: 10, color: "#8B7060", padding: "12px 0",
            fontSize: 13, cursor: "pointer",
          }}
        >
          📋 Copy link to open on desktop
        </button>
      </div>

      {/* bottom note */}
      <p style={{ color: "#4A3828", fontSize: 11, marginTop: 32 }}>
        Telugu Seemalo · Authentic Craft
      </p>
    </div>
  );
}

// ── Consultation CTA modal ────────────────────────────────────────────────────
function ConsultModal({ quotedItems, user, onClose, onSubmit }) {
  const total = quotedItems.reduce((s, q) => s + q.price * q.qty, 0);
  const gst   = Math.round(total * 0.18);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,.75)", display: "flex",
      alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#1A1208", borderRadius: 16, maxWidth: 480, width: "100%",
        border: "1px solid #C9901A", overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          background: "#2A1A0A", padding: "18px 22px",
          borderBottom: "1px solid #3A2A1A",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ color: "#C9901A", fontWeight: 700, fontSize: 16 }}>
            📞 Request Consultation
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B6040", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <div style={{ padding: "20px 22px" }}>
          <p style={{ color: "#A09070", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
            Our interior design experts will reach out to discuss your room design and provide a final quotation.
          </p>

          {/* quote summary */}
          {quotedItems.length > 0 && (
            <div style={{
              background: "#120E08", borderRadius: 8, border: "1px solid #3A2A1A",
              padding: "12px 14px", marginBottom: 18,
            }}>
              <div style={{ color: "#8B6040", fontSize: 11, marginBottom: 8 }}>YOUR QUOTE SUMMARY</div>
              {quotedItems.slice(0, 5).map(q => (
                <div key={q._key} style={{
                  display: "flex", justifyContent: "space-between",
                  color: "#C9A96E", fontSize: 12, marginBottom: 4,
                }}>
                  <span>{q.name} ×{q.qty}</span>
                  <span>₹{(q.price * q.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {quotedItems.length > 5 && (
                <div style={{ color: "#6B5040", fontSize: 11, marginBottom: 4 }}>
                  +{quotedItems.length - 5} more items…
                </div>
              )}
              <div style={{
                borderTop: "1px solid #3A2A1A", paddingTop: 8, marginTop: 8,
                display: "flex", justifyContent: "space-between",
                color: "#E8A83A", fontWeight: 700, fontSize: 14,
              }}>
                <span>Total (incl. GST)</span>
                <span>₹{(total + gst).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onSubmit}
              style={{
                flex: 1, background: "#C9901A", border: "none",
                borderRadius: 8, color: "#fff", padding: "12px 0",
                cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}
            >
              Contact Us →
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: "transparent", border: "1px solid #4A3828",
                borderRadius: 8, color: "#8B6040", padding: "12px 0",
                cursor: "pointer", fontSize: 14,
              }}
            >
              Continue Designing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
