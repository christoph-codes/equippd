import { Pressable, StyleSheet, Text } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Note } from '@/src/models/types';
import { colors } from '@/src/theme/colors';

type Props = {
  note: Note;
  onPress?: () => void;
};

export function NoteCard({ note, onPress }: Props) {
  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <Card>
        <Text style={styles.title}>{note.title}</Text>
        <Text numberOfLines={3} style={styles.body}>
          {note.body}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
