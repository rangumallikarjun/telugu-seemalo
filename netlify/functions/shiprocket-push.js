// Create the ShipRocket order for a paid order.
// Called automatically from checkout after payment, and from the admin
// "Push to ShipRocket" button (with an admin token).
const { db, FieldValue } = require("./_firebase");
const { SR_BASE, srToken, srConfig } = require("./_shiprocket");
const { json, readBody, verifyCaller } = require("./_util");

const verifyRazorpayPayment = async (paymentId) => {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return { ok: false, reason: "Razorpay keys not configured on server" };
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") },
  });
  const p = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: p.error?.description || `payment lookup failed (${res.status})` };
  const okStatus = p.status === "captured" || p.status === "authorized";
  return { ok: okStatus, reason: okStatus ? "" : `payment status is ${p.status}` };
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  const { orderId, razorpayPaymentId } = readBody(event);
  if (!orderId) return json(400, { error: "orderId is required" });

  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) return json(404, { error: "Order not found" });
  const order = snap.data();

  // Idempotent — already pushed
  if (order.shiprocket && order.shiprocket.shipmentId)
    return json(200, { orderId: order.shiprocket.orderId, shipmentId: order.shiprocket.shipmentId, status: order.shiprocket.status, already: true });

  const caller = await verifyCaller(event);
  const isPrepaid = order.paymentStatus === "paid";

  // Authorisation: an admin can push anything; otherwise the caller must
  // present a Razorpay payment that Razorpay confirms as captured.
  if (!caller?.isAdmin) {
    if (!isPrepaid) return json(403, { error: "Admin only for non-prepaid orders" });
    const pid = razorpayPaymentId || order.razorpayPaymentId;
    if (!pid) return json(402, { error: "No payment id to verify" });
    const v = await verifyRazorpayPayment(pid);
    if (!v.ok) return json(402, { error: `Payment not verified: ${v.reason}` });
  }

  const sr = await srConfig();
  const pickup = String(sr.pickupLocation || sr.pickup_location || "").trim();
  if (!pickup)
    return json(412, { error: "Set the ShipRocket 'Pickup Location Name' (exactly as in your ShipRocket panel) in Admin → Shipping." });

  const a = order.addr || {};
  const phone = String(a.phone || "").replace(/\D/g, "").slice(-10);
  const pincode = String(a.pin || a.pincode || "").replace(/\D/g, "");
  if (phone.length !== 10) return json(422, { error: `Order ${orderId}: phone must be 10 digits for ShipRocket.` });
  if (pincode.length !== 6) return json(422, { error: `Order ${orderId}: PIN code must be 6 digits for ShipRocket.` });

  const payload = {
    order_id: orderId,
    order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
    pickup_location: pickup,
    ...(sr.channelId ? { channel_id: sr.channelId } : {}),
    billing_customer_name: a.name || "",
    billing_last_name: "",
    billing_address: a.line1 || a.address || "",
    billing_address_2: a.line2 || "",
    billing_city: a.city || "",
    billing_pincode: pincode,
    billing_state: a.state || "",
    billing_country: "India",
    billing_email: order.userEmail || a.email || "",
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: (order.items || []).map((i) => ({
      name: i.name || "Item",
      sku: String(i.id || "SKU001"),
      units: i.qty || 1,
      selling_price: i.price || 0,
      discount: 0,
      tax: "",
      hsn: "",
    })),
    payment_method: order.paymentStatus === "cod" ? "COD" : "Prepaid",
    sub_total: order.total || 0,
    length: 30, breadth: 20, height: 15, weight: 1,
  };

  let token, res, data;
  try {
    token = await srToken();
    res = await fetch(`${SR_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) {
    return json(502, { error: `ShipRocket: ${err.message}` });
  }

  if (!res.ok || (!data.order_id && !data.shipment_id)) {
    const msg = data.message || (data.errors ? JSON.stringify(data.errors) : JSON.stringify(data));
    return json(502, { error: `ShipRocket: ${msg}` });
  }

  const shiprocket = {
    orderId: data.order_id || null,
    shipmentId: data.shipment_id || null,
    status: "created",
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set({ shiprocket }, { merge: true });

  return json(200, { orderId: data.order_id, shipmentId: data.shipment_id, status: "created" });
};
