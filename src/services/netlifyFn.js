import { auth } from "../firebase/config";

// Netlify serverless functions live at /.netlify/functions/<name> on the same
// origin as the site. (They are not available under `npm start` — use `netlify
// dev` for local testing of shipping / refund features.)
const BASE = "/.netlify/functions";

export async function callFn(name, body = {}, { requireAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const u = auth.currentUser;
  if (u) {
    try { headers.Authorization = "Bearer " + (await u.getIdToken()); } catch { /* ignore */ }
  } else if (requireAuth) {
    throw new Error("Please sign in.");
  }
  const res = await fetch(`${BASE}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
