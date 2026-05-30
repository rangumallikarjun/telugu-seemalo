import { db } from "./config";
import {
  collection, addDoc, getDocs, updateDoc,
  doc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

const col = () => collection(db, "returns");

export const createReturnRequest = async (data) => {
  const ref = await addDoc(col(), {
    ...data,
    status: "Pending",
    adminNotes: "",
    requestedAt: serverTimestamp(),
    resolvedAt: null,
  });
  return ref.id;
};

export const getReturnRequests = async () => {
  const snap = await getDocs(query(col(), orderBy("requestedAt", "desc")));
  return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
};

export const getReturnsByUser = async (userId) => {
  const snap = await getDocs(query(col(), where("userId", "==", userId)));
  return snap.docs
    .map(d => ({ ...d.data(), docId: d.id }))
    .sort((a, b) => {
      const ta = a.requestedAt?.toDate?.() ?? new Date(0);
      const tb = b.requestedAt?.toDate?.() ?? new Date(0);
      return tb - ta;
    });
};

export const getReturnByOrderDocId = async (orderDocId) => {
  const snap = await getDocs(query(col(), where("orderDocId", "==", orderDocId)));
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), docId: snap.docs[0].id };
};

export const updateReturnStatus = async (docId, status, adminNotes = "") => {
  await updateDoc(doc(db, "returns", docId), {
    status,
    adminNotes,
    resolvedAt: status === "Pending" ? null : serverTimestamp(),
  });
};
