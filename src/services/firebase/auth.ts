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
import type { FirebaseError } from "firebase/app";

import { auth } from "@/src/services/firebase/app";

export type AuthListener = (user: User | null) => void;

function getAuthErrorMessage(error: unknown) {
  const code = (error as FirebaseError | undefined)?.code;

  if (code === "auth/configuration-not-found") {
    return "Authentication is not configured for this Firebase project. In Firebase Console, enable Authentication and turn on Email/Password sign-in for the production project.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Email/Password sign-in is disabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.";
  }

  return (error as Error)?.message ?? "Authentication failed. Please try again.";
}

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
  try {
    return await signInWithEmailAndPassword(authClient, email.trim(), password);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
}

export async function signup(
  displayName: string,
  email: string,
  password: string,
) {
  const authClient = requireAuth();
  try {
    const credential = await createUserWithEmailAndPassword(
      authClient,
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName });
    return credential;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
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
