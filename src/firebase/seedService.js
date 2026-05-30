import { db } from "./config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { PRODUCTS } from "../data/products";

export const seedProducts = async () => {
  const col = collection(db, "products");
  const existing = await getDocs(col);
  if (existing.size > 0) return { alreadySeeded: true, count: existing.size };
  for (const p of PRODUCTS) {
    await addDoc(col, p);
  }
  return { seeded: PRODUCTS.length };
};
