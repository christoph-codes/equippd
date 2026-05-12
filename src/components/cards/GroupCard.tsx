import { Pressable, StyleSheet, Text } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Group } from '@/src/models/types';
import { colors } from '@/src/theme/colors';

type Props = {
  group: Group;
  onPress: () => void;
};

export function GroupCard({ group, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.org}>{group.organization}</Text>
        <Text style={styles.description}>{group.description}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  org: {
    color: colors.accent,
    fontWeight: '600',
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
