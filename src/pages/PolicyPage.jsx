import { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export const DEFAULT_TERMS_SECTIONS = [
  {
    title: "About Us",
    body: "Telugu Seemalo is an e-commerce platform operating in India, selling physical goods to customers.\n- Business Name / Legal Entity: [Insert registered legal entity name, e.g., proprietorship/partnership/private limited company name]\n- Registered Address: Hyderabad, Telangana, India – 500010\n- Email: teluguseemalo@gmail.com\n- Phone: +91 94924 55694",
  },
  {
    title: "Eligibility",
    body: "The Site and its products are open to users of all ages. If you are under 18 years of age, we recommend that a parent or legal guardian be involved in placing your order, particularly for payment and delivery arrangements, since under the Indian Contract Act, 1872, minors cannot enter into a legally binding contract. By placing an order as a minor, it is assumed that a parent or guardian has approved and is aware of the purchase.",
  },
  {
    title: "Account Registration",
    body: "You may be required to create an account to place an order. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Please notify us immediately at teluguseemalo@gmail.com if you suspect unauthorized use of your account.",
  },
  {
    title: "Products and Pricing",
    body: "- All products displayed on the Site are subject to availability.\n- We make reasonable efforts to display product colors, sizes, and details accurately; however, slight variations may occur due to display settings or manufacturing differences.\n- Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.\n- We reserve the right to modify prices, discontinue products, or correct pricing errors at any time without prior notice. If an error is discovered after you place an order, we will notify you before processing the order.",
  },
  {
    title: "Orders and Order Acceptance",
    body: "Placing an order on the Site constitutes an offer to purchase. An order is only confirmed once you receive an order confirmation via email or SMS. We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud, pricing errors, or stock unavailability. In such cases, any amount paid will be refunded as per our Return & Refund Policy.",
  },
  {
    title: "Payments",
    body: "Payments on the Site are processed securely through Razorpay, a PCI-DSS compliant third-party payment gateway. We do not store your full card details on our servers. See our Privacy Policy for more information on how payment data is handled.",
  },
  {
    title: "Shipping and Delivery",
    body: "Shipping is governed by our separate Shipping Policy, which forms part of these Terms.",
  },
  {
    title: "Returns and Refunds",
    body: "Returns and refunds are governed by our separate Return & Refund Policy, which forms part of these Terms. Please note that certain products may be marked as non-returnable, as indicated on the relevant product page.",
  },
  {
    title: "Coupons and Promotions",
    body: "Any coupon codes, free shipping offers, or promotional discounts are subject to specific terms communicated at the time of the offer and may be modified, withdrawn, or restricted at our discretion.",
  },
  {
    title: "User Conduct",
    body: "You agree not to:\n- Use the Site for any unlawful purpose or in violation of these Terms.\n- Attempt to gain unauthorized access to the Site, our servers, or any connected systems.\n- Post or transmit any harmful, defamatory, or infringing content through the Site.\n- Interfere with the security or proper functioning of the Site.",
  },
  {
    title: "Intellectual Property",
    body: "All content on the Site, including but not limited to the Telugu Seemalo name, logo, graphics, text, and product images, is the property of Telugu Seemalo or its licensors and is protected under applicable Indian intellectual property laws. You may not reproduce, distribute, or use this content without our prior written consent.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted under applicable law, Telugu Seemalo shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site or products purchased, except where such liability cannot be excluded under the Consumer Protection Act, 2019, and applicable rules.",
  },
  {
    title: "Grievance Redressal",
    body: "In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, we have appointed a Grievance Officer to address any complaints or concerns:\n- Grievance Officer: [Insert Name]\n- Email: teluguseemalo@gmail.com\n- Phone: +91 94924 55694\n- Address: Hyderabad, Telangana, India – 500010\nWe will acknowledge complaints within 48 hours and aim to resolve them within 30 days of receipt.",
  },
  {
    title: "Governing Law and Jurisdiction",
    body: "These Terms are governed by the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.",
  },
  {
    title: "Changes to These Terms",
    body: "We may update these Terms from time to time. Changes will be posted on this page with a revised \"Last Updated\" date. Continued use of the Site after changes constitutes acceptance of the updated Terms.",
  },
  {
    title: "Contact Us",
    body: "For any questions regarding these Terms, please contact us at:\n- 📧 teluguseemalo@gmail.com\n- 📞 +91 94924 55694\n- 📍 Hyderabad, Telangana, India – 500010",
  },
];

export const DEFAULT_PRIVACY_SECTIONS = [
  {
    title: "Information We Collect",
    body: "When you place an order or interact with the Site, we may collect:\n- Personal Details: Name, email address, phone number, and shipping/billing address.\n- Payment Information: Your payments are processed through Razorpay, our third-party payment gateway. We do not store your full card number on our servers. We retain limited, non-sensitive payment reference details (such as the payment method used, e.g., card, UPI, or netbanking, and the last few digits of a card where provided by Razorpay) solely to help verify and reference past transactions. Your complete cardholder data is handled and secured directly by Razorpay in accordance with PCI-DSS standards.\n- Cookies and Usage Data: We use cookies to improve your browsing experience, remember your preferences, and understand how visitors use the Site.\n- Communication Data: Any information you provide when contacting our customer support.",
  },
  {
    title: "How We Use Your Information",
    body: "We use the information we collect to:\n- Process and fulfill your orders, including shipping and delivery.\n- Communicate with you regarding orders, refunds, offers, or customer support.\n- Verify payments and prevent fraud.\n- Improve our Site, products, and customer experience.\n- Comply with applicable legal and regulatory requirements.",
  },
  {
    title: "Third-Party Service Providers",
    body: "We work with trusted third-party providers to operate the Site and process your data on our behalf. These include:\n- Razorpay – for secure payment processing. Razorpay is PCI-DSS compliant and handles your payment details directly.\n- Shiprocket – for order shipping and delivery logistics. Your name, address, and phone number are shared with Shiprocket solely to fulfill delivery.\n- Google Firebase – we use Firebase (a Google service) to manage account-related and order-related email communications. Firebase may process your email address to deliver these communications.\nThese providers are only given the information necessary to perform their specific function and are contractually or legally bound to protect your data.",
  },
  {
    title: "Data Sharing and Sale",
    body: "We do not sell, rent, or trade your personal information to third parties for marketing purposes. Your data is shared only with the service providers listed above, or when required by law, court order, or government authority.",
  },
  {
    title: "Data Security",
    body: "We implement reasonable security practices and procedures in accordance with the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, to protect your personal information from unauthorized access, disclosure, alteration, or destruction.",
  },
  {
    title: "Cookies",
    body: "We use cookies to:\n- Keep you logged in and remember your cart.\n- Understand site traffic and usage patterns.\n- Support coupon and free-shipping functionality.\nYou can disable cookies through your browser settings; however, this may affect certain features of the Site, such as checkout functionality.",
  },
  {
    title: "Your Rights",
    body: "Subject to applicable law, including the Digital Personal Data Protection Act, 2023, you have the right to:\n- Access the personal data we hold about you.\n- Request correction of inaccurate or incomplete data.\n- Request deletion of your personal data, subject to any legal or order-fulfillment obligations we may have.\n- Withdraw consent for non-essential data processing (e.g., marketing communications).\nTo exercise these rights, contact us at teluguseemalo@gmail.com.",
  },
  {
    title: "Data Retention",
    body: "We retain your personal information for as long as necessary to fulfill orders, comply with legal obligations (such as tax and accounting requirements), resolve disputes, and enforce our agreements.",
  },
  {
    title: "Children's Privacy",
    body: "Telugu Seemalo sells home decor products, and individuals under the age of 18 are welcome to browse and shop on the Site. Where an order is placed by a minor, we recommend that a parent or legal guardian be involved in the purchase, particularly for payment and delivery details, since minors cannot enter into a legally binding contract under the Indian Contract Act, 1872. We do not knowingly collect more personal information from minors than is necessary to process an order (name, contact details, and delivery address), and we do not use this information for any purpose beyond order fulfillment and related customer communication.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy periodically. Any changes will be posted on this page with a revised \"Last Updated\" date.",
  },
  {
    title: "Grievance Officer",
    body: "In accordance with applicable Indian law, you may contact our Grievance Officer with any privacy-related concerns:\n- Grievance Officer: [Insert Name]\n- Email: teluguseemalo@gmail.com\n- Phone: +91 94924 55694\n- Address: Hyderabad, Telangana, India – 500010",
  },
  {
    title: "Contact Us",
    body: "- 📧 teluguseemalo@gmail.com\n- 📞 +91 94924 55694\n- 📍 Hyderabad, Telangana, India – 500010",
  },
];

export const DEFAULT_SHIPPING_SECTIONS = [
  {
    title: "Shipping Coverage",
    body: "We currently ship only within India. We do not offer international shipping at this time.",
  },
  {
    title: "Shipping Partner",
    body: "All orders are shipped through Shiprocket, a trusted third-party logistics platform that works with multiple courier partners to ensure reliable delivery across India.",
  },
  {
    title: "Delivery Timelines",
    body: "Orders are typically delivered within 5–7 business days from the date of order confirmation, depending on your location and courier serviceability. Delivery timelines are estimates and may vary due to factors beyond our control, such as weather conditions, courier delays, or regional restrictions.",
  },
  {
    title: "Shipping Charges",
    body: "- Shipping charges are borne by the customer and are calculated at checkout based on order value, weight, and delivery location.\n- Free shipping is available on orders above a minimum order value, as indicated on the Site at checkout.\n- Select products may qualify for free shipping, as noted on the individual product page.\n- Coupon codes may be issued from time to time that waive or reduce shipping charges; these are subject to the specific terms of each coupon.",
  },
  {
    title: "Order Processing",
    body: "Orders are processed and handed over to our shipping partner within 1–2 business days of order confirmation, excluding weekends and public holidays.",
  },
  {
    title: "Tracking Your Order",
    body: "Once your order is shipped, you will receive a tracking number and link via email and/or SMS so you can monitor your shipment's progress.",
  },
  {
    title: "Delivery Attempts",
    body: "Our courier partners will make reasonable attempts to deliver your order to the address provided at checkout. Please ensure your shipping address and contact number are accurate and complete. We are not responsible for delays or failed deliveries resulting from incorrect or incomplete address information provided by the customer.",
  },
  {
    title: "Undelivered or Returned Shipments",
    body: "If a shipment is returned to us due to an incorrect address, refused delivery, or repeated failed delivery attempts, we will contact you to arrange re-shipment. Additional shipping charges may apply for re-shipment in such cases.",
  },
  {
    title: "Delays",
    body: "While we strive to meet the stated delivery timelines, delays may occasionally occur due to unforeseen circumstances such as natural events, courier network issues, or regional disruptions. We will keep you informed in case of any significant delay to your order.",
  },
  {
    title: "Questions",
    body: "For any questions about your shipment, please contact us at:\n- 📧 teluguseemalo@gmail.com\n- 📞 +91 94924 55694\n- 📍 Hyderabad, Telangana, India – 500010",
  },
];

export const DEFAULT_RETURN_SECTIONS = [
  {
    title: "Return Eligibility",
    body: "- Products can be returned within 15 days of the delivery date.\n- The product must be unused, in its original condition, with original packaging, tags, and accessories intact.\n- Some products are marked as non-returnable due to their nature (such as hygiene, perishability, or customization). This will be clearly indicated on the relevant product page at the time of purchase. No returns will be accepted for products marked non-returnable, except in cases of a defective or damaged item received, as required under applicable consumer protection law.",
  },
  {
    title: "Damaged, Defective, or Incorrect Items",
    body: "If you receive a product that is damaged, defective, or different from what you ordered:\n- Please contact us within 15 days of delivery at teluguseemalo@gmail.com or +91 94924 55694 with your order number and photos/videos of the issue.\n- In such cases, Telugu Seemalo will bear the cost of return shipping.\n- Once the issue is verified, we will process a replacement or refund as applicable.",
  },
  {
    title: "Change-of-Mind Returns",
    body: "If you wish to return a product for reasons other than a defect (e.g., you no longer want the item), and the product is eligible for return:\n- The return must meet the eligibility conditions in the Return Eligibility section above.\n- Return shipping costs for change-of-mind returns are borne by the customer, unless otherwise stated at the time of purchase.",
  },
  {
    title: "How to Initiate a Return",
    body: "- Email us at teluguseemalo@gmail.com or call +91 94924 55694 within 15 days of delivery, quoting your order number.\n- Our team will review your request and share return instructions.\n- Once we receive and inspect the returned product, we will notify you of the approval or rejection of your return.",
  },
  {
    title: "Refunds",
    body: "- Approved refunds are issued as wallet credit on our Site. We do not process refunds to the original payment method.\n- Wallet credit refunds are processed within 2–3 working days of the return being approved.\n- Wallet credit can be used towards future purchases on the Site and is subject to any applicable terms communicated at the time of issue.",
  },
  {
    title: "Non-Returnable Items",
    body: "Certain products are marked \"No Return\" on their product page and are not eligible for return or exchange, except where the product is received damaged, defective, or materially different from the description, as required under the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020.",
  },
  {
    title: "Exchanges",
    body: "At this time, we do not offer direct exchanges. If you would like a different size, color, or product, please initiate a return (where eligible) and place a new order.",
  },
  {
    title: "Contact Us",
    body: "For any questions about returns or refunds, please reach out to:\n- 📧 teluguseemalo@gmail.com\n- 📞 +91 94924 55694\n- 📍 Hyderabad, Telangana, India – 500010",
  },
];

function renderBody(body) {
  const blocks = [];
  let list = null;
  (body || "").split("\n").forEach(raw => {
    const line = raw.trim();
    if (!line) { list = null; return; }
    if (line.startsWith("- ")) {
      if (!list) { list = []; blocks.push({ type: "ul", items: list }); }
      list.push(line.slice(2));
    } else {
      list = null;
      blocks.push({ type: "p", text: line });
    }
  });
  return blocks;
}

function SectionBody({ body }) {
  return renderBody(body).map((b, i) => b.type === "ul"
    ? (
      <ul key={i} style={{margin:"6px 0 12px 20px",padding:0,color:"var(--dk)",lineHeight:1.75}}>
        {b.items.map((it, j) => <li key={j} style={{marginBottom:5}}>{it}</li>)}
      </ul>
    ) : (
      <p key={i} style={{margin:"0 0 10px",color:"var(--dk)",lineHeight:1.75}}>{b.text}</p>
    ));
}

function PolicySections({ sections }) {
  if (!sections?.length) return null;
  return (
    <ol style={{display:"flex",flexDirection:"column",gap:30,listStyle:"none",padding:0,margin:0}}>
      {sections.map((s, i) => (
        <li key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
          <span style={{flexShrink:0,width:30,height:30,borderRadius:"50%",background:"var(--sf)",color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:".85rem",marginTop:2}}>
            {i + 1}
          </span>
          <div style={{flex:1,minWidth:0}}>
            <h3 style={{margin:"0 0 8px",fontSize:"1.08rem",color:"var(--dk)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700}}>
              {s.title}
            </h3>
            <SectionBody body={s.body}/>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function PolicyPage({ docId, title, subtitle, defaultSections }) {
  const [sections, setSections] = useState(defaultSections);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", docId))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.sections) && data.sections.length > 0) setSections(data.sections);
          if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [docId]);

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
            {lastUpdated && (
              <p style={{color:"var(--mt)",fontSize:".85rem",marginBottom:32}}>Last Updated: {lastUpdated}</p>
            )}
            <PolicySections sections={sections}/>
          </>
        )}
      </div>
    </div>
  );
}
