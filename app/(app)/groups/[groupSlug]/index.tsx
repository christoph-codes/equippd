import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";

import { NoteCard } from "@/src/components/cards/NoteCard";
import { StudyCard } from "@/src/components/cards/StudyCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, Note } from "@/src/models/types";
import { loadStudiesByGroup } from "@/src/services/content/mdx";
import { fetchGroupBySlug } from "@/src/services/firebase/groups";
import { fetchNotesByGroup } from "@/src/services/firebase/notes";

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ groupSlug: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { isAdmin, user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const studies = loadStudiesByGroup(params.groupSlug ?? "");
  const latestStudies = studies.slice(0, 3);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: group?.name ?? "Group",
      headerTitleAlign: "center",
      headerBackTitle: "Groups",
      headerBackButtonDisplayMode: "minimal",
    });
  }, [group?.name, navigation]);

  useEffect(() => {
    if (!params.groupSlug) {
      return;
    }

    void fetchGroupBySlug(params.groupSlug).then((nextGroup) => {
      setGroup(nextGroup);
    });
  }, [params.groupSlug]);

  useEffect(() => {
    if (!params.groupSlug || !user) {
      setNotes([]);
      return;
    }

    void fetchNotesByGroup(user.uid, params.groupSlug, isAdmin).then(
      (nextNotes) => {
        setNotes(nextNotes);
      },
    );
  }, [isAdmin, params.groupSlug, user]);

  return (
    <ScreenContainer>
      <SectionHeader
        title={group?.name ?? "Group"}
        subtitle={group?.description}
      />

      <SectionHeader
        title="Latest Studies"
        subtitle={
          studies.length > 3
            ? "Showing the latest 3 studies for this group."
            : undefined
        }
      />
      {latestStudies.length ? (
        latestStudies.map((study) => (
          <StudyCard
            key={study.slug}
            study={study}
            onPress={() =>
              router.push(
                `/(app)/groups/${params.groupSlug}/studies/${study.slug}`,
              )
            }
          />
        ))
      ) : (
        <EmptyState
          title="No studies yet"
          description="Studies for this group will appear here."
        />
      )}

      <SectionHeader title="Announcements" />
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
          title="No announcements yet"
          description="Announcements for this group will appear here."
        />
      )}
    </ScreenContainer>
  );
}
