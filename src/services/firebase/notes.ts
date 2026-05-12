import { QueryConstraint, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import { Note } from '@/src/models/types';
import { db } from '@/src/services/firebase/app';
import { mapNote } from '@/src/services/firebase/firestore';

function requireDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.');
  }

  return db;
}

function notesQuery(...clauses: QueryConstraint[]) {
  const dbClient = requireDb();
  return query(collection(dbClient, 'notes'), ...clauses);
}

export async function fetchRecentNotes(userId: string, max = 5): Promise<Note[]> {
  const snapshot = await getDocs(
    notesQuery(where('userId', '==', userId), orderBy('updatedAt', 'desc'), limit(max))
  );

  return snapshot.docs.map(mapNote);
}

export async function fetchNotesByGroup(userId: string, groupSlug: string) {
  const snapshot = await getDocs(
    notesQuery(where('userId', '==', userId), where('groupSlug', '==', groupSlug), orderBy('updatedAt', 'desc'))
  );

  return snapshot.docs.map(mapNote);
}

export async function fetchNotesByStudy(userId: string, groupSlug: string, studySlug: string) {
  const snapshot = await getDocs(
    notesQuery(
      where('userId', '==', userId),
      where('groupSlug', '==', groupSlug),
      where('studySlug', '==', studySlug),
      orderBy('updatedAt', 'desc')
    )
  );

  return snapshot.docs.map(mapNote);
}
