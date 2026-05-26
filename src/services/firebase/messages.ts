import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
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

export type MessagePage = {
  messages: ChatMessage[];
  oldestCursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
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

function mapChatMessage(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ChatMessage {
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

export async function fetchChatCandidates(
  userId: string,
): Promise<ThreadUser[]> {
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
  const currentUserThreadRef = doc(
    dbClient,
    "users",
    currentUser.userId,
    "threads",
    threadId,
  );
  const otherUserThreadRef = doc(
    dbClient,
    "users",
    otherUser.userId,
    "threads",
    threadId,
  );
  const initialThreadPayload = {
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
  };
  const participantPayload = {
    participantIds: initialThreadPayload.participantIds,
    participants: initialThreadPayload.participants,
    updatedAt: serverTimestamp(),
  };

  await Promise.all([
    setDoc(threadRef, participantPayload, { merge: true }),
    setDoc(currentUserThreadRef, participantPayload, { merge: true }),
    setDoc(otherUserThreadRef, participantPayload, { merge: true }),
  ]);

  return threadId;
}

export function subscribeToDirectThreads(
  userId: string,
  onData: (threads: MessageThreadSummary[]) => void,
  onError?: (error: Error) => void,
) {
  const dbClient = requireDb();
  const threadsQuery = query(collection(dbClient, "users", userId, "threads"));

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
  pageSize: number,
  onData: (messages: ChatMessage[]) => void,
  onPage?: (page: MessagePage) => void,
  onError?: (error: Error) => void,
) {
  const dbClient = requireDb();
  const messagesQuery = query(
    collection(dbClient, "threads", threadId, "messages"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map(mapChatMessage).reverse();
      onPage?.({
        messages,
        oldestCursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
        hasMore: snapshot.docs.length === pageSize,
      });
      onData(messages);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function fetchOlderThreadMessages(
  threadId: string,
  cursor: QueryDocumentSnapshot<DocumentData>,
  pageSize: number,
): Promise<MessagePage> {
  const dbClient = requireDb();
  const messagesQuery = query(
    collection(dbClient, "threads", threadId, "messages"),
    orderBy("createdAt", "desc"),
    startAfter(cursor),
    limit(pageSize),
  );
  const snapshot = await getDocs(messagesQuery);

  return {
    messages: snapshot.docs.map(mapChatMessage).reverse(),
    oldestCursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
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
  const senderThreadRef = doc(
    dbClient,
    "users",
    input.senderId,
    "threads",
    input.threadId,
  );
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

  const participants = (threadSnapshot.data().participants ?? {}) as Record<
    string,
    { displayName?: string; photoURL?: string | null }
  >;
  const otherUserId =
    participantIds.find((participantId) => participantId !== input.senderId) ??
    input.senderId;
  const otherThreadRef = doc(
    dbClient,
    "users",
    otherUserId,
    "threads",
    input.threadId,
  );

  const messageRef = doc(
    collection(dbClient, "threads", input.threadId, "messages"),
  );
  const batch = writeBatch(dbClient);
  const summaryUpdates = {
    lastMessageText: trimmedText,
    lastMessageSenderId: input.senderId,
    lastMessageAt: serverTimestamp(),
    [`readBy.${input.senderId}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(messageRef, {
    threadId: input.threadId,
    senderId: input.senderId,
    senderDisplayName: input.senderDisplayName,
    participantIds,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  batch.update(threadRef, summaryUpdates);
  batch.set(
    senderThreadRef,
    {
      participantIds: participantIds.sort(),
      participants,
      ...summaryUpdates,
    },
    { merge: true },
  );
  batch.set(
    otherThreadRef,
    {
      participantIds: participantIds.sort(),
      participants,
      ...summaryUpdates,
    },
    { merge: true },
  );

  await batch.commit();
}

export async function markThreadAsRead(threadId: string, userId: string) {
  const dbClient = requireDb();
  const threadRef = doc(dbClient, "threads", threadId);
  const userThreadRef = doc(dbClient, "users", userId, "threads", threadId);
  const batch = writeBatch(dbClient);
  const readUpdates = {
    [`readBy.${userId}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(userThreadRef, readUpdates, { merge: true });
  batch.update(threadRef, readUpdates);

  await batch.commit();
}
