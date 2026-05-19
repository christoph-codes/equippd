import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import {
  FirebaseStorage,
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";

import {
  firebaseConfig,
  firebaseEmulatorConfig,
  isFirebaseConfigured,
} from "@/src/services/firebase/config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

type EmulatorGlobalState = {
  __equippdFirebaseEmulatorsConnected?: boolean;
};

const emulatorGlobalState = globalThis as typeof globalThis &
  EmulatorGlobalState;

const getReactNativePersistenceCompat = (
  FirebaseAuth as unknown as {
    getReactNativePersistence?: (
      storage: typeof ReactNativeAsyncStorage,
    ) => unknown;
  }
).getReactNativePersistence;

if (isFirebaseConfigured()) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (!getReactNativePersistenceCompat) {
    throw new Error(
      "Firebase React Native persistence helper is unavailable in this SDK build.",
    );
  }

  const authClient = FirebaseAuth.initializeAuth(app, {
    persistence: getReactNativePersistenceCompat(
      ReactNativeAsyncStorage,
    ) as FirebaseAuth.Persistence,
  });
  auth = authClient;
  db = getFirestore(app);
  storage = getStorage(app);

  if (
    firebaseEmulatorConfig.enabled &&
    !emulatorGlobalState.__equippdFirebaseEmulatorsConnected
  ) {
    FirebaseAuth.connectAuthEmulator(
      authClient,
      `http://${firebaseEmulatorConfig.authHost}:${firebaseEmulatorConfig.authPort}`,
      {
        disableWarnings: true,
      },
    );
    connectFirestoreEmulator(
      db,
      firebaseEmulatorConfig.firestoreHost,
      firebaseEmulatorConfig.firestorePort,
    );
    connectStorageEmulator(
      storage,
      firebaseEmulatorConfig.storageHost,
      firebaseEmulatorConfig.storagePort,
    );
    emulatorGlobalState.__equippdFirebaseEmulatorsConnected = true;
  }
}

export const firebaseApp = app;
export { auth, db, storage };
