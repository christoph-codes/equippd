import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { NoteCard } from '@/src/components/cards/NoteCard';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { Note } from '@/src/models/types';
import { loadStudy } from '@/src/services/content/mdx';
import { fetchNotesByStudy } from '@/src/services/firebase/notes';
import { colors } from '@/src/theme/colors';

export default function StudyDetailScreen() {
  const { groupSlug, studySlug } = useLocalSearchParams<{ groupSlug: string; studySlug: string }>();
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);

  const study = useMemo(() => loadStudy(groupSlug, studySlug), [groupSlug, studySlug]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchNotesByStudy(user.uid, groupSlug, studySlug, isAdmin).then(setNotes);
  }, [groupSlug, isAdmin, studySlug, user]);

  if (!study) {
    return (
      <ScreenContainer>
        <EmptyState title="Study not found" description="Check the MDX frontmatter slug and groupSlug." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader title={study.title} subtitle={`${study.scripture} • ${study.author}`} />
      <Text style={styles.description}>{study.description}</Text>
      <Markdown style={markdownStyles}>{study.content}</Markdown>

      <Button
        label="Add note"
        onPress={() =>
          router.push({
            pathname: '/(app)/notes/[noteId]',
            params: {
              noteId: 'new',
              groupSlug,
              studySlug,
              title: study.title,
            },
          })
        }
      />

      <SectionHeader title={isAdmin ? 'All Study Notes' : 'Your study notes'} />
      {notes.length ? (
        notes.map((note) => (
          <NoteCard key={note.id} note={note} onPress={() => router.push(`/(app)/notes/${note.id}`)} />
        ))
      ) : (
        <EmptyState title="No notes yet" description="Capture key insight from this study." />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});

const markdownStyles = {
  body: {
    color: colors.text,
  },
  heading2: {
    color: colors.text,
    marginBottom: 8,
  },
  heading3: {
    color: colors.text,
  },
  bullet_list: {
    color: colors.mutedText,
  },
};
