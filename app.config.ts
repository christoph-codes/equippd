import type { ConfigContext, ExpoConfig } from "expo/config";

function readEnv(name: string) {
  return process.env[name];
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;

  return {
    ...base,
    extra: {
      ...(base.extra ?? {}),
      apiKey: readEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
      authDomain: readEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
      projectId: readEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
      storageBucket: readEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
      appId: readEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
      EXPO_PUBLIC_USE_FIREBASE_EMULATORS: readEnv(
        "EXPO_PUBLIC_USE_FIREBASE_EMULATORS",
      ),
      EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: readEnv(
        "EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST",
      ),
      EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: readEnv(
        "EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT",
      ),
      EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST: readEnv(
        "EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST",
      ),
      EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT: readEnv(
        "EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT",
      ),
      EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST: readEnv(
        "EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST",
      ),
      EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT: readEnv(
        "EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT",
      ),
    },
  };
};