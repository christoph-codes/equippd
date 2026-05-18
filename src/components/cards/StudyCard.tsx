import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { Study, StudyEngagement } from "@/src/models/types";
import { colors } from "@/src/theme/colors";

type Props = {
  study: Study;
  engagement?: StudyEngagement;
  isTopEngaged?: boolean;
  onPress: () => void;
};

export function StudyCard({ study, engagement, isTopEngaged, onPress }: Props) {
  const activityCount = engagement?.total ?? 0;
  const interactionColor = isTopEngaged ? colors.accent : colors.mutedText;
  const updatedDate = new Date(study.updatedAt ?? study.date);
  const updatedLabel = Number.isNaN(updatedDate.getTime())
    ? study.date
    : updatedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <Pressable onPress={onPress}>
      <Card>
        <Text style={styles.title}>{study.title}</Text>
        <Text style={styles.meta}>{study.scripture}</Text>
        <Text style={styles.updated}>Updated {updatedLabel}</Text>
        <View style={styles.activityRow}>
          <Ionicons name="flash-outline" size={14} color={interactionColor} />
          <Text style={[styles.activityCount, { color: interactionColor }]}>
            {activityCount}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    color: colors.accent,
    fontWeight: "600",
  },
  updated: {
    color: colors.mutedText,
  },
  activityRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityCount: {
    fontWeight: "700",
    fontSize: 12,
  },
});
