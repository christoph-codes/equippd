import { Timestamp, collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

import { Group } from '@/src/models/types';
import { db } from '@/src/services/firebase/app';
import { fetchGroupsBySlug, mapGroup } from '@/src/services/firebase/firestore';

export const DEFAULT_GROUP_SLUG = 'the-fellas';

function formatTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function requireDb() {
  if (!db) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* variables.');
  }

  return db;
}

export async function ensureDefaultGroup() {
  const dbClient = requireDb();
  const existing = await fetchGroupsBySlug(DEFAULT_GROUP_SLUG);

  if (existing.length > 0) {
    return existing[0];
  }

  const ref = doc(collection(dbClient, 'groups'));
  await setDoc(ref, {
    name: 'The Fellas',
    slug: DEFAULT_GROUP_SLUG,
    description: 'A men’s Bible study group under the Equippd organization',
    organization: 'Equippd',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const created = await getDoc(ref);
  return {
    id: created.id,
    ...(created.data() as Omit<Group, 'id'>),
  };
}

export async function ensureDefaultMembership(userId: string) {
  const dbClient = requireDb();
  const defaultGroup = await ensureDefaultGroup();
  const memberRef = doc(dbClient, 'groups', defaultGroup.id, 'members', userId);

  await setDoc(
    memberRef,
    {
      userId,
      role: 'member',
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return defaultGroup;
}

export async function fetchUserGroups(userId: string) {
  const dbClient = requireDb();
  const membershipSnapshot = await getDocs(
    query(collectionGroup(dbClient, 'members'), where('userId', '==', userId))
  );

  const groups = await Promise.all(
    membershipSnapshot.docs.map(async (membership) => {
      const groupRef = membership.ref.parent.parent;
      if (!groupRef) {
        return null;
      }
      const groupSnapshot = await getDoc(groupRef);
      if (!groupSnapshot.exists()) {
        return null;
      }
      const data = groupSnapshot.data();
      return {
        id: groupSnapshot.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        organization: data.organization,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      } as Group;
    })
  );

  return groups.filter(Boolean) as Group[];
}

export async function fetchAllGroups() {
  const dbClient = requireDb();
  const snapshot = await getDocs(collection(dbClient, 'groups'));
  return snapshot.docs.map(mapGroup);
}

export async function fetchAccessibleGroups(userId: string, isAdmin: boolean) {
  return isAdmin ? fetchAllGroups() : fetchUserGroups(userId);
}

export async function fetchGroupBySlug(slug: string) {
  const groups = await fetchGroupsBySlug(slug);
  return groups[0] ?? null;
}
