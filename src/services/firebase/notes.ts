import {
  QueryConstraint,
  collection,
  getDocs,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { Note } from "@/src/models/types";
import { db } from "@/src/services/firebase/app";
import { mapNote } from "@/src/services/firebase/firestore";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.",
    );
  }

  return db;
}

function notesQuery(...clauses: QueryConstraint[]) {
  const dbClient = requireDb();
  return query(collection(dbClient, "notes"), ...clauses);
}

async function fetchNotesSnapshot(...clauses: QueryConstraint[]) {
  const q = notesQuery(...clauses);

  try {
    // Pull-to-refresh should surface remote edits immediately.
    return await getDocsFromServer(q);
  } catch {
    // Fallback keeps notes usable when temporarily offline.
    return getDocs(q);
  }
}

export async function fetchRecentNotes(
  userId: string,
  max = 5,
  includeAll = false,
): Promise<Note[]> {
  const clauses = includeAll
    ? [orderBy("updatedAt", "desc"), limit(max)]
    : [where("userId", "==", userId), orderBy("updatedAt", "desc"), limit(max)];
  const snapshot = await fetchNotesSnapshot(...clauses);

  return snapshot.docs.map(mapNote);
}

export async function fetchAllNotes(
  userId: string,
  includeAll = false,
): Promise<Note[]> {
  const clauses = includeAll
    ? [orderBy("updatedAt", "desc")]
    : [where("userId", "==", userId), orderBy("updatedAt", "desc")];
  const snapshot = await fetchNotesSnapshot(...clauses);

  return snapshot.docs.map(mapNote);
}

export async function fetchNotesByGroup(
  userId: string,
  groupSlug: string,
  includeAll = false,
) {
  const clauses = includeAll
    ? [where("groupSlug", "==", groupSlug), orderBy("updatedAt", "desc")]
    : [
        where("userId", "==", userId),
        where("groupSlug", "==", groupSlug),
        orderBy("updatedAt", "desc"),
      ];
  const snapshot = await fetchNotesSnapshot(...clauses);

  return snapshot.docs.map(mapNote);
}

export async function fetchNotesByStudy(
  userId: string,
  groupSlug: string,
  studySlug: string,
  includeAll = false,
) {
  const clauses = includeAll
    ? [
        where("groupSlug", "==", groupSlug),
        where("studySlug", "==", studySlug),
        orderBy("updatedAt", "desc"),
      ]
    : [
        where("userId", "==", userId),
        where("groupSlug", "==", groupSlug),
        where("studySlug", "==", studySlug),
        orderBy("updatedAt", "desc"),
      ];
  const snapshot = await fetchNotesSnapshot(...clauses);

  return snapshot.docs.map(mapNote);
}
