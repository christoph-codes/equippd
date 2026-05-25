import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Modal } from "@/src/components/ui/Modal";
import { useAuth } from "@/src/hooks/useAuth";
import { MessageThreadSummary } from "@/src/models/types";
import {
  ensureDirectThread,
  fetchChatCandidates,
  subscribeToDirectThreads,
} from "@/src/services/firebase/messages";
import { colors } from "@/src/theme/colors";

type Candidate = {
  userId: string;
  displayName: string;
  photoURL?: string | null;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [chatCandidates, setChatCandidates] = useState<Candidate[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isStartingChatWith, setIsStartingChatWith] = useState<string | null>(
    null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserId = user?.uid ?? "";
  const currentDisplayName =
    profile?.displayName ?? user?.displayName ?? "Equippd User";

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return chatCandidates;
    }

    return chatCandidates.filter((candidate) =>
      candidate.displayName.toLowerCase().includes(q),
    );
  }, [chatCandidates, searchQuery]);

  const loadCandidates = useCallback(async () => {
    if (!currentUserId) {
      setChatCandidates([]);
      return;
    }

    setIsLoadingCandidates(true);
    try {
      const candidates = await fetchChatCandidates(currentUserId);
      setChatCandidates(candidates);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [currentUserId]);

  const openPicker = useCallback(() => {
    setSearchQuery("");
    setPickerVisible(true);
    loadCandidates().catch(() => setIsLoadingCandidates(false));
  }, [loadCandidates]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        setThreads([]);
        setIsLoadingThreads(false);
        return () => undefined;
      }

      setIsLoadingThreads(true);
      const unsubscribe = subscribeToDirectThreads(
        currentUserId,
        (nextThreads) => {
          setThreadsError(null);
          setThreads(nextThreads);
          setIsLoadingThreads(false);
        },
        (error) => {
          setIsLoadingThreads(false);
          const message =
            error?.message ?? "Could not load conversations right now.";
          setThreadsError(message);
          Alert.alert("Messages unavailable", message);
        },
      );

      return () => {
        unsubscribe();
      };
    }, [currentUserId]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile]);

  const openThread = useCallback(
    (thread: MessageThreadSummary) => {
      router.push({
        pathname: "/(app)/chat/[threadId]",
        params: {
          threadId: thread.id,
          otherUserName: thread.otherParticipant.displayName,
        },
      });
    },
    [router],
  );

  const startChat = useCallback(
    async (candidate: Candidate) => {
      if (!currentUserId) {
        return;
      }

      setPickerVisible(false);

      setIsStartingChatWith(candidate.userId);
      try {
        const threadId = await ensureDirectThread(
          {
            userId: currentUserId,
            displayName: currentDisplayName,
            photoURL: user?.photoURL,
          },
          candidate,
        );
        router.push({
          pathname: "/(app)/chat/[threadId]",
          params: {
            threadId,
            otherUserName: candidate.displayName,
          },
        });
      } catch (err) {
        console.error("Failed to start chat:", err);
        let message = "We couldn't open this conversation. Please try again.";
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
        ) {
          message = err.message;
        }
        Alert.alert("Could not start chat", message);
      } finally {
        setIsStartingChatWith(null);
      }
    },
    [currentDisplayName, currentUserId, router, user?.photoURL],
  );

  const renderThread = (item: MessageThreadSummary) => {
    const preview = item.lastMessageText.trim()
      ? item.lastMessageSenderId === currentUserId
        ? `You: ${item.lastMessageText}`
        : item.lastMessageText
      : "No messages yet";

    return (
      <Pressable
        key={item.id}
        onPress={() => openThread(item)}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <Card
            style={[styles.threadCard, pressed && styles.threadCardPressed]}
          >
            <View style={styles.threadHeaderRow}>
              <Text style={styles.threadName}>
                {item.otherParticipant.displayName}
              </Text>
              {item.unread ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text
              style={[styles.preview, item.unread && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          </Card>
        )}
      </Pressable>
    );
  };

  const renderCandidate = (item: Candidate) => {
    const isStarting = isStartingChatWith === item.userId;
    return (
      <Pressable
        key={item.userId}
        onPress={() => startChat(item)}
        disabled={isStarting}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <Card
            style={[
              styles.candidateCard,
              pressed && !isStarting && styles.threadCardPressed,
            ]}
          >
            <Text style={styles.threadName}>{item.displayName}</Text>
            <Text style={styles.preview}>
              {isStarting ? "Opening chat…" : "Start conversation"}
            </Text>
          </Card>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {isLoadingThreads ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : threadsError ? (
          <EmptyState
            title="Unable to load conversations"
            description={threadsError}
          />
        ) : threads.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description='Tap the "+" button to start a new direct message.'
          />
        ) : (
          <View style={styles.listContent}>{threads.map(renderThread)}</View>
        )}
      </ScrollView>

      {/* Floating action button */}
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.floatingButton,
          pressed && styles.floatingButtonPressed,
        ]}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>

      {/* New chat picker modal */}
      <Modal
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
        showHandle
        sheetStyle={styles.pickerSheet}
      >
        <Text style={styles.pickerTitle}>New message</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search people…"
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoadingCandidates ? (
          <View style={styles.pickerLoading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : filteredCandidates.length === 0 ? (
          <View style={styles.pickerLoading}>
            <Text style={styles.pickerEmpty}>
              {searchQuery.trim()
                ? "No matches found."
                : "No other users found."}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.pickerList}
            contentContainerStyle={styles.pickerListContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredCandidates.map(renderCandidate)}
          </ScrollView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  listContent: {
    gap: 10,
  },
  pressable: {
    borderRadius: 14,
  },
  threadCard: {
    gap: 8,
  },
  candidateCard: {
    gap: 6,
  },
  threadCardPressed: {
    opacity: 0.85,
  },
  threadHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  threadName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  preview: {
    color: colors.mutedText,
    fontSize: 13,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: "700",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: colors.accent,
  },
  loadingState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
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
  floatingButtonPressed: {
    opacity: 0.85,
  },
  pickerSheet: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 12,
    maxHeight: "80%",
  },
  pickerTitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: colors.text,
    backgroundColor: colors.background,
  },
  pickerLoading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  pickerEmpty: {
    color: colors.mutedText,
    fontSize: 14,
  },
  pickerList: {
    flexShrink: 1,
  },
  pickerListContent: {
    gap: 10,
    paddingBottom: 8,
  },
});
