import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { TextInput } from "@/src/components/ui/TextInput";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import React, { useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SongSubmissionModalProps {
  visible: boolean;
  onRequestClose: () => void;
  onSubmit: (
    title: string,
    artist: string,
    spotifyUrl?: string,
    appleMusicUrl?: string,
  ) => Promise<void>;
  saving?: boolean;
}

export function SongSubmissionModal({
  visible,
  onRequestClose,
  onSubmit,
  saving = false,
}: SongSubmissionModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [error, setError] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a song title");
      return;
    }
    if (!artist.trim()) {
      setError("Please enter an artist name");
      return;
    }

    try {
      setError("");
      await onSubmit(
        title.trim(),
        artist.trim(),
        spotifyUrl.trim() || undefined,
        appleMusicUrl.trim() || undefined,
      );

      setTitle("");
      setArtist("");
      setSpotifyUrl("");
      setAppleMusicUrl("");
      onRequestClose();
    } catch (err) {
      setError(
        (err as Error).message || "Failed to submit song. Please try again.",
      );
    }
  };

  const handleClose = () => {
    setTitle("");
    setArtist("");
    setSpotifyUrl("");
    setAppleMusicUrl("");
    setError("");
    onRequestClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      sheetStyle={styles.sheet}
      showHandle
    >
      <Text style={styles.sheetTitle}>Submit a Song</Text>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <TextInput
            label="Song Title *"
            placeholder="Enter song title"
            value={title}
            onChangeText={setTitle}
            editable={!saving}
          />

          <TextInput
            label="Artist Name *"
            placeholder="Enter artist name"
            value={artist}
            onChangeText={setArtist}
            editable={!saving}
          />

          <TextInput
            label="Spotify URL"
            placeholder="Spotify link (optional)"
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
            editable={!saving}
          />

          <TextInput
            label="Apple Music URL"
            placeholder="Apple Music link (optional)"
            value={appleMusicUrl}
            onChangeText={setAppleMusicUrl}
            editable={!saving}
          />

          <View style={styles.inputToActionsSpacer} />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionsContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingTop: isKeyboardVisible ? 14 : 0,
          },
        ]}
      >
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Button
              disabled={saving}
              label="Cancel"
              onPress={handleClose}
              variant="ghost"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              disabled={saving}
              label={saving ? "Submitting..." : "Submit"}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.background,
    height: "88%",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetTitle: {
    color: colors.mutedText,
    ...typography.labelCaps,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputToActionsSpacer: {
    height: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  actionsContainer: {
    gap: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
