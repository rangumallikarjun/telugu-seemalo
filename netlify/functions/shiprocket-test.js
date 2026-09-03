// Test ShipRocket credentials from Admin → Shipping. Admin only.
const { json, readBody, verifyCaller } = require("./_util");

const SR_BASE = "https://apiv2.shiprocket.in/v1/external";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  const caller = await verifyCaller(event);
  if (!caller?.isAdmin) return json(403, { error: "Admin only" });

  const { email, password } = readBody(event);
  if (!email || !password) return json(400, { error: "email and password are required" });

  let data;
  try {
    const r = await fetch(`${SR_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    data = await r.json().catch(() => ({}));
    if (!r.ok || !data.token) return json(401, { error: data.message || `Login failed (${r.status})` });
  } catch (err) {
    return json(502, { error: err.message });
  }
  return json(200, { success: true });
};
