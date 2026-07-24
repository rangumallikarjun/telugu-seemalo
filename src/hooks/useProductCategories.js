import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { DEFAULT_CATEGORY_ITEMS } from "../pages/HomePage";

// Product categories (used for the category dropdown in Admin Products and the
// filter pills on the Shop page) are admin-editable via Settings → Shop by Category.
export function useProductCategories() {
  const [cats, setCats] = useState(["All", ...DEFAULT_CATEGORY_ITEMS.map(c => c.label)]);
  useEffect(() => {
    getDoc(doc(db, "settings", "shopCategories"))
      .then(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setCats(["All", ...data.items.map(c => c.label)]);
        }
      })
      .catch(() => {});
  }, []);
  return cats;
}
