import Constants from 'expo-constants';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function readConfigValue(key: keyof FirebaseConfig, envKey: string) {
  return process.env[envKey] ?? extra[key] ?? '';
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: readConfigValue('apiKey', 'EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readConfigValue('authDomain', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readConfigValue('projectId', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readConfigValue('storageBucket', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readConfigValue('messagingSenderId', 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readConfigValue('appId', 'EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}
