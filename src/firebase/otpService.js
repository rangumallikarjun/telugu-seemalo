import { emailNotification } from "../services/emailService";

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const OTP_TPL    = process.env.REACT_APP_EMAILJS_OTP_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const sendOtp = async (toEmail, otp, purpose = "verification") => {
  if (!SERVICE_ID || !OTP_TPL || !PUBLIC_KEY) {
    throw new Error("EmailJS OTP not configured. Check REACT_APP_EMAILJS_OTP_TEMPLATE_ID in .env");
  }
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  SERVICE_ID,
      template_id: OTP_TPL,
      user_id:     PUBLIC_KEY,
      template_params: {
        to_email:   toEmail,
        otp_code:   otp,
        purpose,
        store_name: "Telugu Seemalo",
      },
    }),
  });
  if (!res.ok) throw new Error("Failed to send OTP email. Check your EmailJS configuration.");
};

// Used by notificationService.js — signature: (toEmail, title, message)
export const sendConfirmationEmail = (toEmail, title, message) =>
  emailNotification({ to_email: toEmail, to_name: "", title, message }).catch(() => {});
