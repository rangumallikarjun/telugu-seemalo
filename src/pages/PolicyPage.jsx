import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export const DEFAULT_TERMS_ITEMS = [
  "All products are handcrafted, so minor variations in colour, size, and finish compared to the images shown are natural and not considered defects.",
  "Prices listed are inclusive of applicable taxes unless stated otherwise at checkout.",
  "Orders are processed only after successful payment confirmation or, for Cash on Delivery, order confirmation.",
  "We reserve the right to cancel any order due to stock unavailability, pricing errors, or suspected fraudulent activity.",
  "Product images are for representation purposes — actual handcrafted items may differ slightly in shade or pattern.",
  "By placing an order, you confirm that the shipping details provided are accurate and complete.",
  "Telugu Seemalo is not liable for delays caused by courier partners, natural disasters, or circumstances beyond our control.",
  "Use of this website constitutes acceptance of these terms, which may be updated from time to time without prior notice.",
];

export const DEFAULT_SHIPPING_ITEMS = [
  "Orders are shipped within 1–3 business days of confirmation.",
  "Standard delivery takes 5–7 business days; Express delivery takes 2–3 business days, depending on location.",
  "Free standard shipping is available on orders above ₹999; a flat shipping fee applies below that.",
  "A tracking link is shared via email/SMS once your order is shipped.",
  "Delivery timelines may be extended during festive seasons or due to courier delays outside our control.",
  "We currently ship across India. For international shipping enquiries, please contact our support team.",
];

export const DEFAULT_RETURN_ITEMS = [
  "Returns and exchanges are accepted within 7 days of delivery.",
  "Items must be unused, undamaged, and returned in their original packaging with tags intact.",
  "Handcrafted items with natural material variations (not defects) are not eligible for return.",
  "To initiate a return, go to Track Order or contact our support team with your order ID.",
  "Refunds are processed to the original payment method within 5–7 business days of the returned item passing quality check.",
  "Shipping charges are non-refundable unless the return is due to a defective or incorrect item.",
];

export const DEFAULT_PRIVACY_ITEMS = [
  "We collect the information you provide when placing an order — name, phone number, shipping address, and email — solely to fulfil and communicate about your order.",
  "Payment details are handled directly by our payment gateway partners; we do not store your card, UPI, or bank details on our servers.",
  "We use cookies and similar technologies to keep your cart working, remember your preferences, and understand how the site is used.",
  "We do not sell or rent your personal data to third parties. Data is shared only with trusted service providers (payment, shipping, analytics) as needed to run the store.",
  "You may request access to, correction of, or deletion of your personal data by contacting our support team.",
  "We retain order data for as long as needed to comply with tax, accounting, and legal obligations.",
  "By using this website, you consent to the collection and use of information as described in this section.",
];

function PolicySection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div style={{marginTop: title ? 46 : 0}}>
      {title && <h2 style={{fontSize:"1.3rem",marginBottom:22,color:"var(--dk)"}}>{title}</h2>}
      <ol style={{display:"flex",flexDirection:"column",gap:18,listStyle:"none",padding:0,margin:0,counterReset:"policy-counter"}}>
        {items.map((text, i) => (
          <li key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
            <span style={{flexShrink:0,width:30,height:30,borderRadius:"50%",background:"var(--sf)",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:".85rem"}}>
              {i + 1}
            </span>
            <p style={{margin:0,color:"var(--dk)",lineHeight:1.7,paddingTop:4}}>{text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PolicyPage({ docId, title, subtitle, defaultItems, extraSection }) {
  const [items, setItems] = useState(defaultItems);
  const [extraItems, setExtraItems] = useState(extraSection?.defaultItems || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docs = [getDoc(doc(db, "settings", docId))];
    if (extraSection) docs.push(getDoc(doc(db, "settings", extraSection.docId)));

    Promise.all(docs)
      .then(([snap, extraSnap]) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.items) && data.items.length > 0) setItems(data.items);
        }
        if (extraSnap?.exists()) {
          const data = extraSnap.data();
          if (Array.isArray(data.items) && data.items.length > 0) setExtraItems(data.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, extraSection?.docId]);

  return (
    <div>
      <div className="about-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div style={{maxWidth:820,margin:"0 auto",padding:"50px 20px 70px"}}>
        {loading ? (
          <p style={{color:"var(--mt)",textAlign:"center"}}>Loading…</p>
        ) : (
          <>
            <PolicySection items={items}/>
            {extraSection && <PolicySection title={extraSection.title} items={extraItems}/>}
          </>
        )}
      </div>
    </div>
  );
}
