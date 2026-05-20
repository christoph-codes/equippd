import { AdminSongManagement } from "@/src/components/cards/AdminSongManagement";
import { SongCard } from "@/src/components/cards/SongCard";
import { SongSubmissionModal } from "@/src/components/notes/SongSubmissionModal";
import { ComingSoonPanel } from "@/src/components/ui/ComingSoonPanel";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useAuth } from "@/src/hooks/useAuth";
import { Song } from "@/src/models/types";
import {
  fetchApprovedSongs,
  fetchPendingSongs,
  fetchUserProfile,
  submitSong,
} from "@/src/services/firebase/firestore";
import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MusicScreen() {
  const { user, isAdmin } = useAuth();
  const [approvedSongs, setApprovedSongs] = useState<Song[]>([]);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSongs = useCallback(
    async (showLoading: boolean = false) => {
      try {
        if (showLoading) {
          setIsInitialLoading(true);
        }
        const [approved, pending] = await Promise.all([
          fetchApprovedSongs(),
          isAdmin ? fetchPendingSongs() : Promise.resolve([]),
        ]);

        setApprovedSongs(approved);
        if (isAdmin) {
          setPendingSongs(pending);
        }
      } catch (error) {
        console.error("Failed to load songs:", error);
        Alert.alert("Error", "Failed to load songs");
      } finally {
        if (showLoading) {
          setIsInitialLoading(false);
        }
      }
    },
    [user],
  );

  // Initial load only on mount
  useEffect(() => {
    void loadSongs(true);
  }, [loadSongs]);

  // Refresh data when screen comes into focus (silent refresh, no loading indicator)
  useFocusEffect(
    useCallback(() => {
      void loadSongs(false);
    }, [loadSongs]),
  );

  const handleSubmitSong = async (
    title: string,
    artist: string,
    spotifyUrl?: string,
    appleMusicUrl?: string,
  ) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a song");
      return;
    }

    try {
      setIsSubmitting(true);
      const profile = await fetchUserProfile(user.uid);
      if (!profile) {
        throw new Error("User profile not found");
      }

      await submitSong(
        user.uid,
        profile.displayName,
        title,
        artist,
        spotifyUrl,
        appleMusicUrl,
        isAdmin,
        profile.photoURL ?? undefined,
      );
      await loadSongs();
    } catch (error) {
      console.error("Failed to submit song:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePullToRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadSongs(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSongs]);

  if (!user) {
    return (
      <ScreenContainer>
        <ComingSoonPanel
          title="Music"
          description="Sign in to view and submit songs"
        />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullToRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {isInitialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : approvedSongs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No approved songs yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to submit a song!
            </Text>
          </View>
        ) : (
          <View>
            {isAdmin && (
              <Text style={styles.sectionTitle}>
                Approved Songs ({approvedSongs.length})
              </Text>
            )}
            {approvedSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </View>
        )}

        {isAdmin && (
          <AdminSongManagement
            pendingSongs={pendingSongs}
            isLoading={isInitialLoading}
            onRefresh={() => loadSongs(false)}
          />
        )}
      </ScreenContainer>

      <Pressable
        style={styles.floatingButton}
        onPress={() => setIsSubmittingModal(true)}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>

      <SongSubmissionModal
        visible={isSubmittingModal}
        onRequestClose={() => setIsSubmittingModal(false)}
        onSubmit={handleSubmitSong}
        saving={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  scrollView: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.mutedText,
  },
});
