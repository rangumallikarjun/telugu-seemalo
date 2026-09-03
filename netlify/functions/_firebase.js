// Firebase Admin SDK, initialised once from the FIREBASE_SERVICE_ACCOUNT env var
// (paste the whole service-account JSON as the value in Netlify → Environment).
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

const db = admin.firestore();

module.exports = { admin, db, FieldValue: admin.firestore.FieldValue };
