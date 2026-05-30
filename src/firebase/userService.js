import { db } from "./config";
import {
  collection, getDocs, doc, setDoc, getDoc,
  updateDoc, query, orderBy,
} from "firebase/firestore";

export const createUserDoc = async (uid, { name, email }) => {
  await setDoc(doc(db, "users", uid), {
    name,
    email,
    role: "customer",
    createdAt: new Date().toISOString(),
  });
};

export const getUserDoc = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const getAllUsers = async () => {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ ...d.data(), uid: d.id }));
};

export const updateUserRole = async (uid, role) => {
  await updateDoc(doc(db, "users", uid), { role });
};
