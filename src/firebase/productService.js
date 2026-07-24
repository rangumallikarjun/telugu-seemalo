import { db } from "./config";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";

const col = () => collection(db, "products");

export const getProducts = async () => {
  const snap = await getDocs(query(col(), orderBy("id")));
  const list = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
  // Admin-set sortOrder takes priority; products without one fall back to id (creation order)
  list.sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
  return list;
};

export const addProduct = async (product) => {
  const ref = await addDoc(col(), product);
  return ref.id;
};

export const updateProduct = async (docId, data) => {
  await updateDoc(doc(db, "products", docId), data);
};

export const deleteProduct = async (docId) => {
  await deleteDoc(doc(db, "products", docId));
};
