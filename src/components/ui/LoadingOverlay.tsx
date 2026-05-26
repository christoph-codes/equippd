import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors } from "@/src/theme/colors";

const icon = require("../../../assets/images/equippd-icon-desert.svg");

// SVG natural dimensions: 219 × 346 → ratio ≈ 1.58
const ICON_WIDTH = 36;
const ICON_HEIGHT = Math.round(ICON_WIDTH * (346 / 219));

type Props = {
  visible: boolean;
  /** Fill the full screen instead of overlaying existing content */
  fullScreen?: boolean;
};

export function LoadingOverlay({ visible, fullScreen = false }: Props) {
  const [mounted, setMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 0 : 0)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Keep mounted whenever visible becomes true
  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (visible) {
      // Fade in then begin pulse loop
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        );
        pulseRef.current.start();
      });
    } else {
      // Stop pulse and fade out, then unmount
      pulseRef.current?.stop();
      pulseRef.current = null;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }

    return () => {
      pulseRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, fullScreen && styles.fullScreen]}
    >
      <Animated.View style={{ opacity }}>
        <Image contentFit="contain" source={icon} style={styles.icon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(48, 42, 36, 1.00)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  fullScreen: {
    backgroundColor: colors.background,
  },
  icon: {
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
  },
});
