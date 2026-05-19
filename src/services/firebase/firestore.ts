import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  Group,
  Note,
  Song,
  Study,
  StudyEngagement,
  StudyReaction,
  StudyReactionSummary,
  UserProfile,
} from "@/src/models/types";
import { db } from "@/src/services/firebase/app";

function requireDb() {
  if (!db) {
    throw new Error(
      "Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.",
    );
  }

  return db;
}

function formatTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

export async function upsertUserProfile(
  profile: Pick<UserProfile, "uid" | "displayName" | "email"> & {
    photoURL?: string | null;
  },
) {
  const dbClient = requireDb();
  const ref = doc(dbClient, "users", profile.uid);
  const snapshot = await getDoc(ref);

  await setDoc(
    ref,
    {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL ?? null,
      createdAt: snapshot.exists()
        ? snapshot.data().createdAt
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchUserProfile(userId: string) {
  const dbClient = requireDb();
  const snapshot = await getDoc(doc(dbClient, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    uid: data.uid,
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL ?? null,
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
  const snapshot = await getDocs(
    query(collection(dbClient, "groups"), where("slug", "==", slug)),
  );
  return snapshot.docs.map(mapGroup);
}

export async function fetchNoteById(noteId: string) {
  const dbClient = requireDb();
  const snapshot = await getDoc(doc(dbClient, "notes", noteId));

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

export async function saveNote(
  note: Omit<Note, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const dbClient = requireDb();

  if (note.id && note.id !== "new") {
    const ref = doc(dbClient, "notes", note.id);
    await updateDoc(ref, {
      ...note,
      updatedAt: serverTimestamp(),
    });
    return note.id;
  }

  const ref = await addDoc(collection(dbClient, "notes"), {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function deleteNote(noteId: string) {
  const dbClient = requireDb();
  await deleteDoc(doc(dbClient, "notes", noteId));
}

function mapStudy(snapshot: QueryDocumentSnapshot<DocumentData>): Study {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    scripture: data.scripture,
    groupSlug: data.groupSlug,
    date: data.date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author,
    content: data.content,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  } satisfies Study;
}

export async function saveStudy(study: Omit<Study, "id"> & { id?: string }) {
  const dbClient = requireDb();

  if (study.id && study.id !== "new") {
    const ref = doc(dbClient, "studies", study.id);
    await updateDoc(ref, {
      ...study,
      updatedAt: serverTimestamp(),
    });
    return study.id;
  }

  const ref = await addDoc(collection(dbClient, "studies"), {
    ...study,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function fetchStudiesByGroup(groupSlug: string) {
  const dbClient = requireDb();
  const snapshot = await getDocs(
    query(collection(dbClient, "studies"), where("groupSlug", "==", groupSlug)),
  );
  return snapshot.docs.map(mapStudy);
}

export async function fetchStudyBySlug(groupSlug: string, studySlug: string) {
  const dbClient = requireDb();
  const snapshot = await getDocs(
    query(
      collection(dbClient, "studies"),
      where("groupSlug", "==", groupSlug),
      where("slug", "==", studySlug),
    ),
  );
  if (snapshot.empty) return null;
  return mapStudy(snapshot.docs[0]);
}

function mapStudyReaction(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): StudyReaction {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    groupSlug: data.groupSlug,
    studySlug: data.studySlug,
    emoji: data.emoji,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

function buildStudyReactionId(
  userId: string,
  groupSlug: string,
  studySlug: string,
  emoji: string,
) {
  return `${groupSlug}:${studySlug}:${userId}:${encodeURIComponent(emoji)}`;
}

export async function fetchStudyReactionSummary(
  groupSlug: string,
  studySlug: string,
  userId?: string,
): Promise<StudyReactionSummary> {
  const dbClient = requireDb();
  const snapshot = await getDocs(
    query(
      collection(dbClient, "studyReactions"),
      where("groupSlug", "==", groupSlug),
      where("studySlug", "==", studySlug),
    ),
  );

  const reactions = snapshot.docs.map(mapStudyReaction);
  const counts: Record<string, number> = {};
  for (const reaction of reactions) {
    counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
  }

  const userEmojis = userId
    ? reactions
        .filter((reaction) => reaction.userId === userId)
        .map((reaction) => reaction.emoji)
    : [];

  return { counts, userEmojis };
}

export async function toggleStudyReaction(
  userId: string,
  groupSlug: string,
  studySlug: string,
  emoji: string,
) {
  const dbClient = requireDb();
  const reactionId = buildStudyReactionId(userId, groupSlug, studySlug, emoji);
  const reactionRef = doc(dbClient, "studyReactions", reactionId);
  const existing = await getDoc(reactionRef);

  if (existing.exists()) {
    await deleteDoc(reactionRef);
    return;
  }

  await setDoc(reactionRef, {
    userId,
    groupSlug,
    studySlug,
    emoji,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchStudyEngagementByGroup(
  groupSlug: string,
): Promise<Record<string, StudyEngagement>> {
  const dbClient = requireDb();
  const [notesSnapshot, reactionsSnapshot] = await Promise.all([
    getDocs(
      query(collection(dbClient, "notes"), where("groupSlug", "==", groupSlug)),
    ),
    getDocs(
      query(
        collection(dbClient, "studyReactions"),
        where("groupSlug", "==", groupSlug),
      ),
    ),
  ]);

  const noteCounts: Record<string, number> = {};
  for (const snapshot of notesSnapshot.docs) {
    const data = snapshot.data();
    if (typeof data.studySlug === "string" && data.studySlug) {
      noteCounts[data.studySlug] = (noteCounts[data.studySlug] ?? 0) + 1;
    }
  }

  const reactionCounts: Record<string, number> = {};
  for (const snapshot of reactionsSnapshot.docs) {
    const data = snapshot.data();
    if (typeof data.studySlug === "string" && data.studySlug) {
      reactionCounts[data.studySlug] =
        (reactionCounts[data.studySlug] ?? 0) + 1;
    }
  }

  const engagement: Record<string, StudyEngagement> = {};
  const slugs = new Set([
    ...Object.keys(noteCounts),
    ...Object.keys(reactionCounts),
  ]);
  for (const slug of slugs) {
    const noteCount = noteCounts[slug] ?? 0;
    const reactionCount = reactionCounts[slug] ?? 0;
    engagement[slug] = {
      noteCount,
      reactionCount,
      total: noteCount + reactionCount,
    };
  }

  return engagement;
}

function mapSong(snapshot: QueryDocumentSnapshot<DocumentData>): Song {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    artist: data.artist,
    submittedBy: data.submittedBy,
    submittedByDisplayName: data.submittedByDisplayName,
    submittedByPhotoURL: data.submittedByPhotoURL ?? undefined,
    status: data.status,
    spotifyUrl: data.spotifyUrl ?? undefined,
    appleMusicUrl: data.appleMusicUrl ?? undefined,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

async function fetchSongsByStatus(
  status: "approved" | "pending",
): Promise<Song[]> {
  const dbClient = requireDb();
  const songsQuery = query(
    collection(dbClient, "songs"),
    where("status", "==", status),
  );

  const snapshot = await (async () => {
    try {
      return await getDocsFromServer(songsQuery);
    } catch {
      return getDocs(songsQuery);
    }
  })();

  const songs = snapshot.docs
    .map(mapSong)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const submitterIds = Array.from(
    new Set(
      songs
        .filter(
          (song) => !song.submittedByPhotoURL || !song.submittedByDisplayName,
        )
        .map((song) => song.submittedBy),
    ),
  );

  if (submitterIds.length === 0) {
    return songs;
  }

  const submitterProfiles = new Map<
    string,
    { displayName?: string; photoURL?: string | null }
  >();

  await Promise.all(
    submitterIds.map(async (submitterId) => {
      const userSnapshot = await getDoc(doc(dbClient, "users", submitterId));
      if (!userSnapshot.exists()) {
        return;
      }

      const userData = userSnapshot.data();
      submitterProfiles.set(submitterId, {
        displayName:
          typeof userData.displayName === "string"
            ? userData.displayName
            : undefined,
        photoURL:
          typeof userData.photoURL === "string" ? userData.photoURL : null,
      });
    }),
  );

  return songs.map((song) => {
    const profile = submitterProfiles.get(song.submittedBy);
    if (!profile) {
      return song;
    }

    return {
      ...song,
      submittedByDisplayName:
        song.submittedByDisplayName || profile.displayName || "Unknown user",
      submittedByPhotoURL:
        song.submittedByPhotoURL || profile.photoURL || undefined,
    };
  });
}

export async function submitSong(
  userId: string,
  userDisplayName: string,
  title: string,
  artist: string,
  spotifyUrl?: string,
  appleMusicUrl?: string,
  isAdmin: boolean = false,
  userPhotoURL?: string,
) {
  const dbClient = requireDb();
  await addDoc(collection(dbClient, "songs"), {
    title,
    artist,
    submittedBy: userId,
    submittedByDisplayName: userDisplayName,
    submittedByPhotoURL: userPhotoURL ?? null,
    status: isAdmin ? "approved" : "pending",
    spotifyUrl: spotifyUrl ?? null,
    appleMusicUrl: appleMusicUrl ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchApprovedSongs(): Promise<Song[]> {
  return fetchSongsByStatus("approved");
}

export async function fetchPendingSongs(): Promise<Song[]> {
  return fetchSongsByStatus("pending");
}

export async function approveSong(songId: string) {
  const dbClient = requireDb();
  await updateDoc(doc(dbClient, "songs", songId), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
}

export async function rejectSong(songId: string) {
  const dbClient = requireDb();
  await updateDoc(doc(dbClient, "songs", songId), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
}

export async function updateSongLinks(
  songId: string,
  spotifyUrl?: string,
  appleMusicUrl?: string,
) {
  const dbClient = requireDb();
  await updateDoc(doc(dbClient, "songs", songId), {
    spotifyUrl: spotifyUrl ? spotifyUrl.trim() : null,
    appleMusicUrl: appleMusicUrl ? appleMusicUrl.trim() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSong(songId: string) {
  const dbClient = requireDb();
  await deleteDoc(doc(dbClient, "songs", songId));
}
