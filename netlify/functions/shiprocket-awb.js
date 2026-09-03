// Assign an AWB (courier) + generate a pickup request. Admin only.
const { db } = require("./_firebase");
const { SR_BASE, srToken } = require("./_shiprocket");
const { json, readBody, verifyCaller } = require("./_util");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  const caller = await verifyCaller(event);
  if (!caller?.isAdmin) return json(403, { error: "Admin only" });

  const { shipmentId, orderId } = readBody(event);
  if (!shipmentId || !orderId) return json(400, { error: "shipmentId and orderId are required" });

  let token;
  try { token = await srToken(); } catch (err) { return json(502, { error: err.message }); }

  let awbData;
  try {
    const r = await fetch(`${SR_BASE}/courier/assign/awb`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: [String(shipmentId)] }),
    });
    const d = await r.json().catch(() => ({}));
    awbData = (d.response && d.response.data) || {};
    if (!awbData.awb_code)
      return json(502, { error: `ShipRocket did not assign an AWB: ${d.message || JSON.stringify(d)}` });
  } catch (err) {
    return json(502, { error: `ShipRocket AWB: ${err.message}` });
  }

  // Fire a pickup request (best effort)
  try {
    await fetch(`${SR_BASE}/courier/generate/pickup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: [String(shipmentId)] }),
    });
  } catch { /* ignore */ }

  const awb = awbData.awb_code;
  const courierName = awbData.courier_name || "";
  const trackingUrl = `https://shiprocket.co/tracking/${awb}`;

  await db.doc(`orders/${orderId}`).set({
    shiprocket: { awb, courierName, trackingUrl, status: "ready_to_ship" },
  }, { merge: true });

  return json(200, { awb, courierName, trackingUrl });
};
