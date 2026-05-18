import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/ui/Card";
import { Note } from "@/src/models/types";
import { colors } from "@/src/theme/colors";

type Props = {
  note: Note;
  onPress?: () => void;
  userDisplayName?: string;
};

export function NoteCard({ note, onPress, userDisplayName }: Props) {
  const updatedAt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(note.updatedAt));
  const bodyPreview =
    note.body.replace(/[#>*_`-]/g, "").trim() || "No body yet";
  
  const userInitials = (userDisplayName || "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable disabled={!onPress} onPress={onPress}>
      <Card>
        {userDisplayName ? (
          <View style={styles.headerWithUser}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.headerContent}>
              <Text numberOfLines={1} style={styles.author}>
                {userDisplayName}
              </Text>
              <Text numberOfLines={2} style={styles.title}>
                {note.title || "Untitled note"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <Text numberOfLines={2} style={styles.title}>
              {note.title || "Untitled note"}
            </Text>
            <Text style={styles.date}>{updatedAt}</Text>
          </View>
        )}
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
  headerWithUser: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "700",
  },
  author: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
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
