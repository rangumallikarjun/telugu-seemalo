import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/config";

const fns = getFunctions(app);
export const callProcessRefund = httpsCallable(fns, "processRefund");
