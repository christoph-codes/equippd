import { StyleSheet, Text, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/src/theme/colors';

type Props = TextInputProps & {
  label: string;
};

export function TextInput({ label, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput placeholderTextColor={colors.mutedText} style={styles.input} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
