import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { NoteCard } from "@/src/components/cards/NoteCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, Note } from "@/src/models/types";
import { fetchAccessibleGroups } from "@/src/services/firebase/groups";
import { fetchRecentNotes } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void Promise.all([
      fetchAccessibleGroups(user.uid, isAdmin),
      fetchRecentNotes(user.uid, 5, isAdmin),
    ])
      .then(([nextGroups, nextNotes]) => {
        setGroups(nextGroups);
        setNotes(nextNotes);
      })
      .catch(() => {
        setGroups([]);
        setNotes([]);
      });
  }, [isAdmin, user]);

  return (
    <ScreenContainer>
      <ScreenIntro>
        {`Welcome, ${user?.displayName || "Equippd Member"}!`}
      </ScreenIntro>

      {groups.length ? (
        <Card>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>
                {isAdmin ? "Group overview" : "Your groups"}
              </Text>
              <Text style={styles.description}>
                {isAdmin
                  ? `${groups.length} group${groups.length === 1 ? "" : "s"} available across Equippd.`
                  : `You're connected to ${groups.length} group${groups.length === 1 ? "" : "s"}.`}
              </Text>
            </View>
            <Button label="Open" onPress={() => router.push("/(app)/groups")} />
          </View>
          {groups.slice(0, 2).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => router.push(`/(app)/groups/${group.slug}`)}
            />
          ))}
        </Card>
      ) : (
        <>
          <EmptyState
            title="No groups yet"
            description="Explore available groups and request access from an admin."
          />
          <Button
            label="Explore groups"
            onPress={() => router.push("/(app)/groups")}
          />
        </>
      )}

      {notes.length ? (
        <Card>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>
                {isAdmin ? "Recent notes" : "Your recent notes"}
              </Text>
              <Text style={styles.description}>
                {isAdmin
                  ? "Latest reflections from across accessible groups."
                  : "Pick up where you left off."}
              </Text>
            </View>
            <Button label="Notes" onPress={() => router.push("/(app)/notes")} />
          </View>
          {notes.slice(0, 2).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => router.push(`/(app)/notes/${note.id}`)}
            />
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
