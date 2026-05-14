import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { NoteCard } from '@/src/components/cards/NoteCard';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { Group, Note } from '@/src/models/types';
import { canAccessGroup, fetchGroupBySlug } from '@/src/services/firebase/groups';
import { fetchNotesByGroup } from '@/src/services/firebase/notes';

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ groupSlug: string }>();
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!params.groupSlug || !user) {
      return;
    }

    setAccessChecked(false);
    void Promise.all([
      fetchGroupBySlug(params.groupSlug),
      canAccessGroup(user.uid, params.groupSlug, isAdmin),
    ]).then(([nextGroup, nextHasAccess]) => {
      setGroup(nextGroup);
      setHasAccess(nextHasAccess);
      setAccessChecked(true);

      if (nextHasAccess) {
        void fetchNotesByGroup(user.uid, params.groupSlug, isAdmin).then((nextNotes) => {
          setNotes(nextNotes);
        });
      } else {
        setNotes([]);
      }
    });
  }, [isAdmin, params.groupSlug, user]);

  if (accessChecked && !hasAccess) {
    return (
      <ScreenContainer>
        <SectionHeader title={group?.name ?? 'Group'} subtitle={group?.description} />
        <EmptyState title="Access required" description="Request access to this group before opening studies and notes." />
        <Button label="Browse groups" onPress={() => router.replace('/(app)/groups')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader title={group?.name ?? 'Group'} subtitle={group?.description} />
      <Button
        label="View studies"
        onPress={() => router.push(`/(app)/groups/${params.groupSlug}/studies`)}
      />

      <SectionHeader title={isAdmin ? 'All Recent Group Notes' : 'Recent Group Notes'} />
      {notes.length ? (
        notes.map((note) => (
          <NoteCard key={note.id} note={note} onPress={() => router.push(`/(app)/notes/${note.id}`)} />
        ))
      ) : (
        <EmptyState title="No notes yet" description="Group notes tied to this group will appear here." />
      )}
    </ScreenContainer>
  );
}
