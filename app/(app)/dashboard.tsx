import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { NoteCard } from "@/src/components/cards/NoteCard";
import { ComingSoonPanel } from "@/src/components/ui/ComingSoonPanel";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, MusicItem, Note } from "@/src/models/types";
import { loadMusicItems } from "@/src/services/content/mdx";
import { fetchAccessibleGroups } from "@/src/services/firebase/groups";
import { fetchRecentNotes } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [music, setMusic] = useState<MusicItem[]>([]);

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

    setMusic(loadMusicItems());
  }, [isAdmin, user]);

  return (
    <ScreenContainer>
      <SectionHeader
        title={`Welcome, ${user?.displayName || "Equippd Member"}`}
        subtitle="Stay rooted in Scripture and connected in community."
      />

      <SectionHeader
        title={isAdmin ? "All Bible Study Groups" : "Your Bible Study Groups"}
      />
      {groups.length ? (
        groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() => router.push(`/(app)/groups/${group.slug}`)}
          />
        ))
      ) : (
        <EmptyState
          title="No groups yet"
          description="Once you're added to groups, they will appear here."
        />
      )}

      <SectionHeader
        title={isAdmin ? "Recent Notes Across Equippd" : "Recent Notes"}
      />
      {notes.length ? (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onPress={() => router.push(`/(app)/notes/${note.id}`)}
          />
        ))
      ) : (
        <EmptyState
          title="No notes yet"
          description="Your latest study notes will show up here."
        />
      )}

      <SectionHeader title="Music Discovery" />
      {music.slice(0, 2).map((item) => (
        <Text key={item.title} style={{ color: colors.text }}>
          {item.title} — {item.artist}
        </Text>
      ))}

      <ComingSoonPanel
        title="Shop"
        description="Apparel and more are on the way. The Equippd shop section is ready for future product expansion."
      />
    </ScreenContainer>
  );
}
