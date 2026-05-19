import Constants from "expo-constants";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;

function readConfigValue(key: keyof FirebaseConfig, envKey: string) {
  return process.env[envKey] ?? extra[key] ?? "";
}

function readEnvValue(envKey: string) {
  return process.env[envKey] ?? extra[envKey] ?? "";
}

function parseBoolean(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: readConfigValue("apiKey", "EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readConfigValue("authDomain", "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readConfigValue("projectId", "EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readConfigValue(
    "storageBucket",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ),
  messagingSenderId: readConfigValue(
    "messagingSenderId",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: readConfigValue("appId", "EXPO_PUBLIC_FIREBASE_APP_ID"),
};

const hasExplicitEmulatorToggle =
  readEnvValue("EXPO_PUBLIC_USE_FIREBASE_EMULATORS") !== "";
const isDevRuntime =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

export const firebaseEmulatorConfig = {
  // Default to emulators in development to prevent accidental writes to cloud data.
  enabled: hasExplicitEmulatorToggle
    ? parseBoolean(readEnvValue("EXPO_PUBLIC_USE_FIREBASE_EMULATORS"))
    : isDevRuntime,
  authHost:
    readEnvValue("EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST") || "127.0.0.1",
  authPort: parsePort(
    readEnvValue("EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT"),
    9099,
  ),
  firestoreHost:
    readEnvValue("EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST") || "127.0.0.1",
  firestorePort: parsePort(
    readEnvValue("EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT"),
    8080,
  ),
  storageHost:
    readEnvValue("EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST") || "127.0.0.1",
  storagePort: parsePort(
    readEnvValue("EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT"),
    9199,
  ),
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}
