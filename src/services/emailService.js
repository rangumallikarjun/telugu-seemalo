const SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const NOTIFY_TPL  = process.env.REACT_APP_EMAILJS_NOTIFY_TEMPLATE_ID;
const PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

const sendEmail = async (to_email, to_name, subject, title, message) => {
  if (!SERVICE_ID || !NOTIFY_TPL || !PUBLIC_KEY || NOTIFY_TPL === "PASTE_NOTIFY_TEMPLATE_ID_HERE") {
    console.error("[EmailJS] REACT_APP_EMAILJS_NOTIFY_TEMPLATE_ID not set in .env");
    return;
  }
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  SERVICE_ID,
        template_id: NOTIFY_TPL,
        user_id:     PUBLIC_KEY,
        template_params: {
          to_email,
          to_name:    to_name || to_email.split("@")[0],
          name:       "Telugu Seemalo",
          email:      to_email,
          subject,
          title,
          message,
          store_name: "Telugu Seemalo",
        },
      }),
    });
    if (!res.ok) console.error("[EmailJS] Send failed:", await res.text());
    else console.log("[EmailJS] Sent OK →", to_email);
  } catch (err) {
    console.error("[EmailJS] Send error:", err);
  }
};

// ─── Exported functions ────────────────────────────────────────────────────────

export const emailCustomerConfirm = ({ to_name, to_email, ticket_id, subject, category, message }) =>
  sendEmail(
    to_email, to_name,
    `[Telugu Seemalo] Support Ticket Received — ${ticket_id}`,
    `Your ticket has been received (${ticket_id})`,
    `Hi ${to_name},\n\nWe've received your support request and will get back to you within 24 hours.\n\nTicket ID: ${ticket_id}\nSubject: ${subject}\nCategory: ${category}\n\nYour message:\n${message}\n\nLog in to your account to track this conversation in real time.`
  );

export const emailAdminNotify = ({ customer_name, customer_email, phone, ticket_id, subject, category, message }) =>
  ADMIN_EMAIL
    ? sendEmail(
        ADMIN_EMAIL, "Admin",
        `🎫 New Ticket: ${subject} — ${ticket_id}`,
        `New support ticket from ${customer_name}`,
        `Customer: ${customer_name}\nEmail: ${customer_email}\nPhone: ${phone || "—"}\n\nTicket ID: ${ticket_id}\nSubject: ${subject}\nCategory: ${category}\n\nMessage:\n${message}`
      )
    : Promise.resolve();

export const emailAdminReply = ({ to_name, to_email, ticket_id, original_subject, reply_message }) =>
  sendEmail(
    to_email, to_name,
    `[Telugu Seemalo] We've replied to your ticket — ${ticket_id}`,
    `New reply on your ticket: ${original_subject}`,
    `Hi ${to_name},\n\nOur support team has replied to your ticket (${ticket_id}):\n\n"${reply_message}"\n\nLog in to your account to continue the conversation.`
  );

export const emailTicketResolved = ({ to_name, to_email, ticket_id, subject }) =>
  sendEmail(
    to_email, to_name,
    `[Telugu Seemalo] Ticket Resolved — ${ticket_id}`,
    `Your ticket has been resolved ✓`,
    `Hi ${to_name},\n\nYour support ticket has been resolved by our team.\n\nTicket ID: ${ticket_id}\nSubject: ${subject}\nStatus: Resolved ✓\n\nIf you need further help, feel free to open a new ticket anytime.`
  );

export const emailWelcome = ({ to_email, to_name }) =>
  sendEmail(
    to_email, to_name,
    `Welcome to Telugu Seemalo, ${to_name}!`,
    `Welcome to Telugu Seemalo! 🎉`,
    `Hi ${to_name},\n\nYour account has been created successfully. Welcome to the Telugu Seemalo family!\n\nYou can now track orders, request returns, manage your wishlist, and contact support — all from your profile.\n\nThank you for joining us!`
  );

export const emailLoginAlert = ({ to_email, to_name }) =>
  sendEmail(
    to_email, to_name || to_email.split("@")[0],
    `[Telugu Seemalo] New login to your account`,
    `New login detected`,
    `Hi ${to_name || "there"},\n\nA new login was detected on your Telugu Seemalo account.\n\nIf this was you, no action is needed.\nIf you didn't log in, please reset your password immediately.`
  );

export const emailNotification = ({ to_email, to_name, title, message }) =>
  sendEmail(
    to_email, to_name || "Customer",
    `[Telugu Seemalo] ${title}`,
    title,
    message
  );
