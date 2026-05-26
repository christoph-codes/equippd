import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

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
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsEditing(!startInReadMode && !readOnly);
    setPreviewMode(false);
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
          <>
            <View style={styles.modeSwitch}>
              <Text
                onPress={() => setPreviewMode(false)}
                style={[styles.modeChip, !previewMode && styles.modeChipActive]}
              >
                Write
              </Text>
              <Text
                onPress={() => setPreviewMode(true)}
                style={[styles.modeChip, previewMode && styles.modeChipActive]}
              >
                Preview
              </Text>
            </View>

            {previewMode ? (
              <ScrollView contentContainerStyle={styles.readBodyContent}>
                <Markdown style={markdownStyles}>
                  {body.trim() || "Start writing..."}
                </Markdown>
              </ScrollView>
            ) : (
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
            )}
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.readBodyContent}>
            <View onTouchEnd={enableEditing}>
              <Markdown style={markdownStyles}>
                {body.trim() || "Start writing..."}
              </Markdown>
            </View>
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
    ...typography.labelCaps,
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
  modeSwitch: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeChip: {
    color: colors.mutedText,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  modeChipActive: {
    color: colors.accentText,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  titleInput: {
    minHeight: 56,
    color: colors.text,
    ...typography.title,
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 6,
    textAlignVertical: "center",
  },
  titleReadText: {
    minHeight: 56,
    color: colors.text,
    ...typography.title,
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
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: 12,
    marginVertical: 12,
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
