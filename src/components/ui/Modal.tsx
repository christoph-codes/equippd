import { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  Modal as RNModal,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type Props = PropsWithChildren<{
  visible: boolean;
  onRequestClose: () => void;
  sheetStyle?: StyleProp<ViewStyle>;
  showHandle?: boolean;
  enableSwipeToClose?: boolean;
  swipeDismissAreaHeight?: number;
  closeOnBackdropPress?: boolean;
  backdropColor?: string;
}>;

export function Modal({
  visible,
  onRequestClose,
  sheetStyle,
  showHandle = false,
  enableSwipeToClose = true,
  swipeDismissAreaHeight = 120,
  closeOnBackdropPress = true,
  backdropColor = "rgba(8, 10, 15, 0.45)",
  children,
}: Props) {
  const windowHeight = Dimensions.get("window").height;
  const [mounted, setMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(windowHeight)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableSwipeToClose,
      onStartShouldSetPanResponderCapture: () => enableSwipeToClose,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        enableSwipeToClose && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (!enableSwipeToClose) {
          return false;
        }

        return gesture.dy > 2 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation();
        backdropOpacity.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        const nextTranslate = Math.max(0, gesture.dy);
        sheetTranslateY.setValue(nextTranslate);
        backdropOpacity.setValue(Math.max(0, 1 - nextTranslate / 280));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 140 || gesture.vy > 1.1) {
          onRequestClose();
          return;
        }

        Animated.parallel([
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(windowHeight);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: windowHeight,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, backdropOpacity, sheetTranslateY, windowHeight]);

  if (!mounted) {
    return null;
  }

  return (
    <RNModal
      animationType="none"
      onRequestClose={onRequestClose}
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <Pressable
          disabled={!closeOnBackdropPress}
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: backdropColor, opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {showHandle ? (
            <View
              {...(enableSwipeToClose ? panResponder.panHandlers : undefined)}
              style={styles.sheetHandleHitArea}
            >
              <View style={styles.sheetHandle} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  sheetHandleHitArea: {
    alignSelf: "stretch",
    paddingTop: 20,
    paddingBottom: 30,
    position: "relative",
  },
});
