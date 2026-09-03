const { admin, db } = require("./_firebase");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const readBody = (event) => {
  try { return JSON.parse(event.body || "{}"); } catch { return {}; }
};

// Verify a Firebase ID token from the Authorization header.
// Returns { uid, email, isAdmin } or null.
const verifyCaller = async (event) => {
  const hdr = event.headers.authorization || event.headers.Authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    let isAdmin = false;
    try {
      const snap = await db.doc(`users/${decoded.uid}`).get();
      isAdmin = snap.exists && snap.data().role === "admin";
    } catch { /* ignore */ }
    return { uid: decoded.uid, email: decoded.email || "", isAdmin };
  } catch {
    return null;
  }
};

module.exports = { json, readBody, verifyCaller };
