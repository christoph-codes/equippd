export type MemberRole = 'member' | 'leader' | 'admin';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
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
  content: string;
};

export type MusicItem = {
  title: string;
  artist: string;
  description: string;
  link: string;
};
