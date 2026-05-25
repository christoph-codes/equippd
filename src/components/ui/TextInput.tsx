import {
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TextInputProps,
  View,
} from "react-native";

import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

type Props = TextInputProps & {
  label: string;
};

export function TextInput({ label, ...rest }: Props) {
  const { style, ...inputProps } = rest;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        placeholderTextColor={colors.mutedText}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: colors.mutedText,
    ...typography.labelCaps,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    color: colors.text,
    backgroundColor: colors.surface,
    ...typography.body,
  },
});
