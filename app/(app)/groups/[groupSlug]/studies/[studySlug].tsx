import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Modal } from "@/src/components/ui/Modal";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Note, Study } from "@/src/models/types";
import {
  fetchStudyBySlug,
  fetchStudyReactionSummary,
  saveNote,
  saveStudy,
  toggleStudyReaction,
} from "@/src/services/firebase/firestore";
import { canAccessGroup } from "@/src/services/firebase/groups";
import { fetchNotesWithUserInfo } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";

type NoteWithUser = Note & {
  userDisplayName?: string;
  userEmail?: string;
};

export default function StudyDetailScreen() {
  const REACTION_CHOICES = ["👍", "❤️", "🔥", "💡"];
  const { groupSlug, studySlug } = useLocalSearchParams<{
    groupSlug: string;
    studySlug: string;
  }>();
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [study, setStudy] = useState<Study | null>(null);
  const [studyLoading, setStudyLoading] = useState(true);
  const [notes, setNotes] = useState<NoteWithUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingStudy, setIsSavingStudy] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {},
  );
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [notePreviewMode, setNotePreviewMode] = useState(false);
  const [showEditStudyModal, setShowEditStudyModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editScripture, setEditScripture] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPreviewMode, setEditPreviewMode] = useState(false);
  const [editOriginalContent, setEditOriginalContent] = useState("");
  const [editError, setEditError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const noteModalScrollRef = useRef<ScrollView | null>(null);
  const editModalScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!groupSlug || !studySlug) return;
    setStudyLoading(true);
    void fetchStudyBySlug(groupSlug, studySlug).then((s) => {
      setStudy(s);
      setStudyLoading(false);
    });
  }, [groupSlug, studySlug]);

  useEffect(() => {
    if (!groupSlug || !user) {
      return;
    }

    setAccessChecked(false);
    void canAccessGroup(user.uid, groupSlug, isAdmin).then((nextHasAccess) => {
      setHasAccess(nextHasAccess);
      setAccessChecked(true);
    });
  }, [groupSlug, isAdmin, user]);

  useEffect(() => {
    if (!user || !accessChecked || !hasAccess) {
      setNotes([]);
      return;
    }

    void fetchNotesWithUserInfo(user.uid, groupSlug, studySlug, isAdmin).then(
      setNotes,
    );
  }, [accessChecked, groupSlug, hasAccess, isAdmin, studySlug, user]);

  useEffect(() => {
    if (!user || !accessChecked || !hasAccess || !groupSlug || !studySlug) {
      setReactionCounts({});
      setUserReactions([]);
      return;
    }

    void fetchStudyReactionSummary(groupSlug, studySlug, user.uid).then(
      (summary) => {
        setReactionCounts(summary.counts);
        setUserReactions(summary.userEmojis);
      },
    );
  }, [accessChecked, groupSlug, hasAccess, studySlug, user]);

  const onToggleStudyReaction = async (emoji: string) => {
    if (!user || !groupSlug || !studySlug || reactionLoading) {
      return;
    }

    setReactionLoading(true);
    try {
      await toggleStudyReaction(user.uid, groupSlug, studySlug, emoji);
      const summary = await fetchStudyReactionSummary(
        groupSlug,
        studySlug,
        user.uid,
      );
      setReactionCounts(summary.counts);
      setUserReactions(summary.userEmojis);
    } finally {
      setReactionLoading(false);
    }
  };

  const onCreateNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim() || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveNote({
        userId: user.uid,
        groupSlug: groupSlug || "",
        studySlug: studySlug || "",
        title: noteTitle,
        body: noteBody,
      });
      setNoteTitle("");
      setNoteBody("");
      setNotePreviewMode(false);
      setShowNoteModal(false);
      void fetchNotesWithUserInfo(user.uid, groupSlug, studySlug, isAdmin).then(
        setNotes,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditStudyModal = () => {
    if (!study) {
      return;
    }

    const sourceContent = study.content ?? "";

    setEditTitle(study.title);
    setEditScripture(study.scripture);
    setEditDescription(study.description);
    setEditContent(sourceContent);
    setEditOriginalContent(sourceContent);
    setEditPreviewMode(false);
    setEditError("");
    setShowEditStudyModal(true);
  };

  const onSaveStudyEdits = async () => {
    if (!isAdmin || !study || !groupSlug || !studySlug) {
      return;
    }

    if (!editTitle.trim()) {
      setEditError("Title is required.");
      return;
    }

    if (!editContent.trim()) {
      // Prevent accidental full wipes caused by transient editor state issues.
      setEditContent(editOriginalContent);
      setEditError("Content cannot be empty. Previous content was restored.");
      return;
    }

    setIsSavingStudy(true);
    setEditError("");
    try {
      await saveStudy({
        id: study.id,
        title: editTitle.trim(),
        slug: study.slug,
        description: editDescription.trim(),
        scripture: editScripture.trim(),
        groupSlug: study.groupSlug,
        date: study.date,
        tags: study.tags,
        author: study.author,
        content: editContent.trim(),
      });

      const refreshedStudy = await fetchStudyBySlug(groupSlug, studySlug);
      setStudy(refreshedStudy);
      setEditPreviewMode(false);
      setEditError("");
      setShowEditStudyModal(false);
    } catch (error) {
      setEditError((error as Error).message || "Unable to save study changes.");
    } finally {
      setIsSavingStudy(false);
    }
  };

  const onRefresh = async () => {
    if (!groupSlug || !studySlug) {
      return;
    }

    setIsRefreshing(true);
    try {
      const nextStudy = await fetchStudyBySlug(groupSlug, studySlug);
      setStudy(nextStudy);

      if (user && hasAccess) {
        const [nextNotes, summary] = await Promise.all([
          fetchNotesWithUserInfo(user.uid, groupSlug, studySlug, isAdmin),
          fetchStudyReactionSummary(groupSlug, studySlug, user.uid),
        ]);

        setNotes(nextNotes);
        setReactionCounts(summary.counts);
        setUserReactions(summary.userEmojis);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!accessChecked || studyLoading) {
    return null;
  }

  if (accessChecked && !hasAccess) {
    return (
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void onRefresh()}
          />
        }
      >
        <EmptyState
          title="Access required"
          description="Request access to this group before opening its studies."
        />
        <Button
          label="Browse groups"
          onPress={() => router.replace("/(app)/groups")}
        />
      </ScreenContainer>
    );
  }

  if (!study) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Study not found"
          description="Check the MDX frontmatter slug and groupSlug."
        />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenContainer>
        <View style={styles.studyHeaderRow}>
          <Text style={styles.studyTitle}>{study.title}</Text>
        </View>
        <Text
          style={styles.studyMeta}
        >{`${study.scripture} • ${study.author}`}</Text>
        <Markdown style={markdownStyles}>{study.content}</Markdown>

        <SectionHeader title="React to this study" />
        <View style={styles.studyReactionRow}>
          {REACTION_CHOICES.map((emoji) => {
            const hasReacted = userReactions.includes(emoji);
            const count = reactionCounts[emoji] ?? 0;
            return (
              <Pressable
                key={emoji}
                disabled={!user || reactionLoading}
                onPress={() => onToggleStudyReaction(emoji)}
                style={({ pressed }) => [
                  styles.studyReactionButton,
                  hasReacted && styles.studyReactionButtonActive,
                  pressed && styles.pressed,
                  (!user || reactionLoading) && styles.disabled,
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.reactionCount,
                    hasReacted && styles.reactionCountActive,
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title="Notes" />
        {notes.length ? (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(note.userDisplayName || "U")
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.noteMeta}>
                  <Text style={styles.noteAuthor}>
                    {note.userDisplayName || "Unknown User"}
                  </Text>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                </View>
              </View>
              <Text style={styles.noteBody} numberOfLines={3}>
                {note.body}
              </Text>
              <View style={styles.noteActions}>
                <Pressable
                  onPress={() => router.push(`/(app)/notes/${note.id}`)}
                >
                  <Text style={styles.viewNote}>View →</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title="No notes yet"
            description="Tap the + button to add your first note and share insights with the group."
          />
        )}
      </ScreenContainer>

      {/* Floating Edit Button */}
      {isAdmin && (
        <Pressable
          accessibilityLabel="Edit study"
          onPress={openEditStudyModal}
          style={({ pressed }) => [
            styles.floatingEditButton,
            pressed && styles.fabPressed,
          ]}
        >
          <Ionicons name="pencil-sharp" size={20} color={colors.accentText} />
        </Pressable>
      )}

      {/* Floating Action Button */}
      {user && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setShowNoteModal(true)}
        >
          <Ionicons name="add-sharp" size={28} color={colors.accentText} />
        </Pressable>
      )}

      {/* Note Creation Modal */}
      <Modal
        onRequestClose={() => setShowNoteModal(false)}
        sheetStyle={styles.noteModalSheet}
        showHandle
        visible={showNoteModal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Note</Text>
            <Pressable onPress={() => setShowNoteModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.modalFormContent}
            keyboardShouldPersistTaps="handled"
            ref={noteModalScrollRef}
            style={styles.modalForm}
          >
            <Text style={styles.label}>Note Title *</Text>
            <TextInput
              placeholder="Give your note a title"
              placeholderTextColor={colors.mutedText}
              value={noteTitle}
              onChangeText={setNoteTitle}
              style={styles.formInput}
            />

            <Text style={styles.label}>Note Content *</Text>
            <View style={styles.modeSwitch}>
              <Pressable
                onPress={() => setNotePreviewMode(false)}
                style={({ pressed }) => [
                  styles.modeChip,
                  !notePreviewMode && styles.modeChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    !notePreviewMode && styles.modeChipTextActive,
                  ]}
                >
                  Write
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNotePreviewMode(true)}
                style={({ pressed }) => [
                  styles.modeChip,
                  notePreviewMode && styles.modeChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    notePreviewMode && styles.modeChipTextActive,
                  ]}
                >
                  Preview
                </Text>
              </Pressable>
            </View>

            {notePreviewMode ? (
              <View style={styles.previewCard}>
                <Markdown style={markdownStyles}>
                  {noteBody.trim() || "Start writing..."}
                </Markdown>
              </View>
            ) : (
              <TextInput
                placeholder="Write your thoughts, reflections, or takeaways..."
                placeholderTextColor={colors.mutedText}
                value={noteBody}
                onChangeText={setNoteBody}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    noteModalScrollRef.current?.scrollToEnd({ animated: true });
                  });
                }}
                multiline
                style={[styles.formInput, styles.formTextArea]}
              />
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setShowNoteModal(false)}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.modalButton,
                styles.cancelButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onCreateNote}
              disabled={!noteTitle.trim() || !noteBody.trim() || isSubmitting}
              style={({ pressed }) => [
                styles.modalButton,
                (!noteTitle.trim() || !noteBody.trim() || isSubmitting) &&
                  styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Creating..." : "Create Note"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Study Edit Modal (Admin Only) */}
      <Modal
        onRequestClose={() => setShowEditStudyModal(false)}
        sheetStyle={styles.noteModalSheet}
        showHandle
        visible={showEditStudyModal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Study</Text>
            <Pressable onPress={() => setShowEditStudyModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.modalFormContent}
            keyboardShouldPersistTaps="handled"
            ref={editModalScrollRef}
            style={styles.modalForm}
          >
            {editError ? (
              <Text style={styles.errorText}>{editError}</Text>
            ) : null}
            <Text style={styles.label}>Title *</Text>
            <TextInput
              placeholder="Study title"
              placeholderTextColor={colors.mutedText}
              value={editTitle}
              onChangeText={setEditTitle}
              style={styles.formInput}
            />

            <Text style={styles.label}>Scripture</Text>
            <TextInput
              placeholder="e.g. John 3:16"
              placeholderTextColor={colors.mutedText}
              value={editScripture}
              onChangeText={setEditScripture}
              style={styles.formInput}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Short study summary"
              placeholderTextColor={colors.mutedText}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
              style={[styles.formInput, styles.formDescriptionInput]}
            />

            <Text style={styles.label}>Content *</Text>
            <View style={styles.modeSwitch}>
              <Pressable
                onPress={() => setEditPreviewMode(false)}
                style={({ pressed }) => [
                  styles.modeChip,
                  !editPreviewMode && styles.modeChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    !editPreviewMode && styles.modeChipTextActive,
                  ]}
                >
                  Write
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setEditPreviewMode(true)}
                style={({ pressed }) => [
                  styles.modeChip,
                  editPreviewMode && styles.modeChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    editPreviewMode && styles.modeChipTextActive,
                  ]}
                >
                  Preview
                </Text>
              </Pressable>
            </View>

            {editPreviewMode ? (
              <View style={styles.previewCard}>
                <Markdown style={markdownStyles}>
                  {editContent.trim() || "Start writing..."}
                </Markdown>
              </View>
            ) : (
              <TextInput
                placeholder="Study markdown content"
                placeholderTextColor={colors.mutedText}
                value={editContent}
                onChangeText={setEditContent}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    editModalScrollRef.current?.scrollToEnd({ animated: true });
                  });
                }}
                multiline
                style={[styles.formInput, styles.formTextArea]}
              />
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setShowEditStudyModal(false)}
              disabled={isSavingStudy}
              style={({ pressed }) => [
                styles.modalButton,
                styles.cancelButton,
                isSavingStudy && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onSaveStudyEdits}
              disabled={!editTitle.trim() || isSavingStudy}
              style={({ pressed }) => [
                styles.modalButton,
                (!editTitle.trim() || isSavingStudy) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>
                {isSavingStudy ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  studyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  studyTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  studyMeta: {
    color: colors.mutedText,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  floatingEditButton: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "700",
  },
  noteMeta: {
    flex: 1,
  },
  noteAuthor: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  noteTitle: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  noteBody: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  studyReactionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  studyReactionButton: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
  },
  studyReactionButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
  },
  reactionCountActive: {
    color: colors.accentText,
  },
  viewNote: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  buttonText: {
    color: colors.accentText,
    fontSize: 13,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: colors.surfaceAlt,
  },
  cancelButtonText: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  /* Floating Action Button Styles */
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
  },
  noteModalSheet: {
    backgroundColor: colors.background,
    height: "90%",
  },
  modalContent: {
    backgroundColor: colors.background,
    paddingTop: 6,
    flex: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  modalClose: {
    color: colors.mutedText,
    fontSize: 24,
    fontWeight: "700",
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalFormContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  formTextArea: {
    textAlignVertical: "top",
    minHeight: 120,
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  modeChipText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  modeChipTextActive: {
    color: colors.accentText,
  },
  previewCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 16,
  },
  formDescriptionInput: {
    textAlignVertical: "top",
    minHeight: 84,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.background,
  },
  modalButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
  },
  paragraph: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
    marginTop: 0,
    marginBottom: 14,
  },
  heading1: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 14,
  },
  heading2: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 12,
  },
  heading3: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 10,
  },
  bullet_list: {
    color: colors.text,
    marginBottom: 14,
  },
  ordered_list: {
    color: colors.text,
    marginBottom: 14,
  },
  list_item: {
    color: colors.text,
    lineHeight: 26,
    marginBottom: 6,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surface,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 0,
    marginTop: 14,
    marginBottom: 0,
  },
  code_inline: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  code_block: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 14,
  },
  strong: {
    color: colors.text,
    fontWeight: "800",
  },
  em: {
    color: colors.text,
  },
});
