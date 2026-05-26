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

const env = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  useFirebaseEmulators: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
  authEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
  authEmulatorPort: process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT,
  firestoreEmulatorHost:
    process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST,
  firestoreEmulatorPort:
    process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT,
  storageEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
  storageEmulatorPort: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT,
};

function readConfigValue(
  key: keyof FirebaseConfig,
  envValue: string | undefined,
) {
  return envValue ?? extra[key] ?? "";
}

function readEnvValue(extraKey: string, envValue: string | undefined) {
  return envValue ?? extra[extraKey] ?? "";
}

function parseBoolean(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: readConfigValue("apiKey", env.apiKey),
  authDomain: readConfigValue("authDomain", env.authDomain),
  projectId: readConfigValue("projectId", env.projectId),
  storageBucket: readConfigValue("storageBucket", env.storageBucket),
  messagingSenderId: readConfigValue(
    "messagingSenderId",
    env.messagingSenderId,
  ),
  appId: readConfigValue("appId", env.appId),
};

const hasExplicitEmulatorToggle =
  readEnvValue(
    "EXPO_PUBLIC_USE_FIREBASE_EMULATORS",
    env.useFirebaseEmulators,
  ) !== "";
const isDevRuntime =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

export const firebaseEmulatorConfig = {
  // Default to emulators in development to prevent accidental writes to cloud data.
  enabled: isDevRuntime
    ? hasExplicitEmulatorToggle
      ? parseBoolean(
          readEnvValue(
            "EXPO_PUBLIC_USE_FIREBASE_EMULATORS",
            env.useFirebaseEmulators,
          ),
        )
      : true
    : false,
  authHost:
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST",
      env.authEmulatorHost,
    ) || "127.0.0.1",
  authPort: parsePort(
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT",
      env.authEmulatorPort,
    ),
    9099,
  ),
  firestoreHost:
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST",
      env.firestoreEmulatorHost,
    ) || "127.0.0.1",
  firestorePort: parsePort(
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT",
      env.firestoreEmulatorPort,
    ),
    8080,
  ),
  storageHost:
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST",
      env.storageEmulatorHost,
    ) || "127.0.0.1",
  storagePort: parsePort(
    readEnvValue(
      "EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT",
      env.storageEmulatorPort,
    ),
    9199,
  ),
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}
