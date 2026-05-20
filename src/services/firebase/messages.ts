import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  ChatMessage,
  MessageThreadSummary,
  ThreadParticipant,
} from "@/src/models/types";
import { db } from "@/src/services/firebase/app";

type ThreadUser = {
  userId: string;
  displayName: string;
  photoURL?: string | null;
};

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

function toMillis(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function buildDirectThreadId(userA: string, userB: string) {
  return [userA, userB].sort().join("__");
}

function mapThreadSummary(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  userId: string,
): MessageThreadSummary {
  const data = snapshot.data();
  const participantIds = Array.isArray(data.participantIds)
    ? (data.participantIds as string[])
    : [];
  const otherUserId =
    participantIds.find((participantId) => participantId !== userId) ?? userId;
  const participants = (data.participants ?? {}) as Record<
    string,
    { displayName?: string; photoURL?: string | null }
  >;
  const otherParticipantData = participants[otherUserId] ?? {};
  const otherParticipant: ThreadParticipant = {
    userId: otherUserId,
    displayName: otherParticipantData.displayName ?? "Unknown user",
    photoURL: otherParticipantData.photoURL ?? null,
  };

  const lastMessageAt = formatTimestamp(data.lastMessageAt);
  const lastReadAtRaw =
    data.readBy && typeof data.readBy === "object" ? data.readBy[userId] : null;
  const lastReadAt =
    lastReadAtRaw === null || lastReadAtRaw === undefined
      ? null
      : formatTimestamp(lastReadAtRaw);
  const lastMessageSenderId = (data.lastMessageSenderId as string) ?? "";

  return {
    id: snapshot.id,
    participantIds,
    otherParticipant,
    lastMessageText: (data.lastMessageText as string) ?? "",
    lastMessageSenderId,
    lastMessageAt,
    lastReadAt,
    unread:
      Boolean(lastMessageSenderId) &&
      lastMessageSenderId !== userId &&
      toMillis(lastReadAt) < toMillis(lastMessageAt),
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

function mapThreadSummaryFromData(
  threadId: string,
  data: DocumentData,
  userId: string,
): MessageThreadSummary {
  const participantIds = Array.isArray(data.participantIds)
    ? (data.participantIds as string[])
    : [];
  const otherUserId =
    participantIds.find((participantId) => participantId !== userId) ?? userId;
  const participants = (data.participants ?? {}) as Record<
    string,
    { displayName?: string; photoURL?: string | null }
  >;
  const otherParticipantData = participants[otherUserId] ?? {};
  const otherParticipant: ThreadParticipant = {
    userId: otherUserId,
    displayName: otherParticipantData.displayName ?? "Unknown user",
    photoURL: otherParticipantData.photoURL ?? null,
  };

  const lastMessageAt = formatTimestamp(data.lastMessageAt);
  const lastReadAtRaw =
    data.readBy && typeof data.readBy === "object" ? data.readBy[userId] : null;
  const lastReadAt =
    lastReadAtRaw === null || lastReadAtRaw === undefined
      ? null
      : formatTimestamp(lastReadAtRaw);
  const lastMessageSenderId = (data.lastMessageSenderId as string) ?? "";

  return {
    id: threadId,
    participantIds,
    otherParticipant,
    lastMessageText: (data.lastMessageText as string) ?? "",
    lastMessageSenderId,
    lastMessageAt,
    lastReadAt,
    unread:
      Boolean(lastMessageSenderId) &&
      lastMessageSenderId !== userId &&
      toMillis(lastReadAt) < toMillis(lastMessageAt),
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
}

function mapChatMessage(snapshot: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    threadId: data.threadId,
    senderId: data.senderId,
    senderDisplayName: data.senderDisplayName,
    text: data.text,
    createdAt: formatTimestamp(data.createdAt),
  };
}

export async function fetchChatCandidates(userId: string): Promise<ThreadUser[]> {
  const dbClient = requireDb();
  const snapshot = await getDocs(collection(dbClient, "users"));

  return snapshot.docs
    .map((userDoc) => {
      const data = userDoc.data();
      return {
        userId: userDoc.id,
        displayName: (data.displayName as string) ?? "Unknown user",
        photoURL: (data.photoURL as string | null | undefined) ?? null,
      };
    })
    .filter((candidate) => candidate.userId !== userId)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function ensureDirectThread(
  currentUser: ThreadUser,
  otherUser: ThreadUser,
) {
  const dbClient = requireDb();
  const threadId = buildDirectThreadId(currentUser.userId, otherUser.userId);
  const threadRef = doc(dbClient, "threads", threadId);
  const existingThread = await getDoc(threadRef);

  if (existingThread.exists()) {
    return threadId;
  }

  await setDoc(
    threadRef,
    {
      participantIds: [currentUser.userId, otherUser.userId].sort(),
      participants: {
        [currentUser.userId]: {
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL ?? null,
        },
        [otherUser.userId]: {
          displayName: otherUser.displayName,
          photoURL: otherUser.photoURL ?? null,
        },
      },
      lastMessageText: "",
      lastMessageSenderId: "",
      lastMessageAt: serverTimestamp(),
      readBy: {
        [currentUser.userId]: serverTimestamp(),
        [otherUser.userId]: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return threadId;
}

export function subscribeToDirectThreads(
  userId: string,
  onData: (threads: MessageThreadSummary[]) => void,
  onError?: (error: Error) => void,
) {
  const dbClient = requireDb();
  const threadsQuery = query(
    collection(dbClient, "threads"),
    where("participantIds", "array-contains", userId),
  );

  return onSnapshot(
    threadsQuery,
    (snapshot) => {
      const threads = snapshot.docs
        .map((threadSnapshot) => mapThreadSummary(threadSnapshot, userId))
        .sort((a, b) => toMillis(b.lastMessageAt) - toMillis(a.lastMessageAt));
      onData(threads);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeToThreadSummary(
  threadId: string,
  userId: string,
  onData: (thread: MessageThreadSummary | null) => void,
  onError?: (error: Error) => void,
) {
  const dbClient = requireDb();
  const threadRef = doc(dbClient, "threads", threadId);

  return onSnapshot(
    threadRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(mapThreadSummaryFromData(snapshot.id, snapshot.data(), userId));
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeToThreadMessages(
  threadId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
) {
  const dbClient = requireDb();
  const messagesQuery = query(collection(dbClient, "threads", threadId, "messages"));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map(mapChatMessage)
        .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      onData(messages);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function sendMessageToThread(input: {
  threadId: string;
  senderId: string;
  senderDisplayName: string;
  text: string;
}) {
  const dbClient = requireDb();
  const trimmedText = input.text.trim();

  if (!trimmedText) {
    return;
  }

  const threadRef = doc(dbClient, "threads", input.threadId);
  const threadSnapshot = await getDoc(threadRef);
  if (!threadSnapshot.exists()) {
    throw new Error("Message thread not found.");
  }

  const participantIds = Array.isArray(threadSnapshot.data().participantIds)
    ? (threadSnapshot.data().participantIds as string[])
    : [];

  if (!participantIds.includes(input.senderId)) {
    throw new Error("You do not have access to this thread.");
  }

  const messageRef = doc(collection(dbClient, "threads", input.threadId, "messages"));
  const batch = writeBatch(dbClient);

  batch.set(messageRef, {
    threadId: input.threadId,
    senderId: input.senderId,
    senderDisplayName: input.senderDisplayName,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  batch.update(threadRef, {
    lastMessageText: trimmedText,
    lastMessageSenderId: input.senderId,
    lastMessageAt: serverTimestamp(),
    [`readBy.${input.senderId}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function markThreadAsRead(threadId: string, userId: string) {
  const dbClient = requireDb();
  const threadRef = doc(dbClient, "threads", threadId);
  await updateDoc(threadRef, {
    [`readBy.${userId}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
