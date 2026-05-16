import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { Note } from "@/src/models/types";
import { colors } from "@/src/theme/colors";

type Props = {
  note: Note;
  onPress?: () => void;
};

export function NoteCard({ note, onPress }: Props) {
  const updatedAt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(note.updatedAt));
  const bodyPreview =
    note.body.replace(/[#>*_`-]/g, "").trim() || "No body yet";

  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <Card>
        <View style={styles.header}>
          <Text numberOfLines={2} style={styles.title}>
            {note.title || "Untitled note"}
          </Text>
          <Text style={styles.date}>{updatedAt}</Text>
        </View>
        <Text numberOfLines={3} style={styles.body}>
          {bodyPreview}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  body: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
