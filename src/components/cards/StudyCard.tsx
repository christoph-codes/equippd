import { Pressable, StyleSheet, Text } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Study } from '@/src/models/types';
import { colors } from '@/src/theme/colors';

type Props = {
  study: Study;
  onPress: () => void;
};

export function StudyCard({ study, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <Text style={styles.title}>{study.title}</Text>
        <Text style={styles.meta}>{study.scripture}</Text>
        <Text style={styles.description}>{study.description}</Text>
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
  meta: {
    color: colors.accent,
    fontWeight: '600',
  },
  description: {
    color: colors.mutedText,
  },
});
