import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/config";

const fns = getFunctions(app);
export const callProcessRefund   = httpsCallable(fns, "processRefund");
export const callListSavedCards  = httpsCallable(fns, "listRazorpayCards");
export const callDeleteSavedCard = httpsCallable(fns, "deleteRazorpayCard");
