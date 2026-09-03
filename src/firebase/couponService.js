import { db } from "./config";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, increment,
} from "firebase/firestore";

const col    = () => collection(db, "coupons");
const redCol = () => collection(db, "couponRedemptions");

const normEmail = (e) => (e || "").trim().toLowerCase();
const normPhone = (p) => (p || "").replace(/\D/g, "").slice(-10);

// Has this customer (by email OR phone) already redeemed this code?
// Fails open (returns false) if the lookup itself errors — never block a sale.
export const hasCustomerUsedCoupon = async (code, email, phone) => {
  const c = (code || "").trim().toUpperCase();
  const e = normEmail(email), p = normPhone(phone);
  if (!c || (!e && !p)) return false;
  try {
    const snap = await getDocs(query(redCol(), where("code", "==", c)));
    return snap.docs.some(d => {
      const r = d.data();
      return (e && r.email === e) || (p && r.phone === p);
    });
  } catch {
    return false;
  }
};

// Record a redemption once the order is placed (only for one-per-customer coupons)
export const recordCouponRedemption = async (coupon, { email, phone, userId, orderId } = {}) => {
  if (!coupon?.oncePerCustomer) return;
  try {
    await addDoc(redCol(), {
      code:     (coupon.code || "").trim().toUpperCase(),
      couponId: coupon.docId || null,
      email:    normEmail(email),
      phone:    normPhone(phone),
      userId:   userId || null,
      orderId:  orderId || null,
      at:       serverTimestamp(),
    });
  } catch { /* non-fatal */ }
};

export const getCoupons = async () => {
  const snap = await getDocs(col());
  return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
};

export const addCoupon = async (data) => {
  await addDoc(col(), { ...data, usedCount: 0, createdAt: serverTimestamp() });
};

export const updateCoupon = async (docId, data) => {
  await updateDoc(doc(db, "coupons", docId), data);
};

export const deleteCoupon = async (docId) => {
  await deleteDoc(doc(db, "coupons", docId));
};

export const toggleCoupon = async (docId, isActive) => {
  await updateDoc(doc(db, "coupons", docId), { isActive });
};

export const applyCouponUsage = async (docId) => {
  await updateDoc(doc(db, "coupons", docId), { usedCount: increment(1) });
};

export const validateCoupon = async (code, orderTotal, customer = {}) => {
  if (!code?.trim()) return { valid: false, error: "Enter a coupon code." };

  const snap = await getDocs(query(col(), where("code", "==", code.trim().toUpperCase())));
  if (snap.empty) return { valid: false, error: "Invalid coupon code." };

  const coupon = { ...snap.docs[0].data(), docId: snap.docs[0].id };

  if (!coupon.isActive) return { valid: false, error: "This coupon is no longer active." };

  if (coupon.expiresAt) {
    const exp = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
    if (exp < new Date()) return { valid: false, error: "This coupon has expired." };
  }

  if (coupon.minOrder && orderTotal < coupon.minOrder)
    return { valid: false, error: `Minimum order of ₹${coupon.minOrder} required for this coupon.` };

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    return { valid: false, error: "This coupon has reached its usage limit." };

  if (coupon.oncePerCustomer &&
      await hasCustomerUsedCoupon(coupon.code, customer.email, customer.phone))
    return { valid: false, error: "You've already used this coupon." };

  return { valid: true, coupon };
};

export const getPublicCoupons = async (orderTotal, customer = {}) => {
  const snap = await getDocs(query(col(), where("showToCustomers", "==", true), where("isActive", "==", true)));
  const now = new Date();
  const list = snap.docs
    .map(d => ({ ...d.data(), docId: d.id }))
    .filter(c => {
      if (c.expiresAt) {
        const exp = c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
        if (exp < now) return false;
      }
      if (c.maxUses && c.usedCount >= c.maxUses) return false;
      return true;
    });

  // Flag one-per-customer coupons this customer has already redeemed
  const oncePer = list.filter(c => c.oncePerCustomer);
  if (oncePer.length && (customer.email || customer.phone)) {
    await Promise.all(oncePer.map(async c => {
      c._alreadyUsed = await hasCustomerUsedCoupon(c.code, customer.email, customer.phone);
    }));
  }
  return list;
};

export const calcDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  let discount = coupon.type === "percent"
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, subtotal);
};

// Stack several coupons: each computed on the original subtotal, then the
// combined total is capped at the subtotal (scaled down proportionally so the
// per-coupon breakdown still adds up).
export const calcStackedDiscounts = (coupons, subtotal) => {
  const breakdown = (coupons || []).map(c => ({
    code:   c.code,
    docId:  c.docId,
    amount: calcDiscount(c, subtotal),
  }));
  let total = breakdown.reduce((s, d) => s + d.amount, 0);
  if (total > subtotal && total > 0) {
    const scale = subtotal / total;
    breakdown.forEach(d => { d.amount = Math.round(d.amount * scale); });
    total = breakdown.reduce((s, d) => s + d.amount, 0);
  }
  return { total: Math.min(total, subtotal), breakdown };
};
