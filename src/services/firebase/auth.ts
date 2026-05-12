import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from '@/src/services/firebase/app';

export type AuthListener = (user: User | null) => void;

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.');
  }

  return auth;
}

export async function login(email: string, password: string) {
  const authClient = requireAuth();
  return signInWithEmailAndPassword(authClient, email.trim(), password);
}

export async function signup(displayName: string, email: string, password: string) {
  const authClient = requireAuth();
  const credential = await createUserWithEmailAndPassword(authClient, email.trim(), password);
  await updateProfile(credential.user, { displayName });
  return credential;
}

export async function logout() {
  return signOut(requireAuth());
}

export function subscribeToAuth(listener: AuthListener) {
  if (!auth) {
    listener(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, listener);
}
