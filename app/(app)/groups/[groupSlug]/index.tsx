import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { NoteCard } from "@/src/components/cards/NoteCard";
import { StudyCard } from "@/src/components/cards/StudyCard";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, Note, Study, StudyEngagement } from "@/src/models/types";
import {
  fetchStudiesByGroup,
  fetchStudyEngagementByGroup,
  saveStudy,
} from "@/src/services/firebase/firestore";
import { fetchGroupBySlug } from "@/src/services/firebase/groups";
import { fetchNotesByGroup } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ groupSlug: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { isAdmin, user, profile } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [engagementByStudy, setEngagementByStudy] = useState<
    Record<string, StudyEngagement>
  >({});
  const [showAddStudyModal, setShowAddStudyModal] = useState(false);
  const [studyTitle, setStudyTitle] = useState("");
  const [studySlug, setStudySlug] = useState("");
  const [studyScripture, setStudyScripture] = useState("");
  const [studyDescription, setStudyDescription] = useState("");
  const [studyContent, setStudyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    if (!params.groupSlug) {
      return;
    }

    void fetchStudiesByGroup(params.groupSlug).then(setStudies);
  }, [params.groupSlug]);

  useEffect(() => {
    if (!params.groupSlug) {
      setEngagementByStudy({});
      return;
    }

    void fetchStudyEngagementByGroup(params.groupSlug).then(
      setEngagementByStudy,
    );
  }, [params.groupSlug]);

  const topStudySlug = studies.reduce<string | null>((topSlug, current) => {
    const currentTotal = engagementByStudy[current.slug]?.total ?? 0;
    if (!topSlug) {
      return current.slug;
    }

    const topTotal = engagementByStudy[topSlug]?.total ?? 0;
    return currentTotal > topTotal ? current.slug : topSlug;
  }, null);

  const reloadStudies = () => {
    if (params.groupSlug) {
      void fetchStudiesByGroup(params.groupSlug).then(setStudies);
    }
  };

  const onRefresh = async () => {
    if (!params.groupSlug) {
      return;
    }

    setIsRefreshing(true);
    try {
      const [nextGroup, nextStudies, nextEngagement] = await Promise.all([
        fetchGroupBySlug(params.groupSlug),
        fetchStudiesByGroup(params.groupSlug),
        fetchStudyEngagementByGroup(params.groupSlug),
      ]);

      setGroup(nextGroup);
      setStudies(nextStudies);
      setEngagementByStudy(nextEngagement);

      if (user) {
        const nextNotes = await fetchNotesByGroup(
          user.uid,
          params.groupSlug,
          isAdmin,
        );
        setNotes(nextNotes);
      } else {
        setNotes([]);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const onAddStudy = async () => {
    if (!studyTitle.trim() || !studySlug.trim() || !params.groupSlug) {
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = studySlug.trim().toLowerCase().replace(/\s+/g, "-");
      const study: Omit<Study, "id"> = {
        title: studyTitle.trim(),
        slug,
        description: studyDescription.trim(),
        scripture: studyScripture.trim(),
        groupSlug: params.groupSlug,
        date: new Date().toISOString().split("T")[0],
        tags: [],
        author: profile?.displayName || "Unknown",
        content: studyContent.trim(),
      };

      await saveStudy(study);
      setStudyTitle("");
      setStudySlug("");
      setStudyScripture("");
      setStudyDescription("");
      setStudyContent("");
      setShowAddStudyModal(false);
      reloadStudies();
    } catch (error) {
      console.error("Error adding study:", error);
      alert("Error adding study. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void onRefresh()}
        />
      }
    >
      <PageHeader
        title={group?.name ?? "Group"}
        subtitle={group?.description}
      />

      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <SectionHeader
            title="Latest Studies"
            subtitle={
              studies.length > 3
                ? "Showing the latest 3 studies for this group."
                : undefined
            }
          />
        </View>
        {isAdmin && (
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddStudyModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Study</Text>
          </Pressable>
        )}
      </View>

      {latestStudies.length ? (
        latestStudies.map((study) => (
          <StudyCard
            key={study.slug}
            study={study}
            engagement={engagementByStudy[study.slug]}
            isTopEngaged={Boolean(
              topStudySlug &&
              study.slug === topStudySlug &&
              (engagementByStudy[study.slug]?.total ?? 0) > 0,
            )}
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
          description={
            isAdmin
              ? "Tap '+ Add Study' to create one."
              : "Studies for this group will appear here."
          }
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

      <Modal
        visible={showAddStudyModal}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Study</Text>
            <Pressable onPress={() => setShowAddStudyModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Walking in Faith"
              placeholderTextColor={colors.mutedText}
              value={studyTitle}
              onChangeText={(v) => {
                setStudyTitle(v);
                if (
                  !studySlug ||
                  studySlug === studyTitle.toLowerCase().replace(/\s+/g, "-")
                ) {
                  setStudySlug(
                    v
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  );
                }
              }}
            />

            <Text style={styles.fieldLabel}>Slug * (URL-safe ID)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. walking-in-faith"
              placeholderTextColor={colors.mutedText}
              value={studySlug}
              onChangeText={setStudySlug}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Scripture</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. John 3:16"
              placeholderTextColor={colors.mutedText}
              value={studyScripture}
              onChangeText={setStudyScripture}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Short summary of this study..."
              placeholderTextColor={colors.mutedText}
              value={studyDescription}
              onChangeText={setStudyDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Content (Markdown)</Text>
            <TextInput
              style={[styles.fieldInput, styles.contentInput]}
              placeholder="Study content in markdown..."
              placeholderTextColor={colors.mutedText}
              value={studyContent}
              onChangeText={setStudyContent}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
              <Button
                label="Cancel"
                onPress={() => setShowAddStudyModal(false)}
                disabled={isSubmitting}
              />
              <Button
                label={isSubmitting ? "Creating..." : "Create Study"}
                onPress={onAddStudy}
                disabled={
                  !studyTitle.trim() || !studySlug.trim() || isSubmitting
                }
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  flex: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: colors.accentText,
    fontWeight: "600",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.mutedText,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.mutedText,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  contentInput: {
    minHeight: 220,
    fontFamily: "Courier New",
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
});
