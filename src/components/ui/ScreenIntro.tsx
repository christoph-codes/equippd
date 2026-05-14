import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';

type Props = {
  children: string;
};

export function ScreenIntro({ children }: Props) {
  return (
    <View style={styles.container}>
      <Text numberOfLines={2} style={styles.intro}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    minHeight: 44,
  },
  intro: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
});
