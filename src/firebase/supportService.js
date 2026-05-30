import {
  collection, addDoc, doc, updateDoc,
  onSnapshot, query, orderBy, where,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "./config";

const COL = "supportTickets";

const genTicketId = () => {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TS-${date}-${rand}`;
};

export const createTicket = (data) =>
  addDoc(collection(db, COL), {
    ...data,
    ticketId: genTicketId(),
    status: "open",
    priority: "normal",
    replies: [],
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const subscribeTickets = (callback) =>
  onSnapshot(
    query(collection(db, COL), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );

// Customer-facing: real-time feed of their own tickets (no orderBy to avoid composite index requirement)
export const subscribeUserTickets = (uid, callback) =>
  onSnapshot(
    query(collection(db, COL), where("uid", "==", uid)),
    (snap) => {
      const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      tickets.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return tb - ta;
      });
      callback(tickets);
    },
    (err) => console.error("subscribeUserTickets:", err)
  );

export const updateTicket = (id, data) =>
  updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });

// Real-time listener for a single ticket document (for the open chat view)
export const subscribeTicket = (id, cb) =>
  onSnapshot(doc(db, COL, id), snap => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() });
  });

// read: admin has seen the ticket (true = admin replied, false = customer replied and admin hasn't seen it)
// customerRead: customer has seen the latest admin reply (true = customer viewed, false = new admin reply unseen)
export const addReply = (id, reply) =>
  updateDoc(doc(db, COL, id), {
    replies:      arrayUnion(reply),
    updatedAt:    serverTimestamp(),
    read:         reply.from === "admin",
    customerRead: reply.from !== "admin",
  });

export const markCustomerRead = (id) =>
  updateDoc(doc(db, COL, id), { customerRead: true }).catch(() => {});
