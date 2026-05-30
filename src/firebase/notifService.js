import { db } from "./config";
import {
  collection, addDoc, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, deleteDoc,
  serverTimestamp, writeBatch, getDocs, arrayUnion,
} from "firebase/firestore";

const COL = "notifications";

export const createNotif = (data) =>
  addDoc(collection(db, COL), { ...data, read: false, readBy: [], createdAt: serverTimestamp() });

// Whether a notification has been read by this specific user.
// Broadcasts (userId === "all") use a readBy[] array; user-specific ones use read: boolean.
export const isNotifRead = (n, uid) =>
  n.userId === "all" ? (n.readBy || []).includes(uid) : !!n.read;

// Real-time feed for a specific user (their own + "all" broadcasts)
// No orderBy so no composite index is required — sorted client-side
export const subscribeUserNotifs = (uid, cb) => {
  const q = query(
    collection(db, COL),
    where("userId", "in", [uid, "all"]),
    limit(100)
  );
  return onSnapshot(
    q,
    snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(n => n.userId !== "all" || !(n.dismissedBy || []).includes(uid));
      list.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return tb - ta;
      });
      cb(list);
    },
    err => console.error("subscribeUserNotifs:", err)
  );
};

export const markRead = (id, uid, isBroadcast) => {
  const update = isBroadcast
    ? updateDoc(doc(db, COL, id), { readBy: arrayUnion(uid) })
    : updateDoc(doc(db, COL, id), { read: true });
  return update.catch(() => {}); // silently ignore deleted-doc race
};

export const markAllRead = async (notifs, uid) => {
  const unread = notifs.filter(n => !isNotifRead(n, uid));
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach(n => {
    if (n.userId === "all") {
      batch.update(doc(db, COL, n.id), { readBy: arrayUnion(uid) });
    } else {
      batch.update(doc(db, COL, n.id), { read: true });
    }
  });
  await batch.commit().catch(() => {});
};

// Admin: hard-delete a notification document entirely.
export const deleteNotif = (id) => deleteDoc(doc(db, COL, id)).catch(() => {});

// Customer: dismiss without deleting the shared document.
// For user-specific notifications: delete the doc.
// For broadcast notifications: add uid to dismissedBy so it's hidden only for this user.
export const dismissNotif = (id, uid, isBroadcast) => {
  if (isBroadcast) {
    return updateDoc(doc(db, COL, id), { dismissedBy: arrayUnion(uid) }).catch(() => {});
  }
  return deleteDoc(doc(db, COL, id)).catch(() => {});
};

// Look up a registered customer by email (admin use)
export const findUserByEmail = async (email) => {
  const snap = await getDocs(query(collection(db, "users"), where("email", "==", email.trim())));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() };
};

// Admin: real-time list of all sent notifications
export const subscribeAllNotifs = (cb) => {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};
