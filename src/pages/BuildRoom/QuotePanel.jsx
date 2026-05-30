import { useState } from "react";
import useRoomBuilderStore from "../../store/roomBuilderStore";

export default function QuotePanel({ roomCfg, sceneRef, onRequestConsultation }) {
  const store = useRoomBuilderStore();
  const { quotedItems, updateQuoteQty, removeFromQuote, clearQuote } = store;
  const [collapsed, setCollapsed] = useState(false);
  const [exporting, setExporting] = useState(false);

  const total = quotedItems.reduce((s, q) => s + q.price * q.qty, 0);
  const gst   = Math.round(total * 0.18);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // header
      doc.setFillColor(26, 18, 8);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(201, 144, 26);
      doc.setFontSize(22);
      doc.text("Telugu Seemalo", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(200, 180, 150);
      doc.text("Room Design Quotation", 14, 24);
      doc.text(`Room: ${roomCfg?.name || ""}`, 14, 30);
      doc.setTextColor(140, 120, 100);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 30);

      // snapshot
      if (sceneRef?.current?.capture) {
        try {
          const img = sceneRef.current.capture();
          doc.addImage(img, "PNG", 14, 40, 182, 80);
        } catch {}
      }

      // items table
      autoTable(doc, {
        startY: 128,
        head: [["Item", "Room", "Qty", "Unit Price", "Total"]],
        body: quotedItems.map(q => [
          q.name,
          q.room || roomCfg?.name || "",
          q.qty,
          `₹${q.price?.toLocaleString("en-IN")}`,
          `₹${(q.price * q.qty).toLocaleString("en-IN")}`,
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [26, 18, 8], textColor: [201, 144, 26] },
        alternateRowStyles: { fillColor: [245, 240, 235] },
        foot: [
          ["", "", "", "Subtotal", `₹${total.toLocaleString("en-IN")}`],
          ["", "", "", "GST (18%)", `₹${gst.toLocaleString("en-IN")}`],
          ["", "", "", "Grand Total", `₹${(total + gst).toLocaleString("en-IN")}`],
        ],
        footStyles: { fillColor: [60, 40, 20], textColor: [220, 190, 140], fontStyle: "bold" },
      });

      doc.save(`Telugu-Seemalo-Quote-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
    setExporting(false);
  };

  const handleScreenshot = () => {
    if (!sceneRef?.current?.capture) return;
    const url = sceneRef.current.capture();
    const a = document.createElement("a");
    a.href = url;
    a.download = `Room-Design-${Date.now()}.png`;
    a.click();
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "absolute", bottom: 20, right: 20,
          background: "#C9901A", border: "none", borderRadius: "50%",
          width: 52, height: 52, cursor: "pointer",
          fontSize: 22, boxShadow: "0 4px 16px rgba(0,0,0,.5)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="Open Quote Panel"
      >
        📋
        {quotedItems.length > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#E8620A", color: "#fff", borderRadius: "50%",
            width: 20, height: 20, fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {quotedItems.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: "#1A1208", borderLeft: "1px solid #3A2A1A",
      display: "flex", flexDirection: "column",
      maxHeight: "100%", overflow: "hidden",
    }}>
      {/* header */}
      <div style={{
        background: "#120E08", padding: "12px 14px",
        borderBottom: "1px solid #3A2A1A",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ color: "#C9901A", fontWeight: 700, fontSize: 14 }}>
          📋 Quote ({quotedItems.length})
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {quotedItems.length > 0 && (
            <button
              onClick={clearQuote}
              style={{ background: "none", border: "none", color: "#8B4040", cursor: "pointer", fontSize: 11 }}
              title="Clear all"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: "none", border: "none", color: "#6B5040", cursor: "pointer", fontSize: 16 }}
            title="Collapse"
          >
            ›
          </button>
        </div>
      </div>

      {/* items list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {quotedItems.length === 0 ? (
          <div style={{
            textAlign: "center", color: "#6B5040", padding: "40px 20px",
            fontSize: 13, lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            Add products from the<br />Products tab to build<br />your quotation
          </div>
        ) : (
          quotedItems.map(q => (
            <QuoteItem
              key={q._key}
              item={q}
              onQty={(qty) => updateQuoteQty(q._key, qty)}
              onRemove={() => removeFromQuote(q._key)}
            />
          ))
        )}
      </div>

      {/* totals */}
      {quotedItems.length > 0 && (
        <div style={{ borderTop: "1px solid #3A2A1A", padding: "12px 14px" }}>
          <Row label="Subtotal" value={`₹${total.toLocaleString("en-IN")}`} />
          <Row label="GST (18%)" value={`₹${gst.toLocaleString("en-IN")}`} dim />
          <div style={{ borderTop: "1px solid #3A2A1A", marginTop: 8, paddingTop: 8 }}>
            <Row label="Total" value={`₹${(total + gst).toLocaleString("en-IN")}`} bold />
          </div>
        </div>
      )}

      {/* actions */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #3A2A1A", display: "flex", flexDirection: "column", gap: 8 }}>
        {quotedItems.length > 0 && (
          <>
            <button
              onClick={onRequestConsultation}
              style={{
                width: "100%", background: "#C9901A", border: "none",
                borderRadius: 8, color: "#fff", padding: "10px 12px",
                cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}
            >
              📞 Request Consultation
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              style={{
                width: "100%", background: "transparent", border: "1px solid #C9901A",
                borderRadius: 8, color: "#C9901A", padding: "8px 12px",
                cursor: "pointer", fontWeight: 600, fontSize: 12,
              }}
            >
              {exporting ? "Generating…" : "⬇ Download PDF Quote"}
            </button>
          </>
        )}
        <button
          onClick={handleScreenshot}
          style={{
            width: "100%", background: "transparent", border: "1px solid #4A3828",
            borderRadius: 8, color: "#8B6040", padding: "8px 12px",
            cursor: "pointer", fontSize: 12,
          }}
        >
          📸 Save Room Screenshot
        </button>
      </div>
    </div>
  );
}

function QuoteItem({ item, onQty, onRemove }) {
  return (
    <div style={{
      padding: "10px 14px", borderBottom: "1px solid #2A1A0A",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ color: "#C9A96E", fontSize: 13, fontWeight: 600 }}>{item.name}</div>
          <div style={{ color: "#6B5040", fontSize: 11 }}>{item.room}</div>
        </div>
        <button
          onClick={onRemove}
          style={{ background: "none", border: "none", color: "#8B4040", cursor: "pointer", fontSize: 14 }}
        >
          ×
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* qty controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => onQty(item.qty - 1)}
            style={{ width: 24, height: 24, borderRadius: 4, background: "#2A1A0A", border: "1px solid #4A3828", color: "#C9A96E", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
          >−</button>
          <span style={{ color: "#C9A96E", fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: 13 }}>{item.qty}</span>
          <button
            onClick={() => onQty(item.qty + 1)}
            style={{ width: 24, height: 24, borderRadius: 4, background: "#2A1A0A", border: "1px solid #4A3828", color: "#C9A96E", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
          >+</button>
        </div>
        <div style={{ color: "#E8A83A", fontWeight: 700, fontSize: 14 }}>
          ₹{(item.price * item.qty).toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, dim, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ color: dim ? "#6B5040" : "#8B7060", fontSize: 12 }}>{label}</span>
      <span style={{
        color: bold ? "#E8A83A" : "#C9A96E",
        fontSize: bold ? 15 : 12,
        fontWeight: bold ? 700 : 400,
      }}>{value}</span>
    </div>
  );
}
