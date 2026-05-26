import { PropsWithChildren, ReactElement } from "react";
import {
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { EdgeInsets, SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/theme/colors";

type Props = PropsWithChildren<{
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  edges?: (keyof EdgeInsets)[];
  centered?: boolean;
}>;

export function ScreenContainer({
  children,
  refreshControl,
  scroll = true,
  edges = ["left", "right"],
  centered = false,
}: Props) {
  const content = (
    <View
      style={[
        styles.content,
        centered && styles.centeredContent,
        centered && styles.centeredContentContainer,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          refreshControl={refreshControl}
          style={styles.scroll}
          contentContainerStyle={centered ? styles.scrollCentered : undefined}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollCentered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
    gap: 24,
  },
  centeredContentContainer: {
    width: "100%",
  },
});
