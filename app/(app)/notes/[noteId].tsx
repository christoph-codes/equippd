import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { TextInput } from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchNoteById, saveNote } from '@/src/services/firebase/firestore';
import { colors } from '@/src/theme/colors';

export default function NoteEditorScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId: string; groupSlug?: string; studySlug?: string; title?: string }>();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [groupSlug, setGroupSlug] = useState('');
  const [studySlug, setStudySlug] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.noteId === 'new') {
      setTitle(params.title ? `Notes: ${params.title}` : 'Study Notes');
      setGroupSlug(params.groupSlug ?? 'the-fellas');
      setStudySlug(params.studySlug ?? 'sample-study');
      return;
    }

    void fetchNoteById(params.noteId).then((note) => {
      if (!note) {
        return;
      }
      setTitle(note.title);
      setBody(note.body);
      setGroupSlug(note.groupSlug);
      setStudySlug(note.studySlug);
    });
  }, [params.groupSlug, params.noteId, params.studySlug, params.title]);

  async function onSave() {
    if (!user) {
      setError('You must be logged in to save notes.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const noteId = await saveNote({
        id: params.noteId,
        userId: user.uid,
        groupSlug,
        studySlug,
        title,
        body,
      });
      router.replace(`/(app)/notes/${noteId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <SectionHeader title={params.noteId === 'new' ? 'Add Note' : 'Edit Note'} subtitle="Personal study reflections" />
      <Card>
        <TextInput label="Title" onChangeText={setTitle} value={title} />
        <TextInput label="Group Slug" onChangeText={setGroupSlug} value={groupSlug} />
        <TextInput label="Study Slug" onChangeText={setStudySlug} value={studySlug} />
        <TextInput label="Body" multiline onChangeText={setBody} style={{ minHeight: 140, textAlignVertical: 'top' }} value={body} />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <Button disabled={saving} label={saving ? 'Saving...' : 'Save note'} onPress={onSave} />
      </Card>
    </ScreenContainer>
  );
}
