import { StyleSheet, Text } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { colors } from '@/src/theme/colors';

type Props = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
