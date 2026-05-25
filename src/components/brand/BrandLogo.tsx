import { Image } from "expo-image";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { brandAssets } from "@/src/theme/brand";
import { colors } from "@/src/theme/colors";

type Props = {
  width?: number;
};

const logoRatio = 999 / 411;

export function BrandLogo({ width = 140 }: Props) {
  return (
    <View style={[styles.frame, { width, height: width / logoRatio }]}>
      <Image
        contentFit="contain"
        source={brandAssets.primaryLogo}
        style={styles.image}
      />
    </View>
  );
}

export function BrandHeaderTitle({
  title,
  variant = "default",
}: {
  title: string;
  variant?: "default" | "group";
}) {
  const { width } = useWindowDimensions();

  if (variant === "group") {
    return (
      <View style={styles.groupHeaderTitle}>
        <View style={styles.groupSide} />
        <View style={styles.groupCenter}>
          <BrandLogo width={68} />
        </View>
        <View style={styles.groupSide}>
          <Text
            numberOfLines={1}
            style={[styles.headerText, styles.groupHeaderText]}
          >
            {title}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.headerTitle,
        { width: Math.max(Math.min(width - 40, 360), 220) },
      ]}
    >
      <BrandLogo width={68} />
      <View style={styles.headerTextSlot}>
        <Text
          numberOfLines={1}
          style={[styles.headerText, styles.headerTextRight]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: "center",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  headerTitle: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTextSlot: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  headerText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  headerTextRight: {
    textAlign: "right",
  },
  groupHeaderTitle: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  groupSide: {
    flex: 1,
    minWidth: 0,
  },
  groupCenter: {
    alignItems: "center",
    justifyContent: "center",
    width: 82,
  },
  groupHeaderText: {
    textAlign: "right",
  },
});
