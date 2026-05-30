// Collects IP address, approximate location (via IP), and device info silently.
// No browser permission prompts are shown to the customer.

function parseUA(ua) {
  // OS
  let os = "Unknown OS";
  if (/Windows NT 10/.test(ua))        os = "Windows 11/10";
  else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7";
  else if (/Mac OS X/.test(ua))        os = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ? `macOS ${ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g, ".")}` : "macOS";
  else if (/Android ([\d.]+)/.test(ua))os = `Android ${ua.match(/Android ([\d.]+)/)[1]}`;
  else if (/iPhone OS ([\d_]+)/.test(ua)) os = `iOS ${ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g, ".")}`;
  else if (/iPad.*OS ([\d_]+)/.test(ua))  os = `iPadOS ${ua.match(/OS ([\d_]+)/)[1].replace(/_/g, ".")}`;
  else if (/Linux/.test(ua))           os = "Linux";

  // Browser
  let browser = "Unknown Browser";
  if (/Edg\//.test(ua))           browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] || ""}`;
  else if (/OPR\//.test(ua))      browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] || ""}`;
  else if (/Chrome\/([\d.]+)/.test(ua)) browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)[1]}`;
  else if (/Firefox\/([\d.]+)/.test(ua)) browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)[1]}`;
  else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] || ""}`;

  // Device type
  let deviceType = "Desktop";
  if (/Mobi|Android|iPhone|iPod/.test(ua)) deviceType = "Mobile";
  else if (/iPad|Tablet/.test(ua))         deviceType = "Tablet";

  // Device brand / model (best-effort)
  let deviceModel = "Unknown Device";
  if (/iPhone/.test(ua))  deviceModel = "Apple iPhone";
  else if (/iPad/.test(ua)) deviceModel = "Apple iPad";
  else if (/SM-[A-Z0-9]+/.test(ua)) deviceModel = `Samsung ${ua.match(/SM-[A-Z0-9]+/)?.[0] || ""}`;
  else if (/Pixel \d/.test(ua))     deviceModel = `Google ${ua.match(/Pixel \d+[a-z]*/i)?.[0] || "Pixel"}`;
  else if (/OnePlus/.test(ua))      deviceModel = `OnePlus ${ua.match(/OnePlus([A-Z0-9]+)/i)?.[1] || ""}`.trim();
  else if (/Mi /.test(ua))          deviceModel = `Xiaomi ${ua.match(/Mi [A-Z0-9]+/i)?.[0] || ""}`.trim();
  else if (/Macintosh/.test(ua))    deviceModel = "Apple Mac";
  else if (/Windows/.test(ua))      deviceModel = "Windows PC";
  else if (/Linux/.test(ua))        deviceModel = "Linux PC";

  return { os, browser, deviceType, deviceModel };
}

export async function collectDeviceFingerprint() {
  const ua      = navigator.userAgent || "";
  const lang    = navigator.language  || navigator.languages?.[0] || "unknown";
  const tz      = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || "unknown";
  const screen  = `${window.screen.width}×${window.screen.height}`;
  const viewport= `${window.innerWidth}×${window.innerHeight}`;
  const cores   = navigator.hardwareConcurrency || "unknown";
  const memory  = navigator.deviceMemory       || "unknown";
  const touch   = navigator.maxTouchPoints > 0;
  const { os, browser, deviceType, deviceModel } = parseUA(ua);

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  let ip = null, city = null, region = null, country = null, org = null, loc = null;

  if (isLocalhost) {
    // ip-api.com blocks localhost — mark clearly for admin so they know why it's empty
    ip  = "127.0.0.1 (localhost – dev only)";
    org = "Local Development";
  } else {
    // Try ip-api.com first (free, no key, HTTPS required in production)
    const tryFetch = async (url, parse) => {
      const res = await Promise.race([
        fetch(url),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
      ]);
      return parse(await res.json());
    };

    try {
      const d = await tryFetch(
        "https://ip-api.com/json/?fields=status,query,city,regionName,country,org,lat,lon",
        (d) => d.status === "success" ? d : null
      );
      if (d) {
        ip      = d.query;
        city    = d.city;
        region  = d.regionName;
        country = d.country;
        org     = d.org;
        loc     = d.lat && d.lon ? `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}` : null;
      }
    } catch { /* try fallback */ }

    // Fallback: ipapi.co (works over HTTPS, no key needed)
    if (!ip) {
      try {
        const d = await tryFetch(
          "https://ipapi.co/json/",
          (d) => d.ip ? d : null
        );
        if (d) {
          ip      = d.ip;
          city    = d.city;
          region  = d.region;
          country = d.country_name;
          org     = d.org;
          loc     = d.latitude && d.longitude ? `${Number(d.latitude).toFixed(4)}, ${Number(d.longitude).toFixed(4)}` : null;
        }
      } catch { /* silently ignore */ }
    }
  }

  return {
    // device
    deviceType,
    deviceModel,
    os,
    browser,
    userAgent: ua,
    screen,
    viewport,
    cores,
    memoryGB: memory,
    touchEnabled: touch,
    language: lang,
    timezone: tz,
    // network (IP-based, no GPS prompt)
    ip,
    city,
    region,
    country,
    isp: org,
    approxLocation: loc,       // lat,lon from IP — not GPS
    collectedAt: new Date().toISOString(),
  };
}
