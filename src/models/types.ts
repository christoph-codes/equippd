export type MemberRole = "member" | "leader" | "admin";
export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  role?: MemberRole;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  slug: string;
  description: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupMembership = {
  userId: string;
  role: MemberRole;
  joinedAt: string;
};

export type GroupAccessRequest = {
  id: string;
  groupId: string;
  groupSlug: string;
  groupName: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  status: AccessRequestStatus;
  requestedAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  userId: string;
  groupSlug: string;
  studySlug: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyFrontmatter = {
  title: string;
  slug: string;
  description: string;
  scripture: string;
  groupSlug: string;
  date: string;
  tags: string[];
  author: string;
};

export type Study = StudyFrontmatter & {
  id?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StudyReaction = {
  id: string;
  userId: string;
  groupSlug: string;
  studySlug: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyReactionSummary = {
  counts: Record<string, number>;
  userEmojis: string[];
};

export type StudyEngagement = {
  noteCount: number;
  reactionCount: number;
  total: number;
};

export type SongStatus = "pending" | "approved" | "rejected";

export type Song = {
  id: string;
  title: string;
  artist: string;
  submittedBy: string;
  submittedByDisplayName: string;
  submittedByPhotoURL?: string;
  status: SongStatus;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ThreadParticipant = {
  userId: string;
  displayName: string;
  photoURL?: string | null;
};

export type MessageThreadSummary = {
  id: string;
  participantIds: string[];
  otherParticipant: ThreadParticipant;
  lastMessageText: string;
  lastMessageSenderId: string;
  lastMessageAt: string;
  lastReadAt: string | null;
  unread: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderDisplayName: string;
  text: string;
  createdAt: string;
};
