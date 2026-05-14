/**
 * Seed script: creates "The Fellas" group document.
 * Uses the Firebase Admin SDK when targeting the emulator (bypasses security rules).
 * Uses the regular client SDK for cloud (requires appropriate service account / rules).
 *
 * Usage:
 *   npm run seed:group          # auto-detects emulator from EXPO_PUBLIC_USE_FIREBASE_EMULATORS
 */

const required = [
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const useEmulators = /^(1|true|yes|on)$/i.test(process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS ?? '');
const firestoreHost = process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1';
const firestorePort = process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT ?? '8080';

const GROUP = {
  name: 'The Fellas',
  slug: 'the-fellas',
  description: 'A men\u2019s Bible study group under the Equippd organization',
  organization: 'Equippd',
};

if (useEmulators) {
  // Admin SDK bypasses security rules — safe to use against the emulator for seeding.
  process.env.FIRESTORE_EMULATOR_HOST = `${firestoreHost}:${firestorePort}`;
  console.log(`Using Firestore emulator at ${firestoreHost}:${firestorePort}`);

  const { default: admin } = await import('firebase-admin');
  admin.initializeApp({ projectId });
  const db = admin.firestore();

  const existing = await db.collection('groups').where('slug', '==', GROUP.slug).get();
  if (!existing.empty) {
    console.log('The Fellas already exists.');
    process.exit(0);
  }

  await db.collection('groups').add({
    ...GROUP,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Created The Fellas group in emulator.');
} else {
  // Client SDK for cloud — requires all Firebase env vars.
  const clientRequired = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];
  for (const key of clientRequired) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  }

  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, getDocs, addDoc, query, where, serverTimestamp } = await import('firebase/firestore');

  const app = initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });

  const db = getFirestore(app);
  const groupsRef = collection(db, 'groups');
  const existing = await getDocs(query(groupsRef, where('slug', '==', GROUP.slug)));

  if (!existing.empty) {
    console.log('The Fellas already exists.');
    process.exit(0);
  }

  await addDoc(groupsRef, {
    ...GROUP,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('Created The Fellas group in cloud Firestore.');
}
