import { sendConfirmationEmail } from "./otpService";
import { createNotif } from "./notifService";

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const sendEmail = (email, title, message) =>
  sendConfirmationEmail(email, title, message).catch(() => {});

const sendAdminEmail = (title, message) => {
  if (ADMIN_EMAIL) sendEmail(ADMIN_EMAIL, title, message);
};

const pushNotif = (userId, type, title, message, link = null, extra = {}) => {
  if (!userId) return;
  createNotif({ userId, type, title, message, link, ...extra }).catch(() => {});
};

// ── Order placed ──────────────────────────────────────────────────────────────
const buildInvoiceText = (order) => {
  const subtotal   = (order.items || []).reduce((s, i) => s + i.price * i.qty, 0);
  const couponRows = order.coupons?.length
    ? order.coupons
    : (order.coupon ? [{ code: order.coupon.code, discount: order.coupon.discount }] : []);
  const discount   = couponRows.reduce((s, c) => s + (c.discount || 0), 0);
  const taxable    = subtotal - discount;
  const exclTax    = order.tax && !order.tax.inclusive ? (order.tax.amount || 0) : 0;
  const inclTax    = order.tax &&  order.tax.inclusive ? (order.tax.amount || 0) : 0;
  const shippingFee = order.total - taxable - exclTax;

  const lines = (order.items || [])
    .map(i => {
      const opt = [i.selSize, i.selColor].filter(Boolean).join(" / ");
      return `  • ${i.name}${opt ? ` (${opt})` : ""}\n    ${i.qty} × ${fmt(i.price)} = ${fmt(i.price * i.qty)}`;
    })
    .join("\n");

  const totals = [
    `  Subtotal: ${fmt(subtotal)}`,
    ...couponRows.filter(c => (c.discount || 0) > 0).map(c => `  Coupon (${c.code}): − ${fmt(c.discount)}`),
    exclTax > 0 ? `  ${order.tax.label} (${order.tax.rate}%): + ${fmt(exclTax)}` : null,
    `  Shipping (${order.ship === "express" ? "Express" : "Standard"}): ${shippingFee <= 0 ? "Free" : fmt(shippingFee)}`,
    `  ─────────────────────────`,
    `  Total: ${fmt(order.total)}`,
    inclTax > 0 ? `  (incl. ${order.tax.label} ${order.tax.rate}%: ${fmt(inclTax)})` : null,
  ].filter(Boolean).join("\n");

  const a = order.addr || {};
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const invoiceLink = origin ? `${origin}/track?id=${order.id}` : "";

  return (
`Hi ${a.name || "there"},

Thank you for your order! 🎉 Here is your invoice.

INVOICE  ·  ${order.id}
Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}

Items:
${lines}

${totals}

Bill / Ship to:
  ${a.name}
  ${a.line1}
  ${a.city}, ${a.state} – ${a.pin}
  ${a.phone}

Shipping: ${order.ship === "express" ? "Express (2–3 business days)" : "Standard (5–7 business days)"}
Payment: ${order.paymentStatus === "paid" ? "Paid online" : order.paymentStatus === "wallet" ? "Paid via wallet" : "Cash on delivery"}
${order.walletApplied ? `Wallet applied: ${fmt(order.walletApplied)}\n` : ""}${invoiceLink ? `\nView or download your invoice anytime:\n${invoiceLink}\n(or from your account → Orders)\n` : ""}
We'll send you an update once it ships.

— Telugu Seemalo`
  );
};

export const notifyOrderPlaced = (order) => {
  sendEmail(
    order.userEmail,
    `Invoice & Order Confirmation – ${order.id}`,
    buildInvoiceText(order)
  );
  sendAdminEmail(
    `New Order – ${order.id}`,
    `New order received!\n\nOrder ID: ${order.id}\nCustomer: ${order.addr?.name}\nEmail: ${order.userEmail}\nPhone: ${order.addr?.phone}\nCity: ${order.addr?.city}, ${order.addr?.state}\nItems: ${order.items?.length}\nTotal: ${fmt(order.total)}`
  );
  pushNotif(
    order.userId, "order",
    `Order Confirmed – ${order.id}`,
    `Your order for ${order.items?.length || 1} item(s) totalling ${fmt(order.total)} has been placed. We'll notify you when it ships.`,
    "orders"
  );
};

// ── Order status changed (admin updates) ─────────────────────────────────────
export const notifyOrderStatusChanged = (order) => {
  if (!order.userEmail) return;
  const emailMsgs = {
    Shipped:    `Your order ${order.id} has been shipped! 🚚\n\nExpected delivery: ${order.ship === "express" ? "2–3" : "5–7"} business days.${order.tracking ? `\nTracking number: ${order.tracking}` : ""}\n\nTrack from your profile page.`,
    Delivered:  `Your order ${order.id} has been delivered! 📦\n\nWe hope you love your purchase. Request a return from your profile if needed.`,
    Cancelled:  `Your order ${order.id} has been cancelled.\n\nIf you didn't request this, please contact us.`,
    Processing: `Your order ${order.id} is now being processed. We'll notify you once it ships.`,
  };
  const notifMsgs = {
    Shipped:    `Order ${order.id} shipped! Expected in ${order.ship === "express" ? "2–3" : "5–7"} days.${order.tracking ? ` Tracking: ${order.tracking}` : ""}`,
    Delivered:  `Order ${order.id} delivered! We hope you love your purchase. 🎉`,
    Cancelled:  `Order ${order.id} has been cancelled.`,
    Processing: `Order ${order.id} is being processed and will ship soon.`,
  };
  if (emailMsgs[order.status]) sendEmail(order.userEmail, `Order ${order.status} – ${order.id}`, emailMsgs[order.status]);
  if (notifMsgs[order.status]) pushNotif(order.userId, "order", `Order ${order.status} – ${order.id}`, notifMsgs[order.status], "orders");
};

// ── Order cancelled by customer ───────────────────────────────────────────────
export const notifyOrderCancelled = (order, customerEmail) => {
  sendEmail(
    customerEmail,
    `Order Cancelled – ${order.id}`,
    `Your order ${order.id} has been successfully cancelled.\n\nIf you did not request this, please contact us immediately.`
  );
  sendAdminEmail(
    `Order Cancelled by Customer – ${order.id}`,
    `Order ${order.id} cancelled by customer.\n\nEmail: ${customerEmail}\nTotal: ${fmt(order.total)}`
  );
  pushNotif(order.userId, "order", `Order Cancelled – ${order.id}`, `Your order ${order.id} has been cancelled as requested.`, "orders");
};

// ── Return / Exchange submitted ───────────────────────────────────────────────
export const notifyReturnRequested = (request) => {
  const items = (request.items || []).map(i => `  • ${i.name} × ${i.qty}`).join("\n");
  sendEmail(
    request.userEmail,
    `${request.type} Request Received – Order ${request.orderId}`,
    `Hi ${request.userName},\n\nWe've received your ${request.type.toLowerCase()} request for order ${request.orderId}.\n\nItems:\n${items}\nReason: ${request.reason}\n\nOur team will review it within 2–3 business days.`
  );
  sendAdminEmail(
    `${request.type} Request – Order ${request.orderId}`,
    `${request.type} request submitted.\n\nOrder: ${request.orderId}\nCustomer: ${request.userName} (${request.userEmail})\nReason: ${request.reason}\nItems: ${request.items?.length}`
  );
  pushNotif(
    request.userId,
    request.type === "Exchange" ? "exchange" : "refund",
    `${request.type} Request Received – ${request.orderId}`,
    `Your ${request.type.toLowerCase()} request has been submitted. We'll review it within 2–3 business days.`,
    "orders"
  );
};

// ── Return / Exchange status updated by admin ─────────────────────────────────
export const notifyReturnStatusChanged = (request) => {
  if (!request.userEmail) return;
  const label = {
    Approved:  "approved ✅",
    Rejected:  "rejected ❌",
    Completed: "completed 🎉",
    Pending:   "pending review ⏳",
  };
  sendEmail(
    request.userEmail,
    `${request.type} Request ${label[request.status] || "Updated"} – Order ${request.orderId}`,
    `Hi ${request.userName},\n\nYour ${request.type.toLowerCase()} request for order ${request.orderId} has been ${label[request.status] || "updated"}.\n\n${request.adminNotes ? `Message from us:\n${request.adminNotes}\n` : ""}Contact us if you have questions.`
  );
  pushNotif(
    request.userId,
    request.type === "Exchange" ? "exchange" : "refund",
    `${request.type} ${label[request.status] || "Updated"} – ${request.orderId}`,
    `Your ${request.type.toLowerCase()} for order ${request.orderId} has been ${label[request.status] || "updated"}.${request.adminNotes ? ` Note: ${request.adminNotes}` : ""}`,
    "orders"
  );
};

// ── Payment confirmed ─────────────────────────────────────────────────────────
export const notifyPaymentConfirmed = (userId, userEmail, orderId, amount) => {
  sendEmail(
    userEmail,
    `Payment Confirmed – ${orderId}`,
    `Your payment of ${fmt(amount)} for order ${orderId} has been confirmed. Thank you!`
  );
  pushNotif(userId, "payment", `Payment Confirmed – ${orderId}`, `Your payment of ${fmt(amount)} has been received. Order ${orderId} is confirmed.`, "orders");
};
