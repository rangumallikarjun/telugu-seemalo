import { callFn } from "./netlifyFn";

// ShipRocket runs through Netlify serverless functions (Firebase Cloud
// Functions needed the paid Blaze plan).
export const pushOrderToShiprocket = (orderId, razorpayPaymentId) =>
  callFn("shiprocket-push", { orderId, razorpayPaymentId });

export const assignShiprocketAWB = (shipmentId, orderId) =>
  callFn("shiprocket-awb", { shipmentId, orderId }, { requireAuth: true });

export const trackShiprocketOrder = (awb) =>
  callFn("shiprocket-track", { awb }, { requireAuth: true });

export const syncAllShiprocket = () =>
  callFn("shiprocket-sync", {}, { requireAuth: true });

export const testShiprocketLogin = (email, password) =>
  callFn("shiprocket-test", { email, password }, { requireAuth: true });
