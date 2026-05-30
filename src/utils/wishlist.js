const KEY = "ts_wishlist";

export const getWishlistIds = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};

export const isWishlisted = (id) => getWishlistIds().includes(id);

export const toggleWishlist = (id) => {
  const ids = getWishlistIds();
  const added = !ids.includes(id);
  const updated = added ? [...ids, id] : ids.filter(x => x !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("ts-wishlist-change"));
  return added;
};
