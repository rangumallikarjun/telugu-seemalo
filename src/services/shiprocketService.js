import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/config";

const fns = getFunctions(app);

const _pushOrder  = httpsCallable(fns, "shiprocketPushOrder");
const _assignAWB  = httpsCallable(fns, "shiprocketAssignAWB");
const _track      = httpsCallable(fns, "shiprocketTrack");
const _syncNow    = httpsCallable(fns, "syncShiprocketNow");

export const pushOrderToShiprocket  = (orderId)             => _pushOrder({ orderId }).then(r => r.data);
export const assignShiprocketAWB    = (shipmentId, orderId) => _assignAWB({ shipmentId, orderId }).then(r => r.data);
export const trackShiprocketOrder   = (awb)                 => _track({ awb }).then(r => r.data);
export const syncAllShiprocket      = ()                    => _syncNow({}).then(r => r.data);
