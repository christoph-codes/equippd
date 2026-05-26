import { UserIdentityRow } from "@/src/components/ui/UserIdentityRow";
import { Song } from "@/src/models/types";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface SongCardProps {
  song: Song;
  onApprove?: (songId: string) => void;
  onReject?: (songId: string) => void;
  onDelete?: (songId: string) => void;
  onEdit?: (song: Song) => void;
  isPending?: boolean;
}

export function SongCard({
  song,
  onApprove,
  onReject,
  onDelete,
  onEdit,
  isPending = false,
}: SongCardProps) {
  const hasAdminActions = Boolean(onApprove || onReject || onDelete || onEdit);

  const handleOpenLink = async (url: string | undefined, platform: string) => {
    if (!url) {
      Alert.alert(
        `No ${platform} Link`,
        `This song doesn't have a ${platform} link.`,
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", `Could not open ${platform} link.`);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Song", "Are you sure you want to delete this song?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          onDelete?.(song.id);
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.content,
          hasAdminActions && styles.contentWithAdminActions,
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.songInfo}>
            <Text style={styles.title}>{song.title}</Text>
            <Text style={styles.artist}>{song.artist}</Text>
          </View>
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
          {(song.spotifyUrl || song.appleMusicUrl) && (
            <View style={styles.platformIcons}>
              {song.spotifyUrl && (
                <Pressable
                  style={styles.platformIcon}
                  onPress={() => handleOpenLink(song.spotifyUrl, "Spotify")}
                >
                  <FontAwesome5 name="spotify" size={24} color="#1DB954" />
                </Pressable>
              )}

              {song.appleMusicUrl && (
                <Pressable
                  style={styles.platformIcon}
                  onPress={() =>
                    handleOpenLink(song.appleMusicUrl, "Apple Music")
                  }
                >
                  <FontAwesome name="music" size={24} color="#ff4e6b" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        <UserIdentityRow
          name={song.submittedByDisplayName}
          photoURL={song.submittedByPhotoURL}
        />
      </View>

      {hasAdminActions && (
        <View style={styles.adminActions}>
          {onEdit && (
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(song)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </Pressable>
          )}
          {onApprove && (
            <Pressable
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => onApprove(song.id)}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </Pressable>
          )}
          {onReject && (
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(song.id)}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    marginBottom: 0,
  },
  contentWithAdminActions: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  songInfo: {
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    flex: 1,
  },
  artist: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 4,
  },

  pendingBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.accentText,
  },
  platformIcons: {
    flexDirection: "row",
    gap: 8,
  },
  platformIcon: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  adminActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  editButton: {
    backgroundColor: colors.surfaceAlt,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  deleteButton: {
    backgroundColor: colors.mutedText,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
});
