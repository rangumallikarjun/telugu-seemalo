import { db } from "./config";
import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, limit, runTransaction,
  serverTimestamp, increment,
} from "firebase/firestore";

const USERS = "users";
const TXNS  = "walletTransactions";

// Real-time wallet balance (from users/{uid}.walletBalance)
export const subscribeWalletBalance = (uid, cb) =>
  onSnapshot(doc(db, USERS, uid), snap =>
    cb(snap.exists() ? (snap.data().walletBalance || 0) : 0)
  );

// Real-time transaction history — no orderBy to avoid composite index requirement
export const subscribeWalletTxns = (uid, cb) =>
  onSnapshot(
    query(collection(db, TXNS), where("userId", "==", uid), limit(50)),
    snap => {
      const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      txns.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return tb - ta;
      });
      cb(txns);
    }
  );

// Add money — server-side atomic increment (safe for concurrent calls)
export const creditWallet = async (uid, amount, description, meta = {}) => {
  await updateDoc(doc(db, USERS, uid), { walletBalance: increment(amount) });
  return addDoc(collection(db, TXNS), {
    userId: uid, type: "credit", amount, description,
    createdAt: serverTimestamp(), ...meta,
  });
};

// Deduct money — transaction ensures balance never goes negative
export const debitWallet = (uid, amount, description, meta = {}) =>
  runTransaction(db, async txn => {
    const ref  = doc(db, USERS, uid);
    const snap = await txn.get(ref);
    const bal  = snap.data()?.walletBalance || 0;
    if (bal < amount) throw new Error("Insufficient wallet balance");
    txn.update(ref, { walletBalance: increment(-amount) });
  }).then(() =>
    addDoc(collection(db, TXNS), {
      userId: uid, type: "debit", amount, description,
      createdAt: serverTimestamp(), ...meta,
    })
  );

// Customer self-top-up (simulated — no real payment gateway)
export const rechargeWallet = (uid, amount) =>
  creditWallet(uid, amount, `Wallet recharge of ₹${amount}`, { source: "recharge" });
