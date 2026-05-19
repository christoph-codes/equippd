import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { SongCard } from "@/src/components/cards/SongCard";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { TextInput } from "@/src/components/ui/TextInput";
import { colors } from "@/src/theme/colors";
import { Song } from "@/src/models/types";
import {
  approveSong,
  rejectSong,
  deleteSong,
  updateSongLinks,
} from "@/src/services/firebase/firestore";

interface AdminSongManagementProps {
  pendingSongs: Song[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function AdminSongManagement({
  pendingSongs,
  isLoading,
  onRefresh,
}: AdminSongManagementProps) {
  const [localSongs, setLocalSongs] = useState(pendingSongs);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    setLocalSongs(pendingSongs);
  }, [pendingSongs]);

  const handleApprove = async (songId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(songId));
      await approveSong(songId);
      setLocalSongs((prev) => prev.filter((s) => s.id !== songId));
      await onRefresh();
    } catch (error) {
      Alert.alert("Error", "Failed to approve song");
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  const handleReject = async (songId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(songId));
      await rejectSong(songId);
      setLocalSongs((prev) => prev.filter((s) => s.id !== songId));
      await onRefresh();
    } catch (error) {
      Alert.alert("Error", "Failed to reject song");
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  const handleDelete = async (songId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(songId));
      await deleteSong(songId);
      setLocalSongs((prev) => prev.filter((s) => s.id !== songId));
      await onRefresh();
    } catch (error) {
      Alert.alert("Error", "Failed to delete song");
      console.error(error);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  const openEditModal = (song: Song) => {
    setEditingSong(song);
    setSpotifyUrl(song.spotifyUrl ?? "");
    setAppleMusicUrl(song.appleMusicUrl ?? "");
  };

  const closeEditModal = (force = false) => {
    if (isSavingEdit && !force) {
      return;
    }
    setEditingSong(null);
    setSpotifyUrl("");
    setAppleMusicUrl("");
  };

  const handleSaveLinks = async () => {
    if (!editingSong) {
      return;
    }

    try {
      setIsSavingEdit(true);
      await updateSongLinks(
        editingSong.id,
        spotifyUrl.trim() || undefined,
        appleMusicUrl.trim() || undefined,
      );

      setLocalSongs((prev) =>
        prev.map((song) =>
          song.id === editingSong.id
            ? {
                ...song,
                spotifyUrl: spotifyUrl.trim() || undefined,
                appleMusicUrl: appleMusicUrl.trim() || undefined,
              }
            : song,
        ),
      );

      await onRefresh();
      closeEditModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to update song links");
      console.error(error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading && localSongs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (localSongs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pending songs to review</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Pending Songs ({localSongs.length})
        </Text>
        <Pressable
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={styles.refreshButtonText}>↻</Text>
          )}
        </Pressable>
      </View>

      <FlatList
        data={localSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            isPending
            onEdit={openEditModal}
            onApprove={() => handleApprove(item.id)}
            onReject={() => handleReject(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />

      <Modal
        visible={Boolean(editingSong)}
        onRequestClose={closeEditModal}
        showHandle
        sheetStyle={styles.modalSheet}
      >
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>EDIT SONG LINKS</Text>
          <Text style={styles.modalSongName}>
            {editingSong ? `${editingSong.title} - ${editingSong.artist}` : ""}
          </Text>

          <TextInput
            label="Spotify URL"
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://open.spotify.com/..."
          />

          <TextInput
            label="Apple Music URL"
            value={appleMusicUrl}
            onChangeText={setAppleMusicUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://music.apple.com/..."
          />

          <View style={styles.modalActions}>
            <Button label="Cancel" variant="ghost" onPress={closeEditModal} />
            <Button
              label={isSavingEdit ? "Saving..." : "Save"}
              onPress={handleSaveLinks}
              disabled={isSavingEdit}
            />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButtonText: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: "600",
  },
  modalSheet: {
    backgroundColor: colors.background,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedText,
    letterSpacing: 1,
  },
  modalSongName: {
    fontSize: 14,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
  },
});
