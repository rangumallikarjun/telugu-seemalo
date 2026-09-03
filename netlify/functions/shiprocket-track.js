// Raw ShipRocket tracking data by AWB. Admin only.
const { SR_BASE, srToken } = require("./_shiprocket");
const { json, readBody, verifyCaller } = require("./_util");

exports.handler = async (event) => {
  const caller = await verifyCaller(event);
  if (!caller?.isAdmin) return json(403, { error: "Admin only" });

  const awb = readBody(event).awb || (event.queryStringParameters && event.queryStringParameters.awb);
  if (!awb) return json(400, { error: "awb is required" });

  let token;
  try { token = await srToken(); } catch (err) { return json(502, { error: err.message }); }

  const r = await fetch(`${SR_BASE}/courier/track/awb/${awb}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return json(r.status, await r.json().catch(() => ({})));
};
