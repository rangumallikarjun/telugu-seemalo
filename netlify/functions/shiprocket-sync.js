// Pull latest ShipRocket status for all active shipped orders. Admin only.
// Also usable as a Netlify scheduled function later.
const { db, FieldValue } = require("./_firebase");
const { SR_BASE, srToken } = require("./_shiprocket");
const { json, verifyCaller } = require("./_util");

const SR_MAP = {
  "PICKUP PENDING": "Processing", "PICKUP QUEUED": "Processing", "MANIFESTED": "Processing",
  "PLACED": "Processing", "NEW": "Processing", "READY TO SHIP": "Processing",
  "IN TRANSIT": "Shipped", "TRANSIT": "Shipped", "OUT FOR DELIVERY": "Shipped", "SHIPPED": "Shipped",
  "DELIVERED": "Delivered",
  "RTO INITIATED": "Cancelled", "RTO DELIVERED": "Cancelled", "CANCELLED": "Cancelled",
  "CANCELED": "Cancelled", "LOST": "Cancelled",
};
const mapStatus = (s = "") => {
  const up = s.toUpperCase();
  for (const [k, v] of Object.entries(SR_MAP)) if (up.includes(k)) return v;
  return null;
};

const notify = (order, mapped) => {
  if (!order.userId) return Promise.resolve();
  const msgs = {
    Shipped: `Your order ${order.id} has been shipped and is on its way!`,
    Delivered: `Your order ${order.id} has been delivered. Thank you for shopping with us!`,
    Cancelled: `Your order ${order.id} has been cancelled.`,
    Processing: `Your order ${order.id} is now being processed.`,
  };
  return db.collection("notifications").add({
    userId: order.userId, type: "order",
    title: `Order ${mapped}`, message: msgs[mapped] || `Order ${order.id} status: ${mapped}`,
    link: "orders", orderId: order.id, read: false,
    createdAt: FieldValue.serverTimestamp(),
  }).catch(() => {});
};

exports.handler = async (event) => {
  const caller = await verifyCaller(event);
  if (!caller?.isAdmin) return json(403, { error: "Admin only" });

  let snap;
  try {
    snap = await db.collection("orders").where("shiprocket.shipmentId", "!=", null).get();
  } catch (err) {
    return json(500, { error: err.message });
  }

  const active = snap.docs.filter((d) => {
    const s = d.data().status;
    return s !== "Delivered" && s !== "Cancelled" && d.data().shiprocket?.awb;
  });
  if (!active.length) return json(200, { synced: 0 });

  let token;
  try { token = await srToken(); } catch (err) { return json(502, { error: err.message }); }

  let synced = 0;
  for (const doc of active) {
    const order = doc.data();
    try {
      const r = await fetch(`${SR_BASE}/courier/track/awb/${order.shiprocket.awb}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const t = await r.json().catch(() => ({}));
      const srStatus = t?.tracking_data?.shipment_track?.[0]?.current_status || "";
      if (!srStatus) continue;
      const mapped = mapStatus(srStatus);
      const updates = {
        "shiprocket.status": srStatus,
        "shiprocket.lastSyncedAt": FieldValue.serverTimestamp(),
      };
      if (mapped && mapped !== order.status) {
        updates.status = mapped;
        await notify(order, mapped);
      }
      await doc.ref.update(updates);
      synced++;
    } catch { /* skip this order */ }
  }
  return json(200, { synced });
};
