import { initializeApp } from 'firebase/app';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const required = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
}

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const groupsRef = collection(db, 'groups');
const existing = await getDocs(query(groupsRef, where('slug', '==', 'the-fellas')));

if (!existing.empty) {
  console.log('The Fellas already exists.');
  process.exit(0);
}

await addDoc(groupsRef, {
  name: 'The Fellas',
  slug: 'the-fellas',
  description: 'A men’s Bible study group under the Equippd organization',
  organization: 'Equippd',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

console.log('Created The Fellas group.');
