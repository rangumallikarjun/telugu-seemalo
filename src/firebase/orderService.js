import { db } from "./config";
import {
  collection, addDoc, getDocs, updateDoc,
  doc, query, orderBy, where, serverTimestamp,
  onSnapshot, limit,
} from "firebase/firestore";

const col = () => collection(db, "orders");

export const createOrder = async (orderData) => {
  const ref = await addDoc(col(), {
    ...orderData,
    status: "Processing",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getOrders = async () => {
  const snap = await getDocs(query(col(), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
};

export const subscribeOrders = (cb) => {
  const q = query(col(), limit(500));
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
    orders.sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0);
      const tb = b.createdAt?.toDate?.() || new Date(0);
      return tb - ta;
    });
    cb(orders);
  });
};

export const updateOrderStatus = async (docId, status) => {
  await updateDoc(doc(db, "orders", docId), { status });
};

export const patchOrder = async (docId, fields) => {
  await updateDoc(doc(db, "orders", docId), fields);
};

export const getOrdersByUser = async (userId, userEmail) => {
  const queries = [getDocs(query(col(), where("userId", "==", userId)))];
  if (userEmail) queries.push(getDocs(query(col(), where("userEmail", "==", userEmail))));
  const snaps = await Promise.all(queries);
  const seen = new Set();
  const orders = [];
  snaps.flatMap(s => s.docs).forEach(d => {
    if (!seen.has(d.id)) { seen.add(d.id); orders.push({ ...d.data(), docId: d.id }); }
  });
  return orders.sort((a, b) => {
    const ta = a.createdAt?.toDate?.() ?? new Date(0);
    const tb = b.createdAt?.toDate?.() ?? new Date(0);
    return tb - ta;
  });
};

export const subscribeOrdersByUser = (userId, userEmail, cb) => {
  const seen = new Map();
  const notify = () => {
    const orders = Array.from(seen.values()).sort((a, b) => {
      const ta = a.createdAt?.toDate?.() ?? new Date(0);
      const tb = b.createdAt?.toDate?.() ?? new Date(0);
      return tb - ta;
    });
    cb(orders);
  };
  const unsub1 = onSnapshot(query(col(), where("userId", "==", userId)), snap => {
    snap.docs.forEach(d => seen.set(d.id, { ...d.data(), docId: d.id }));
    notify();
  });
  const unsubs = [unsub1];
  if (userEmail) {
    const unsub2 = onSnapshot(query(col(), where("userEmail", "==", userEmail)), snap => {
      snap.docs.forEach(d => seen.set(d.id, { ...d.data(), docId: d.id }));
      notify();
    });
    unsubs.push(unsub2);
  }
  return () => unsubs.forEach(u => u());
};

export const claimGuestOrders = async (userId, email) => {
  if (!userId || !email) return;
  const snap = await getDocs(query(col(), where("userEmail", "==", email), where("userId", "==", null)));
  if (snap.empty) return;
  await Promise.all(snap.docs.map(d => updateDoc(doc(db, "orders", d.id), { userId })));
};

export const getOrderById = async (orderId) => {
  const snap = await getDocs(query(col(), where("id", "==", orderId.trim().toUpperCase())));
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), docId: snap.docs[0].id };
};

export const updateOrderTracking = async (docId, tracking) => {
  await updateDoc(doc(db, "orders", docId), { tracking });
};

export const cancelOrder = async (docId) => {
  await updateDoc(doc(db, "orders", docId), {
    status: "Cancelled",
    cancelledAt: serverTimestamp(),
  });
};

export const updateOrderReturnStatus = async (orderDocId, returnStatus, returnType = null) => {
  const updates = { returnStatus };
  if (returnType) updates.returnType = returnType;
  await updateDoc(doc(db, "orders", orderDocId), updates);
};
