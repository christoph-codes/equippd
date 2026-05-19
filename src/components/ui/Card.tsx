import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 16,
  },
});
