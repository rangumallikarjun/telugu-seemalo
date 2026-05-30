import { db } from "./config";
import {
  collection, addDoc, getDocs, getDoc,
  deleteDoc, doc, query, where, serverTimestamp,
} from "firebase/firestore";

const COL = "roomDesigns";

export const saveDesign = async (uid, { name, items }) => {
  const ref = await addDoc(collection(db, COL), {
    userId:    uid || null,
    name,
    items,
    isPublic:  true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserDesigns = async (uid) => {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, COL), where("userId", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toDate?.() || new Date(0);
      const tb = b.createdAt?.toDate?.() || new Date(0);
      return tb - ta;
    });
};

export const getDesign = async (designId) => {
  const snap = await getDoc(doc(db, COL, designId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const deleteDesign = async (designId) => {
  await deleteDoc(doc(db, COL, designId));
};
