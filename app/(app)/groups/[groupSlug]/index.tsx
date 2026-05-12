import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { NoteCard } from '@/src/components/cards/NoteCard';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { Group, Note } from '@/src/models/types';
import { fetchGroupBySlug } from '@/src/services/firebase/groups';
import { fetchNotesByGroup } from '@/src/services/firebase/notes';

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ groupSlug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!params.groupSlug || !user) {
      return;
    }

    void Promise.all([fetchGroupBySlug(params.groupSlug), fetchNotesByGroup(user.uid, params.groupSlug)]).then(
      ([nextGroup, nextNotes]) => {
        setGroup(nextGroup);
        setNotes(nextNotes);
      }
    );
  }, [params.groupSlug, user]);

  return (
    <ScreenContainer>
      <SectionHeader title={group?.name ?? 'Group'} subtitle={group?.description} />
      <Button
        label="View studies"
        onPress={() => router.push(`/(app)/groups/${params.groupSlug}/studies`)}
      />

      <SectionHeader title="Recent Group Notes" />
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
