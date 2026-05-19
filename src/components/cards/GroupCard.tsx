import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { Group } from "@/src/models/types";
import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  group: Group;
  onPress: () => void;
};

export function GroupCard({ group, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
        </View>
        <Text style={styles.description}>{group.description}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  org: {
    color: colors.accent,
    fontWeight: "600",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
