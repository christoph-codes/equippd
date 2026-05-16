import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  size?: "default" | "small";
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "default",
  disabled,
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        size === "small" && styles.small,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" && styles.primaryLabel,
          (variant === "ghost" || variant === "danger") && styles.ghostLabel,
          size === "small" && styles.smallLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.surfaceAlt,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  label: {
    fontWeight: "700",
  },
  small: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  smallLabel: {
    fontSize: 14,
  },
  primaryLabel: {
    color: colors.accentText,
  },
  ghostLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
