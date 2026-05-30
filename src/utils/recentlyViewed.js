const KEY = "ts_recently_viewed";
const MAX = 10;

export const trackView = (productId) => {
  try {
    const ids = getRecentlyViewed();
    const updated = [productId, ...ids.filter(id => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
};

export const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};
