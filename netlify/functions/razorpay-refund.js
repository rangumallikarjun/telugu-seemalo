// Refund a Razorpay payment. Allowed for an admin, or for the customer who
// owns the order that payment belongs to (used by "cancel my order").
const { db } = require("./_firebase");
const { json, readBody, verifyCaller } = require("./_util");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  const caller = await verifyCaller(event);
  if (!caller) return json(401, { error: "Sign in required" });

  const { paymentId, amount } = readBody(event);
  if (!paymentId) return json(400, { error: "paymentId is required" });

  // Ownership check for non-admins
  if (!caller.isAdmin) {
    const q = await db.collection("orders").where("razorpayPaymentId", "==", paymentId).limit(1).get();
    const owns = !q.empty && q.docs[0].data().userId === caller.uid;
    if (!owns) return json(403, { error: "Not allowed to refund this payment" });
  }

  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return json(500, { error: "Razorpay keys not configured on server" });

  let data, res;
  try {
    res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(amount ? { amount: Math.round(amount * 100) } : {}),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) {
    return json(502, { error: err.message });
  }
  if (!res.ok) return json(502, { error: data.error?.description || "Refund failed" });

  await db.collection("refunds").add({
    paymentId,
    refundId: data.id,
    amount: (data.amount || 0) / 100,
    status: data.status,
    by: caller.isAdmin ? "admin" : "customer",
    uid: caller.uid,
    createdAt: new Date(),
  }).catch(() => {});

  return json(200, { refundId: data.id, amount: (data.amount || 0) / 100, status: data.status });
};
