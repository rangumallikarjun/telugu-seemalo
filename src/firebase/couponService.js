import { db } from "./config";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp, increment,
} from "firebase/firestore";

const col = () => collection(db, "coupons");

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

export const validateCoupon = async (code, orderTotal) => {
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

  return { valid: true, coupon };
};

export const getPublicCoupons = async (orderTotal) => {
  const snap = await getDocs(query(col(), where("showToCustomers", "==", true), where("isActive", "==", true)));
  const now = new Date();
  return snap.docs
    .map(d => ({ ...d.data(), docId: d.id }))
    .filter(c => {
      if (c.expiresAt) {
        const exp = c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
        if (exp < now) return false;
      }
      if (c.maxUses && c.usedCount >= c.maxUses) return false;
      return true;
    });
};

export const calcDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  let discount = coupon.type === "percent"
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return Math.min(discount, subtotal);
};
