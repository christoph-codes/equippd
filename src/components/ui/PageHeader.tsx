import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

type Props = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    color: colors.text,
    ...typography.display,
  },
  subtitle: {
    color: colors.mutedText,
    ...typography.bodySmall,
  },
});
