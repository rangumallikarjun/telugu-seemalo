import { auth } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  unlink,
} from "firebase/auth";
import { createUserDoc, getUserDoc } from "./userService";
import { claimGuestOrders } from "./orderService";

export const login = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const data = await getUserDoc(cred.user.uid);
  return { uid: cred.user.uid, email: cred.user.email, ...data };
};

export const signup = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDoc(cred.user.uid, { name, email });
  return { uid: cred.user.uid, email, name, role: "customer" };
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const firebaseUser = cred.user;
  let data = await getUserDoc(firebaseUser.uid);
  if (!data) {
    await createUserDoc(firebaseUser.uid, {
      name: firebaseUser.displayName || "",
      email: firebaseUser.email,
    });
    data = { name: firebaseUser.displayName || "", role: "customer" };
  }
  return { uid: firebaseUser.uid, email: firebaseUser.email, ...data };
};

export const logout = () => signOut(auth);

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

export const changePassword = async (currentPass, newPass) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPass);
};

export const getLinkedProviders = () =>
  (auth.currentUser?.providerData || []).map(p => p.providerId);

export const unlinkGoogle = () =>
  unlink(auth.currentUser, "google.com");

export const onAuthChange = (callback) => onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const [data] = await Promise.all([
      getUserDoc(firebaseUser.uid),
      claimGuestOrders(firebaseUser.uid, firebaseUser.email),
    ]);
    callback({ uid: firebaseUser.uid, email: firebaseUser.email, ...data });
  } else {
    callback(null);
  }
});
