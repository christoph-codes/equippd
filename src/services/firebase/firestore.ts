import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { Group, Note, UserProfile } from '@/src/models/types';
import { db } from '@/src/services/firebase/app';

function requireDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.');
  }

  return db;
}

function formatTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return new Date().toISOString();
}

export async function upsertUserProfile(profile: Pick<UserProfile, 'uid' | 'displayName' | 'email'>) {
  const dbClient = requireDb();
  const ref = doc(dbClient, 'users', profile.uid);
  const snapshot = await getDoc(ref);

  await setDoc(
    ref,
    {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function fetchUserProfile(userId: string) {
  const dbClient = requireDb();
  const snapshot = await getDoc(doc(dbClient, 'users', userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid: data.uid,
    displayName: data.displayName,
    email: data.email,
    role: data.role,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  } as UserProfile;
}

export function mapGroup(snapshot: QueryDocumentSnapshot<DocumentData>): Group {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    organization: data.organization,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

export function mapNote(snapshot: QueryDocumentSnapshot<DocumentData>): Note {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    groupSlug: data.groupSlug,
    studySlug: data.studySlug,
    title: data.title,
    body: data.body,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

export async function fetchGroupsBySlug(slug: string) {
  const dbClient = requireDb();
  const snapshot = await getDocs(query(collection(dbClient, 'groups'), where('slug', '==', slug)));
  return snapshot.docs.map(mapGroup);
}

export async function fetchNoteById(noteId: string) {
  const dbClient = requireDb();
  const snapshot = await getDoc(doc(dbClient, 'notes', noteId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    groupSlug: data.groupSlug,
    studySlug: data.studySlug,
    title: data.title,
    body: data.body,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  } as Note;
}

export async function saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const dbClient = requireDb();

  if (note.id && note.id !== 'new') {
    const ref = doc(dbClient, 'notes', note.id);
    await updateDoc(ref, {
      ...note,
      updatedAt: serverTimestamp(),
    });
    return note.id;
  }

  const ref = await addDoc(collection(dbClient, 'notes'), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}
