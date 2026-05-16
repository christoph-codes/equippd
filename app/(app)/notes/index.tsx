import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { NoteCard } from "@/src/components/cards/NoteCard";
import { NoteComposerModal } from "@/src/components/notes/NoteComposerModal";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Modal } from "@/src/components/ui/Modal";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { useAuth } from "@/src/hooks/useAuth";
import { Note } from "@/src/models/types";
import { deleteNote, saveNote } from "@/src/services/firebase/firestore";
import { fetchAllNotes } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";

const PERSONAL_GROUP_SLUG = "personal";
const GENERAL_STUDY_SLUG = "general";

type Selection = {
  start: number;
  end: number;
};

function getContinuationPrefix(line: string) {
  const unordered = line.match(/^\s*-\s+/);
  if (unordered) {
    return unordered[0];
  }

  const ordered = line.match(/^(\s*)(\d+)\.\s+/);
  if (ordered) {
    const indent = ordered[1] ?? "";
    const nextNumber = Number(ordered[2] ?? 0) + 1;
    return `${indent}${nextNumber}. `;
  }

  return "";
}

export default function NotesScreen() {
  const { isAdmin, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [composerVisible, setComposerVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [composerError, setComposerError] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [bodySelection, setBodySelection] = useState<Selection>({
    start: 0,
    end: 0,
  });
  const [pendingPrefix, setPendingPrefix] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const readOnly =
    isAdmin &&
    Boolean(editingNote?.userId) &&
    editingNote?.userId !== user?.uid;
  const latestUpdatedLabel = useMemo(() => {
    if (!notes.length) {
      return "";
    }

    const latestUpdatedAt = notes.reduce((latest, note) => {
      return new Date(note.updatedAt) > new Date(latest.updatedAt)
        ? note
        : latest;
    }, notes[0]);

    return `Updated ${new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(latestUpdatedAt.updatedAt))}`;
  }, [notes]);

  const loadNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextNotes = await fetchAllNotes(user.uid, isAdmin);
      setNotes(nextNotes);
    } catch (err) {
      setNotes([]);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [loadNotes]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotes();
    } finally {
      setRefreshing(false);
    }
  }, [loadNotes]);

  function openComposer() {
    setEditingNote(null);
    setComposerError("");
    setDraftTitle("");
    setDraftBody("");
    setBodySelection({ start: 0, end: 0 });
    setPendingPrefix("");
    setComposerVisible(true);
  }

  function openComposerForEdit(note: Note) {
    setEditingNote(note);
    setComposerError("");
    setDraftTitle(note.title);
    setDraftBody(note.body);
    setBodySelection({ start: note.body.length, end: note.body.length });
    setPendingPrefix("");
    setComposerVisible(true);
  }

  function closeComposer() {
    if (savingNote || deletingNote) {
      return;
    }

    setComposerVisible(false);
    setDeleteConfirmVisible(false);
    setComposerError("");
    setPendingPrefix("");
    setEditingNote(null);
  }

  function onDeleteRequest() {
    if (!editingNote || readOnly) {
      return;
    }

    setDeleteConfirmVisible(true);
  }

  async function onDeleteConfirmed() {
    if (!editingNote) {
      return;
    }

    setDeletingNote(true);
    setComposerError("");

    try {
      await deleteNote(editingNote.id);
      setDeleteConfirmVisible(false);
      setComposerVisible(false);
      setDraftTitle("");
      setDraftBody("");
      setPendingPrefix("");
      setEditingNote(null);
      await loadNotes();
    } catch (err) {
      setComposerError((err as Error).message);
      setDeleteConfirmVisible(false);
    } finally {
      setDeletingNote(false);
    }
  }

  function onBodyKeyPress(key: string) {
    if (key !== "Enter") {
      return;
    }

    const cursor = Math.min(bodySelection.start, draftBody.length);
    const lineStart = draftBody.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
    const line = draftBody.slice(lineStart, cursor);

    setPendingPrefix(getContinuationPrefix(line));
  }

  function onBodyChange(nextBody: string) {
    if (!pendingPrefix) {
      setDraftBody(nextBody);
      return;
    }

    const insertAt = Math.min(bodySelection.start + 1, nextBody.length);
    const bodyWithPrefix = `${nextBody.slice(0, insertAt)}${pendingPrefix}${nextBody.slice(insertAt)}`;

    setDraftBody(bodyWithPrefix);
    setBodySelection({
      start: insertAt + pendingPrefix.length,
      end: insertAt + pendingPrefix.length,
    });
    setPendingPrefix("");
  }

  async function onSaveNote() {
    if (!user) {
      setComposerError("You must be logged in to save notes.");
      return;
    }

    if (readOnly) {
      return;
    }

    setComposerError("");
    setSavingNote(true);

    try {
      await saveNote({
        id: editingNote?.id ?? "new",
        userId: editingNote?.userId ?? user.uid,
        groupSlug: PERSONAL_GROUP_SLUG,
        studySlug: GENERAL_STUDY_SLUG,
        title: draftTitle.trim() || "Untitled note",
        body: draftBody,
      });

      setComposerVisible(false);
      setDraftTitle("");
      setDraftBody("");
      setPendingPrefix("");
      setEditingNote(null);
      await loadNotes();
    } catch (err) {
      setComposerError((err as Error).message);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={onRefresh}
          />
        }
      >
        {latestUpdatedLabel ? (
          <Text style={styles.latestUpdated}>{latestUpdatedLabel}</Text>
        ) : null}

        <ScreenIntro>
          {isAdmin
            ? "Review and manage notes across Equippd."
            : "Capture thoughts, study notes, and reflections."}
        </ScreenIntro>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {notes.length ? (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => openComposerForEdit(note)}
            />
          ))
        ) : (
          <EmptyState
            title={loading ? "Loading notes..." : "No notes yet"}
            description={
              isAdmin
                ? "Saved notes from members will appear here."
                : "Create your first note and keep your reflections organized."
            }
          />
        )}
      </ScreenContainer>

      <Pressable style={styles.floatingButton} onPress={openComposer}>
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>

      <NoteComposerModal
        body={draftBody}
        error={composerError}
        modeTitle={editingNote ? (readOnly ? "View Note" : "Note") : "New Note"}
        onBodyKeyPress={onBodyKeyPress}
        onCancel={closeComposer}
        onChangeBody={onBodyChange}
        onChangeTitle={setDraftTitle}
        onDelete={onDeleteRequest}
        onSave={onSaveNote}
        onSelectionChange={setBodySelection}
        canDelete={Boolean(editingNote?.id) && !readOnly}
        deleting={deletingNote}
        readOnly={readOnly}
        saveLabel={editingNote ? "Save changes" : "Save note"}
        saving={savingNote}
        sessionKey={editingNote?.id ?? "new"}
        selection={bodySelection}
        startInReadMode={Boolean(editingNote) && !readOnly}
        title={draftTitle}
        visible={composerVisible}
      />

      <Modal
        backdropColor="rgba(8, 10, 15, 0.55)"
        closeOnBackdropPress={!deletingNote}
        enableSwipeToClose={false}
        onRequestClose={() => {
          if (!deletingNote) {
            setDeleteConfirmVisible(false);
          }
        }}
        sheetStyle={styles.confirmSheet}
        visible={deleteConfirmVisible}
      >
        <Text style={styles.confirmTitle}>Delete this note?</Text>
        <Text style={styles.confirmBody}>
          This action is permanent and cannot be undone.
        </Text>
        <View style={styles.confirmActions}>
          <View style={styles.actionButton}>
            <Button
              disabled={deletingNote}
              label="Keep note"
              onPress={() => setDeleteConfirmVisible(false)}
              variant="ghost"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              disabled={deletingNote}
              label={deletingNote ? "Deleting..." : "Delete"}
              onPress={onDeleteConfirmed}
              variant="danger"
            />
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
  error: {
    color: colors.danger,
    lineHeight: 20,
  },
  latestUpdated: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 20,
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  floatingButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmSheet: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 14,
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  confirmBody: {
    color: colors.mutedText,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
