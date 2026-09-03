const { db } = require("./_firebase");

const SR_BASE = "https://apiv2.shiprocket.in/v1/external";

let _token = null;
let _tokenAt = 0;

const srConfig = async () => {
  const snap = await db.doc("settings/shipping").get();
  return (snap.exists && snap.data().carriers && snap.data().carriers.shiprocket) || {};
};

const srToken = async () => {
  if (_token && Date.now() - _tokenAt < 8 * 24 * 60 * 60 * 1000) return _token;
  const c = await srConfig();
  if (!c.email || !c.password)
    throw new Error("ShipRocket credentials are not set in Admin → Shipping.");
  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: c.email, password: c.password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token)
    throw new Error(`ShipRocket login failed: ${data.message || res.status} (check email / password in Admin → Shipping)`);
  _token = data.token;
  _tokenAt = Date.now();
  return _token;
};

module.exports = { SR_BASE, srToken, srConfig };
