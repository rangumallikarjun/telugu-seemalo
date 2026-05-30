const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule }                    = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated }             = require("firebase-functions/v2/firestore");
const { defineSecret }                  = require("firebase-functions/params");
const admin   = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto  = require("crypto");
const axios   = require("axios");

admin.initializeApp();

const RZP_KEY_ID      = defineSecret("RAZORPAY_KEY_ID");
const RZP_KEY_SECRET  = defineSecret("RAZORPAY_KEY_SECRET");

// ── ShipRocket helpers ───────────────────────────────────────────────────────
const SR_BASE = "https://apiv2.shiprocket.in/v1/external";

// Token cache (valid 10 days, refreshed in memory between calls)
let _srToken   = null;
let _srTokenAt = 0;

// Reads credentials from Firestore settings (set via Admin → Shipping page)
async function getSRToken() {
  if (_srToken && Date.now() - _srTokenAt < 8 * 24 * 60 * 60 * 1000) return _srToken;
  const snap = await admin.firestore().doc("settings/shipping").get();
  const creds = snap.data()?.carriers?.shiprocket;
  if (!creds?.email || !creds?.password)
    throw new HttpsError("failed-precondition", "ShipRocket credentials not configured in Admin → Shipping");
  try {
    const res = await axios.post(`${SR_BASE}/auth/login`, { email: creds.email, password: creds.password });
    _srToken   = res.data.token;
    _srTokenAt = Date.now();
    return _srToken;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new HttpsError("unauthenticated", `ShipRocket login failed: ${msg} (check email/password in Admin → Shipping)`);
  }
}
const RZP_WH_SECRET   = defineSecret("RAZORPAY_WEBHOOK_SECRET");

// ── Create Razorpay order ───────────────────────────────────────────────────
exports.createRazorpayOrder = onCall(
  { secrets: [RZP_KEY_ID, RZP_KEY_SECRET] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const rzp = new Razorpay({
      key_id:     RZP_KEY_ID.value(),
      key_secret: RZP_KEY_SECRET.value(),
    });

    const order = await rzp.orders.create({
      amount:   Math.round(request.data.amount * 100),
      currency: "INR",
      receipt:  request.data.receipt || `rcpt_${Date.now()}`,
      notes:    { purpose: request.data.purpose || "payment", uid: request.auth.uid },
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency };
  }
);

// ── Verify payment signature after checkout ─────────────────────────────────
exports.verifyRazorpayPayment = onCall(
  { secrets: [RZP_KEY_SECRET] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data;

    const expected = crypto
      .createHmac("sha256", RZP_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      throw new HttpsError("invalid-argument", "Signature mismatch");

    await admin.firestore().collection("payments").add({
      uid:       request.auth.uid,
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount:    request.data.amount,
      purpose:   request.data.purpose,
      status:    "captured",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, paymentId: razorpay_payment_id };
  }
);

// ── Process refund (cancel order / return completed) ───────────────────────
exports.processRefund = onCall(
  { secrets: [RZP_KEY_ID, RZP_KEY_SECRET] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const { paymentId, amount } = request.data;
    if (!paymentId)
      throw new HttpsError("invalid-argument", "paymentId is required");

    const rzp = new Razorpay({
      key_id:     RZP_KEY_ID.value(),
      key_secret: RZP_KEY_SECRET.value(),
    });

    const refund = await rzp.payments.refund(paymentId, {
      ...(amount ? { amount: Math.round(amount * 100) } : {}),
    });

    await admin.firestore().collection("refunds").add({
      uid:       request.auth.uid,
      paymentId,
      refundId:  refund.id,
      amount:    refund.amount / 100,
      status:    refund.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { refundId: refund.id, amount: refund.amount / 100, status: refund.status };
  }
);

// ── Webhook handler (HTTP endpoint) ────────────────────────────────────────
exports.razorpayWebhook = onRequest(
  { secrets: [RZP_WH_SECRET] },
  async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", RZP_WH_SECRET.value())
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expected !== signature)
      return res.status(400).send("Invalid signature");

    const event   = req.body;
    const payment = event.payload?.payment?.entity;

    if (event.event === "payment.captured") {
      const snap = await admin.firestore().collection("payments")
        .where("paymentId", "==", payment.id).get();
      if (!snap.empty) await snap.docs[0].ref.update({ status: "captured" });

    } else if (event.event === "payment.failed") {
      await admin.firestore().collection("payments").add({
        paymentId: payment.id,
        status:    "failed",
        error:     payment.error_description || "Unknown",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    } else if (event.event === "refund.processed") {
      const refund = event.payload?.refund?.entity;
      await admin.firestore().collection("refunds").add({
        paymentId: refund.payment_id,
        refundId:  refund.id,
        amount:    refund.amount / 100,
        status:    "processed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ received: true });
  }
);

// ── Shared: build ShipRocket order payload ───────────────────────────────────
async function buildSRPayload(orderId, order) {
  const settingsSnap = await admin.firestore().doc("settings/shipping").get();
  const channelId    = settingsSnap.data()?.carriers?.shiprocket?.channelId || "";
  const addr = order.addr || {};

  // ShipRocket requires exactly 10-digit phone and 6-digit pincode
  const phone   = (addr.phone || order.phone || "").replace(/\D/g, "").slice(-10);
  const pincode = (addr.pin || addr.pincode || addr.zip || "").replace(/\D/g, "");

  return {
    order_id:              orderId,
    order_date:            new Date().toISOString().slice(0, 10),
    ...(channelId ? { channel_id: channelId } : {}),
    billing_customer_name: addr.name || order.billingName || "",
    billing_last_name:     "",
    billing_address:       addr.line1 || addr.address || "",
    billing_address_2:     addr.line2 || "",
    billing_city:          addr.city || "",
    billing_pincode:       pincode,
    billing_state:         addr.state || "",
    billing_country:       "India",
    billing_email:         order.userEmail || addr.email || "",
    billing_phone:         phone,
    shipping_is_billing:   true,
    order_items: (order.items || []).map(item => ({
      name:          item.name,
      sku:           item.productId || item.id || "SKU001",
      units:         item.qty || 1,
      selling_price: item.price || 0,
      discount:      0,
      tax:           "",
      hsn:           "",
    })),
    payment_method: order.paymentStatus === "cod" ? "COD" : "Prepaid",
    sub_total:      order.total || 0,
    length: 30, breadth: 20, height: 15, weight: 2,
  };
}

// ── ShipRocket: manually push any existing order to ShipRocket ───────────────
exports.shiprocketPushOrder = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Login required");

  const { orderId } = request.data;
  if (!orderId)
    throw new HttpsError("invalid-argument", "orderId is required");

  const orderRef  = admin.firestore().doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists)
    throw new HttpsError("not-found", "Order not found");

  const order = orderSnap.data();
  const token = await getSRToken();
  const payload = await buildSRPayload(orderId, order);

  let res;
  try {
    res = await axios.post(`${SR_BASE}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  } catch (err) {
    const srMsg = err.response?.data?.message
      || err.response?.data?.errors
      || JSON.stringify(err.response?.data)
      || err.message;
    console.error("ShipRocket API error:", srMsg, "| Payload:", JSON.stringify(payload));
    throw new HttpsError("internal", `ShipRocket: ${srMsg}`);
  }

  const update = {
    shiprocket: {
      orderId:    res.data.order_id    || null,
      shipmentId: res.data.shipment_id || null,
      status:     "created",
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    },
  };
  await orderRef.update(update);
  return update.shiprocket;
});

// ── ShipRocket: assign AWB + generate pickup (called from AdminOrders) ───────
exports.shiprocketAssignAWB = onCall(async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const { shipmentId, orderId } = request.data;
    if (!shipmentId || !orderId)
      throw new HttpsError("invalid-argument", "shipmentId and orderId are required");

    const token = await getSRToken();

    // Assign AWB (auto-selects best courier)
    const awbRes = await axios.post(
      `${SR_BASE}/courier/assign/awb`,
      { shipment_id: [String(shipmentId)] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const awbData = awbRes.data?.response?.data || {};

    // Generate pickup request
    await axios.post(
      `${SR_BASE}/courier/generate/pickup`,
      { shipment_id: [String(shipmentId)] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const awb         = awbData.awb_code    || "";
    const courierName = awbData.courier_name || "";
    const trackingUrl = awb ? `https://shiprocket.co/tracking/${awb}` : "";

    await admin.firestore().doc(`orders/${orderId}`).update({
      "shiprocket.awb":          awb,
      "shiprocket.courierName":  courierName,
      "shiprocket.trackingUrl":  trackingUrl,
      "shiprocket.status":       "ready_to_ship",
    });

    return { awb, courierName, trackingUrl };
  }
);

// ── ShipRocket: track order by AWB ──────────────────────────────────────────
exports.shiprocketTrack = onCall(async (request) => {
    const { awb } = request.data;
    if (!awb) throw new HttpsError("invalid-argument", "awb is required");

    const token = await getSRToken();
    const res = await axios.get(`${SR_BASE}/courier/track/awb/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }
);

// ── Pincode lookup – Mumbai region so India Post API isn't geo-blocked ────────
exports.lookupPincode = onCall(
  { region: "asia-south1" },
  async (request) => {
    const { pin } = request.data || {};
    if (!pin || !/^\d{6}$/.test(pin))
      throw new HttpsError("invalid-argument", "6-digit PIN required");
    try {
      const res  = await axios.get(`https://api.postalpincode.in/pincode/${pin}`, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        timeout: 10000,
      });
      const data = res.data;
      if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        return { found: true, district: po.District || po.Name || "", state: po.State || "" };
      }
      return { found: false };
    } catch (err) {
      const msg = err.response?.data || err.message || "API unreachable";
      console.error("PIN lookup error:", msg);
      throw new HttpsError("unavailable", String(msg));
    }
  }
);

// ── ShipRocket status mapping (mirrors frontend SR_MAP) ─────────────────────
const SR_STATUS_MAP = {
  "PICKUP PENDING":   "Processing",
  "PICKUP QUEUED":    "Processing",
  "MANIFESTED":       "Processing",
  "PLACED":           "Processing",
  "NEW":              "Processing",
  "IN TRANSIT":       "Shipped",
  "TRANSIT":          "Shipped",
  "OUT FOR DELIVERY": "Shipped",
  "SHIPPED":          "Shipped",
  "DELIVERED":        "Delivered",
  "RTO INITIATED":    "Cancelled",
  "RTO DELIVERED":    "Cancelled",
  "CANCELLED":        "Cancelled",
  "LOST":             "Cancelled",
};
function mapSRStatus(s = "") {
  const up = s.toUpperCase();
  for (const [key, val] of Object.entries(SR_STATUS_MAP)) {
    if (up.includes(key)) return val;
  }
  return null;
}

// ── Shared: push status-changed notification ──────────────────────────────────
function pushStatusNotif(db, order, mappedStatus) {
  if (!order.userId) return;
  const msgs = {
    Shipped:    `Your order ${order.id} has been shipped and is on its way!`,
    Delivered:  `Your order ${order.id} has been delivered. Thank you for shopping with us!`,
    Cancelled:  `Your order ${order.id} has been cancelled. Contact support if you have questions.`,
    Processing: `Your order ${order.id} is now being processed.`,
  };
  db.collection("notifications").add({
    userId:    order.userId,
    type:      "order",
    title:     `Order ${mappedStatus}`,
    message:   msgs[mappedStatus] || `Your order ${order.id} status changed to ${mappedStatus}.`,
    link:      "orders",
    orderId:   order.id,
    read:      false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {});
}

// ── Shared: sync by AWB (orders that have AWB assigned) ──────────────────────
async function syncOneOrder(docId, order) {
  const awb = order.shiprocket?.awb;
  if (!awb) return;
  const db = admin.firestore();
  try {
    const token = await getSRToken();
    const res   = await axios.get(`${SR_BASE}/courier/track/awb/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const track    = res.data?.tracking_data?.shipment_track?.[0];
    const srStatus = track?.current_status || "";
    if (!srStatus) return;

    const mappedStatus = mapSRStatus(srStatus);
    const updates = {
      "shiprocket.status":       srStatus,
      "shiprocket.lastSyncedAt": admin.firestore.FieldValue.serverTimestamp(),
    };
    if (mappedStatus && mappedStatus !== order.status) {
      updates.status = mappedStatus;
      pushStatusNotif(db, order, mappedStatus);
    }
    await db.doc(`orders/${docId}`).update(updates);
  } catch (err) {
    console.error(`syncOneOrder (AWB) failed for ${docId}:`, err.message);
  }
}

// ── Shared: sync by SR Order ID (orders pushed but no AWB yet — e.g. cancelled)
const SR_ORDER_STATUS_MAP = {
  "CANCELED":        "Cancelled",
  "CANCELLED":       "Cancelled",
  "RETURN":          "Cancelled",
  "LOST":            "Cancelled",
  "NEW":             "Processing",
  "READY TO SHIP":   "Processing",
  "PICKUP PENDING":  "Processing",
  "IN TRANSIT":      "Shipped",
  "OUT FOR DELIVERY":"Shipped",
  "DELIVERED":       "Delivered",
};
async function syncOrderById(docId, order) {
  const srOrderId = order.shiprocket?.orderId;
  if (!srOrderId) return;
  const db = admin.firestore();
  try {
    const token = await getSRToken();
    const res   = await axios.get(`${SR_BASE}/orders/show/${srOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const srStatus = res.data?.data?.status || "";
    if (!srStatus) return;

    const up = srStatus.toUpperCase();
    const mappedStatus = Object.entries(SR_ORDER_STATUS_MAP).find(([k]) => up.includes(k))?.[1] || null;
    const updates = {
      "shiprocket.status":       srStatus,
      "shiprocket.lastSyncedAt": admin.firestore.FieldValue.serverTimestamp(),
    };
    if (mappedStatus && mappedStatus !== order.status) {
      updates.status = mappedStatus;
      pushStatusNotif(db, order, mappedStatus);
    }
    await db.doc(`orders/${docId}`).update(updates);
  } catch (err) {
    console.error(`syncOrderById failed for ${docId}:`, err.message);
  }
}

// ── Shared: route to correct sync method based on what's available ────────────
function syncAny(docId, order) {
  return order.shiprocket?.awb
    ? syncOneOrder(docId, order)
    : syncOrderById(docId, order);
}

// ── Scheduled: auto-sync every 30 min for all active orders with SR data ──────
exports.syncShiprocketStatuses = onSchedule("every 30 minutes", async () => {
  const db   = admin.firestore();
  const snap = await db.collection("orders")
    .where("shiprocket.shipmentId", "!=", null)
    .get();

  const active = snap.docs.filter(d => {
    const s = d.data().status;
    return s !== "Delivered" && s !== "Cancelled";
  });

  console.log(`Auto-syncing ${active.length} active ShipRocket orders`);
  await Promise.allSettled(active.map(d => syncAny(d.id, d.data())));
});

// ── Callable: on-demand sync for all active orders (triggered by admin UI) ────
exports.syncShiprocketNow = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");
  const db   = admin.firestore();
  const snap = await db.collection("orders")
    .where("shiprocket.shipmentId", "!=", null)
    .get();

  const active = snap.docs.filter(d => {
    const s = d.data().status;
    return s !== "Delivered" && s !== "Cancelled";
  });

  await Promise.allSettled(active.map(d => syncAny(d.id, d.data())));
  return { synced: active.length };
});

// ── Firestore trigger: sync immediately when order is pushed to SR or AWB set ─
exports.onShiprocketUpdated = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  const shipmentAdded = !before?.shiprocket?.shipmentId && after?.shiprocket?.shipmentId;
  const awbAdded      = !before?.shiprocket?.awb        && after?.shiprocket?.awb;
  if (shipmentAdded || awbAdded) {
    await syncAny(event.params.orderId, after);
  }
});

// ── ShipRocket: test credentials (called from AdminShipping) ─────────────────
exports.shiprocketTestLogin = onCall(async (request) => {
  const { email, password } = request.data || {};
  if (!email || !password)
    throw new HttpsError("invalid-argument", "email and password are required");
  try {
    const res = await axios.post(`${SR_BASE}/auth/login`, { email, password });
    return { success: true, token: !!res.data.token };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new HttpsError("unauthenticated", msg);
  }
});
