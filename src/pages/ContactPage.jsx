import { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { createTicket } from "../firebase/supportService";
import { emailCustomerConfirm, emailAdminNotify } from "../services/emailService";

const CATEGORIES = [
  { value: "general",   label: "General Inquiry" },
  { value: "order",     label: "Order Issue" },
  { value: "return",    label: "Return / Exchange" },
  { value: "payment",   label: "Payment Problem" },
  { value: "product",   label: "Product Complaint" },
  { value: "shipping",  label: "Shipping & Delivery" },
  { value: "other",     label: "Other" },
];

export default function ContactPage({ setPage, user }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", orderId: "",
    category: "general", subject: "", message: "",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket]   = useState(null);
  const recaptchaRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Please describe your issue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const token = recaptchaRef.current?.getValue();
    if (!token) { setErrors(e => ({ ...e, captcha: "Please complete the CAPTCHA verification." })); return; }
    recaptchaRef.current.reset();
    setLoading(true);
    try {
      const ref = await createTicket({
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        orderId:  form.orderId.trim(),
        category: form.category,
        subject:  form.subject.trim(),
        message:  form.message.trim(),
        uid:      user?.uid || null,
      });
      const tid = ref.id;

      // Send emails (fire-and-forget — don't block the success state)
      emailCustomerConfirm({
        to_name: form.name,
        to_email: form.email,
        ticket_id: tid,
        subject: form.subject,
        category: CATEGORIES.find(c => c.value === form.category)?.label || form.category,
        message: form.message,
      });
      emailAdminNotify({
        customer_name:  form.name,
        customer_email: form.email,
        phone:    form.phone,
        ticket_id: tid,
        subject:  form.subject,
        category: CATEGORIES.find(c => c.value === form.category)?.label || form.category,
        message:  form.message,
      });

      setTicket(tid);
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inp = (k) => ({
    value: form[k],
    onChange: (e) => { set(k, e.target.value); if (errors[k]) setErrors(p => ({ ...p, [k]: "" })); },
  });

  if (ticket) {
    return (
      <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", background:"var(--cr)" }}>
        <div style={{ background:"#fff", borderRadius:24, padding:"52px 40px", maxWidth:520, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(100,60,20,.12)" }}>
          <div style={{ fontSize:"4rem", marginBottom:16 }}>✅</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontWeight:700, color:"var(--dk)", marginBottom:10 }}>
            We've received your message!
          </h2>
          <p style={{ color:"var(--mt)", fontSize:".93rem", lineHeight:1.7, marginBottom:24 }}>
            Thank you for reaching out. Our team will review your request and get back to you within <strong>24–48 hours</strong>.
          </p>
          <div style={{ background:"#FFF3ED", border:"1.5px solid #FFD4B3", borderRadius:14, padding:"16px 24px", marginBottom:28 }}>
            <div style={{ fontSize:".75rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#9B8472", marginBottom:6 }}>
              Your Ticket ID
            </div>
            <div style={{ fontFamily:"monospace", fontSize:"1.1rem", fontWeight:700, color:"#E8620A", letterSpacing:".08em" }}>
              #{ticket.slice(-8).toUpperCase()}
            </div>
            <div style={{ fontSize:".78rem", color:"var(--mt)", marginTop:6 }}>
              A confirmation email has been sent to <strong>{form.email}</strong>
            </div>
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button className="ct-submit" style={{ width:"auto", padding:"12px 28px" }}
              onClick={() => setPage("shop")}>
              Continue Shopping
            </button>
            <button onClick={() => { setTicket(null); setForm({ name:"",email:"",phone:"",orderId:"",category:"general",subject:"",message:"" }); }}
              style={{ padding:"12px 28px", border:"1.5px solid var(--sf)", color:"var(--sf)", background:"none",
                borderRadius:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"1rem" }}>
              New Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"var(--cr)" }}>

      {/* Hero */}
      <div className="contact-hero">
        <div style={{ maxWidth:580, margin:"0 auto" }}>
          <div style={{ display:"inline-block", padding:"5px 16px", background:"rgba(232,98,10,.18)",
            border:"1px solid rgba(232,98,10,.35)", borderRadius:20, fontSize:".78rem", fontWeight:700,
            letterSpacing:".1em", textTransform:"uppercase", color:"#FF8C38", marginBottom:18 }}>
            Support Center
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2rem,5vw,3rem)", fontWeight:700,
            color:"#F0BB50", marginBottom:14, lineHeight:1.15 }}>
            How can we help?
          </h1>
          <p style={{ color:"#C4B49A", fontSize:"1rem", lineHeight:1.7 }}>
            We're here for every question, complaint, or compliment. Fill out the form below and we'll get back to you within 24–48 hours.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="contact-body">

        {/* Form */}
        <div className="contact-card">
          <h2>Send us a message</h2>

          <div className="ct-row">
            <Grp label="Your Name *" error={errors.name}>
              <input className={`ct-inp ${errors.name?"ct-inp-err":""}`} placeholder="Priya Reddy" {...inp("name")}/>
            </Grp>
            <Grp label="Email Address *" error={errors.email}>
              <input className={`ct-inp ${errors.email?"ct-inp-err":""}`} type="email" placeholder="you@example.com" {...inp("email")}/>
            </Grp>
          </div>

          <div className="ct-row">
            <Grp label="Phone (optional)">
              <input className="ct-inp" type="tel" placeholder="+91 98765 43210" {...inp("phone")}/>
            </Grp>
            <Grp label="Order ID (if applicable)">
              <input className="ct-inp" placeholder="ORD-XXXXXXXX" {...inp("orderId")}/>
            </Grp>
          </div>

          <Grp label="Category">
            <select className="ct-inp" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Grp>

          <Grp label="Subject *" error={errors.subject}>
            <input className={`ct-inp ${errors.subject?"ct-inp-err":""}`}
              placeholder="Briefly describe your issue" {...inp("subject")}/>
          </Grp>

          <Grp label="Message *" error={errors.message}>
            <textarea className={`ct-inp ${errors.message?"ct-inp-err":""}`} rows={5}
              placeholder="Please provide as much detail as possible — order number, product name, what went wrong, what outcome you're looking for…"
              {...inp("message")} style={{ resize:"vertical" }}/>
          </Grp>

          <div style={{marginBottom:14}}>
            <ReCAPTCHA ref={recaptchaRef} sitekey={process.env.REACT_APP_RECAPTCHA_V2_SITE_KEY} theme="light"/>
            {errors.captcha && <p style={{color:"#C0392B",fontSize:".82rem",marginTop:6}}>{errors.captcha}</p>}
          </div>

          <button className="ct-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Send Message →"}
          </button>
        </div>

        {/* Info panel */}
        <div className="contact-info">

          <div className="ct-info-card">
            <div className="ct-info-icon">📧</div>
            <h4>Email Us</h4>
            <p><a href="mailto:hello@teluguseeamalo.in">hello@teluguseeamalo.in</a></p>
            <p style={{ marginTop:4, fontSize:".78rem" }}>We reply within 24–48 hours on weekdays</p>
          </div>

          <div className="ct-info-card">
            <div className="ct-info-icon">📞</div>
            <h4>Call Us</h4>
            <p><a href="tel:+919876543210">+91 9876 543 210</a></p>
            <p style={{ marginTop:4, fontSize:".78rem" }}>Mon–Sat · 10 AM – 6 PM IST</p>
          </div>

          <div className="ct-info-card">
            <div className="ct-info-icon">📍</div>
            <h4>Our Studio</h4>
            <p>Artisan Quarter, Karimnagar<br/>Telangana – 505 001, India</p>
          </div>

          <div className="ct-info-card" style={{ background:"linear-gradient(135deg,#18100A,#2D1E12)", color:"#C4B49A" }}>
            <div className="ct-info-icon">⏱</div>
            <h4 style={{ color:"#F0BB50" }}>Response Times</h4>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:6 }}>
              {[
                ["General Inquiry","24–48 hrs"],
                ["Order Issues","12–24 hrs"],
                ["Payment Issues","6–12 hrs"],
                ["Complaints","48–72 hrs"],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:".82rem" }}>
                  <span>{k}</span>
                  <span style={{ color:"#F0BB50", fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Grp({ label, error, children }) {
  return (
    <div className="ct-grp">
      <label>{label}</label>
      {children}
      {error && <span style={{ fontSize:".75rem", color:"#C0392B", marginTop:2 }}>{error}</span>}
    </div>
  );
}
