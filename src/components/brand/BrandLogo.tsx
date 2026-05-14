import { Image } from 'expo-image';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/src/theme/colors';

type Props = {
  width?: number;
};

const logo = require('../../../assets/images/equippd_logo_desert.svg');
const logoRatio = 999 / 411;

export function BrandLogo({ width = 140 }: Props) {
  return (
    <View style={[styles.frame, { width, height: width / logoRatio }]}>
      <Image contentFit="contain" source={logo} style={styles.image} />
    </View>
  );
}

export function BrandHeaderTitle({ title }: { title: string }) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.headerTitle, { width: Math.max(width - 32, 240) }]}>
      <BrandLogo width={68} />
      <Text numberOfLines={1} style={styles.headerText}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  headerTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
});
