import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
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
  __equippdFirebaseBackendDebugLogged?: boolean;
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

  let authClient: Auth;
  try {
    authClient = FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistenceCompat(
        ReactNativeAsyncStorage,
      ) as FirebaseAuth.Persistence,
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/already-initialized") {
      throw error;
    }
    authClient = FirebaseAuth.getAuth(app);
  }
  auth = authClient;
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "failed-precondition") {
      throw error;
    }
    db = getFirestore(app);
  }
  storage = getStorage(app);

  const isDevRuntime =
    typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

  if (isDevRuntime && !emulatorGlobalState.__equippdFirebaseBackendDebugLogged) {
    if (firebaseEmulatorConfig.enabled) {
      console.log(
        `[Firebase] Backend=emulator auth=${firebaseEmulatorConfig.authHost}:${firebaseEmulatorConfig.authPort} firestore=${firebaseEmulatorConfig.firestoreHost}:${firebaseEmulatorConfig.firestorePort} storage=${firebaseEmulatorConfig.storageHost}:${firebaseEmulatorConfig.storagePort}`,
      );
    } else {
      console.log(
        `[Firebase] Backend=cloud project=${firebaseConfig.projectId}`,
      );
    }
    emulatorGlobalState.__equippdFirebaseBackendDebugLogged = true;
  }

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
