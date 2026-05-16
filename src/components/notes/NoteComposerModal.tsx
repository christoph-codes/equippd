import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { colors } from "@/src/theme/colors";

type Selection = {
  start: number;
  end: number;
};

type Props = {
  visible: boolean;
  title: string;
  body: string;
  sessionKey?: string;
  startInReadMode?: boolean;
  modeTitle: string;
  saveLabel: string;
  saving: boolean;
  deleting?: boolean;
  canDelete?: boolean;
  error?: string;
  readOnly?: boolean;
  selection: Selection;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onChangeTitle: (value: string) => void;
  onChangeBody: (value: string) => void;
  onBodyKeyPress: (key: string) => void;
  onSelectionChange: (selection: Selection) => void;
};

export function NoteComposerModal({
  visible,
  title,
  body,
  sessionKey,
  startInReadMode,
  modeTitle,
  saveLabel,
  saving,
  deleting,
  canDelete,
  error,
  readOnly,
  selection,
  onCancel,
  onSave,
  onDelete,
  onChangeTitle,
  onChangeBody,
  onBodyKeyPress,
  onSelectionChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(!startInReadMode && !readOnly);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsEditing(!startInReadMode && !readOnly);
  }, [visible, startInReadMode, readOnly, sessionKey]);

  function enableEditing() {
    if (readOnly) {
      return;
    }

    setIsEditing(true);
  }

  return (
    <Modal
      onRequestClose={onCancel}
      sheetStyle={styles.sheet}
      showHandle
      visible={visible}
    >
      <Text style={styles.sheetTitle}>{modeTitle}</Text>

      <View style={styles.titleBlock}>
        {isEditing ? (
          <TextInput
            editable={!readOnly}
            onChangeText={onChangeTitle}
            placeholder="Untitled note"
            placeholderTextColor={colors.mutedText}
            style={styles.titleInput}
            value={title}
          />
        ) : (
          <Text onPress={enableEditing} selectable style={styles.titleReadText}>
            {title.trim() || "Untitled note"}
          </Text>
        )}
      </View>

      <View style={styles.noteBlock}>
        {isEditing ? (
          <TextInput
            blurOnSubmit={false}
            editable={!readOnly}
            multiline
            onChangeText={onChangeBody}
            onKeyPress={(event) => onBodyKeyPress(event.nativeEvent.key)}
            onSelectionChange={(event) =>
              onSelectionChange(event.nativeEvent.selection)
            }
            placeholder="Start writing..."
            placeholderTextColor={colors.mutedText}
            selection={selection}
            style={styles.bodyInput}
            textAlignVertical="top"
            value={body}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.readBodyContent}>
            <Text
              onPress={enableEditing}
              selectable
              style={styles.bodyReadText}
            >
              {body.trim() || "Start writing..."}
            </Text>
          </ScrollView>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!readOnly && isEditing ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 12), gap: 10 }}>
          <View style={styles.sheetActions}>
            <View style={styles.actionButton}>
              <Button
                disabled={saving || deleting}
                label="Cancel"
                onPress={onCancel}
                variant="ghost"
              />
            </View>
            <View style={styles.actionButton}>
              <Button
                disabled={saving || deleting}
                label={saving ? "Saving..." : saveLabel}
                onPress={onSave}
              />
            </View>
          </View>

          {canDelete && onDelete ? (
            <Button
              disabled={saving || deleting}
              label={deleting ? "Deleting..." : "Delete note"}
              onPress={onDelete}
              variant="danger"
            />
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background,
    height: "86%",
    maxHeight: "92%",
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  sheetTitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  titleBlock: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteBlock: {
    flex: 1,
    paddingTop: 2,
  },
  titleInput: {
    minHeight: 56,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 6,
    textAlignVertical: "center",
  },
  titleReadText: {
    minHeight: 56,
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    paddingTop: 6,
    paddingBottom: 6,
  },
  bodyInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 8,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  readBodyContent: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  bodyReadText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    lineHeight: 20,
  },
});
