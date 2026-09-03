import { callFn } from "./netlifyFn";

// Razorpay refunds run through a Netlify serverless function.
// Returns { data } to keep the previous httpsCallable call shape.
export const callProcessRefund = ({ paymentId, amount }) =>
  callFn("razorpay-refund", { paymentId, amount }, { requireAuth: true }).then((data) => ({ data }));
