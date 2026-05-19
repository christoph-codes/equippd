import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/src/services/firebase/app";

export type AuthListener = (user: User | null) => void;

function requireAuth() {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.",
    );
  }

  return auth;
}

export async function login(email: string, password: string) {
  const authClient = requireAuth();
  return signInWithEmailAndPassword(authClient, email.trim(), password);
}

export async function signup(
  displayName: string,
  email: string,
  password: string,
) {
  const authClient = requireAuth();
  const credential = await createUserWithEmailAndPassword(
    authClient,
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName });
  return credential;
}

export async function logout() {
  return signOut(requireAuth());
}

function requireCurrentUser() {
  const authClient = requireAuth();
  if (!authClient.currentUser) {
    throw new Error("You must be logged in to manage your account.");
  }

  return authClient.currentUser;
}

export async function updateAccountProfile(
  displayName: string,
  photoURL?: string | null,
) {
  const user = requireCurrentUser();
  await updateProfile(user, {
    displayName: displayName.trim(),
    photoURL: photoURL ?? undefined,
  });
}

export async function updateAccountPassword(
  currentPassword: string,
  nextPassword: string,
) {
  const user = requireCurrentUser();
  if (!user.email) {
    throw new Error(
      "Your account is missing an email address. Please contact support.",
    );
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, nextPassword);
}

export function subscribeToAuth(listener: AuthListener) {
  if (!auth) {
    listener(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, listener);
}
