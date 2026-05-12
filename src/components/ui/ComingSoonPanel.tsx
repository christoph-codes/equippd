import { StyleSheet, Text } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { colors } from '@/src/theme/colors';

type Props = {
  title: string;
  description: string;
};

export function ComingSoonPanel({ title, description }: Props) {
  return (
    <Card>
      <Text style={styles.badge}>Coming Soon</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: {
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
