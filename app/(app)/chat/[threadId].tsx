import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { useAuth } from "@/src/hooks/useAuth";
import { ChatMessage, MessageThreadSummary } from "@/src/models/types";
import {
  fetchOlderThreadMessages,
  markThreadAsRead,
  MessagePage,
  sendMessageToThread,
  subscribeToThreadMessages,
  subscribeToThreadSummary,
} from "@/src/services/firebase/messages";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

const MESSAGE_PAGE_SIZE = 25;
const READ_AT_BOTTOM_THRESHOLD = 32;
const LOAD_OLDER_AT_TOP_THRESHOLD = 80;

type MessageRowProps = {
  item: ChatMessage;
  currentUserId: string;
};

function sameMessage(a: ChatMessage, b: ChatMessage) {
  return (
    a.id === b.id &&
    a.threadId === b.threadId &&
    a.senderId === b.senderId &&
    a.senderDisplayName === b.senderDisplayName &&
    a.text === b.text &&
    a.createdAt === b.createdAt
  );
}

function preserveStableMessages(
  previousMessages: ChatMessage[],
  nextMessages: ChatMessage[],
) {
  if (previousMessages.length === 0) {
    return nextMessages;
  }

  const previousById = new Map(
    previousMessages.map((message) => [message.id, message]),
  );

  let changed = previousMessages.length !== nextMessages.length;
  const stableMessages = nextMessages.map((message, index) => {
    const previous = previousById.get(message.id);
    if (previous && sameMessage(previous, message)) {
      if (previousMessages[index] !== previous) {
        changed = true;
      }
      return previous;
    }

    changed = true;
    return message;
  });

  return changed ? stableMessages : previousMessages;
}

function messageMillis(message: ChatMessage) {
  const parsed = Date.parse(message.createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const MessageRow = memo(
  function MessageRow({ item, currentUserId }: MessageRowProps) {
    const isCurrentUser = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageRow,
          isCurrentUser ? styles.messageRowCurrentUser : styles.messageRowOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.messageBubbleCurrentUser
              : styles.messageBubbleOther,
          ]}
        >
          {!isCurrentUser ? (
            <Text style={styles.messageSender}>{item.senderDisplayName}</Text>
          ) : null}
          <Text
            style={[
              styles.messageText,
              isCurrentUser && styles.messageTextCurrentUser,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  },
  (previous, next) =>
    previous.currentUserId === next.currentUserId &&
    sameMessage(previous.item, next.item),
);

export default function ChatThreadScreen() {
  const headerHeight = useHeaderHeight();
  const { threadId, otherUserName } = useLocalSearchParams<{
    threadId: string;
    otherUserName?: string;
  }>();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<MessageThreadSummary | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef("");
  const listContentHeightRef = useRef(0);
  const listViewportHeightRef = useRef(0);
  const listScrollOffsetRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  const hasOlderMessagesRef = useRef(false);
  const hasLoadedOlderMessagesRef = useRef(false);
  const isLoadingOlderMessagesRef = useRef(false);
  const oldestMessageCursorRef = useRef<MessagePage["oldestCursor"]>(null);
  const shouldScrollToBottomRef = useRef(true);
  const threadIdRef = useRef<string | null>(null);

  const currentUserId = user?.uid ?? "";
  currentUserIdRef.current = currentUserId;
  threadIdRef.current = threadId || null;
  const currentDisplayName =
    profile?.displayName ?? user?.displayName ?? "Equippd User";

  const title =
    thread?.otherParticipant.displayName ??
    (typeof otherUserName === "string" ? otherUserName : "Chat");

  const isListAtBottom = useCallback(() => {
    const distanceFromBottom =
      listContentHeightRef.current -
      listViewportHeightRef.current -
      listScrollOffsetRef.current;

    return distanceFromBottom <= READ_AT_BOTTOM_THRESHOLD;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!threadId || !currentUserId) {
        setIsLoadingThread(false);
        setIsLoadingMessages(false);
        return () => undefined;
      }

      setIsLoadingThread(true);
      setIsLoadingMessages(true);
      setIsLoadingOlderMessages(false);
      hasOlderMessagesRef.current = false;
      hasLoadedOlderMessagesRef.current = false;
      isLoadingOlderMessagesRef.current = false;
      oldestMessageCursorRef.current = null;
      shouldScrollToBottomRef.current = true;
      messagesRef.current = [];
      setMessages([]);

      const unsubscribeThread = subscribeToThreadSummary(
        threadId,
        currentUserId,
        (nextThread) => {
          setThread(nextThread);
          setIsLoadingThread(false);
        },
        () => {
          setIsLoadingThread(false);
        },
      );

      const unsubscribeMessages = subscribeToThreadMessages(
        threadId,
        MESSAGE_PAGE_SIZE,
        (nextMessages) => {
          setMessages((previousMessages) => {
            shouldScrollToBottomRef.current =
              previousMessages.length === 0 || isListAtBottom();
            const nextMessageIds = new Set(
              nextMessages.map((message) => message.id),
            );
            const oldestRecentMessageMillis = nextMessages[0]
              ? messageMillis(nextMessages[0])
              : 0;
            const olderLoadedMessages = hasLoadedOlderMessagesRef.current
              ? previousMessages.filter(
                  (message) =>
                    !nextMessageIds.has(message.id) &&
                    messageMillis(message) < oldestRecentMessageMillis,
                )
              : [];
            const stableMessages = preserveStableMessages(previousMessages, [
              ...olderLoadedMessages,
              ...nextMessages,
            ]);
            messagesRef.current = stableMessages;
            return stableMessages;
          });
          setIsLoadingMessages(false);
        },
        (page) => {
          if (!hasLoadedOlderMessagesRef.current) {
            oldestMessageCursorRef.current = page.oldestCursor;
            hasOlderMessagesRef.current = page.hasMore;
          }
        },
        () => {
          setIsLoadingMessages(false);
        },
      );

      return () => {
        unsubscribeThread();
        unsubscribeMessages();
      };
    }, [currentUserId, isListAtBottom, threadId]),
  );

  const canSend = useMemo(
    () => Boolean(draft.trim()) && !isSending,
    [draft, isSending],
  );

  const onSend = useCallback(async () => {
    if (!threadId || !currentUserId || !canSend) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessageToThread({
        threadId,
        senderId: currentUserId,
        senderDisplayName: currentDisplayName,
        text: draft,
      });
      setDraft("");
    } catch {
      Alert.alert(
        "Message failed",
        "We couldn't send this message. Please check your connection and try again.",
      );
    } finally {
      setIsSending(false);
    }
  }, [canSend, currentDisplayName, currentUserId, draft, threadId]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageRow item={item} currentUserId={currentUserId} />
    ),
    [currentUserId],
  );

  const loadOlderMessages = useCallback(async () => {
    const activeThreadId = threadIdRef.current;
    const cursor = oldestMessageCursorRef.current;

    if (
      !activeThreadId ||
      !cursor ||
      !hasOlderMessagesRef.current ||
      isLoadingOlderMessagesRef.current
    ) {
      return;
    }

    isLoadingOlderMessagesRef.current = true;
    setIsLoadingOlderMessages(true);
    try {
      const page = await fetchOlderThreadMessages(
        activeThreadId,
        cursor,
        MESSAGE_PAGE_SIZE,
      );
      hasLoadedOlderMessagesRef.current = true;
      oldestMessageCursorRef.current = page.oldestCursor;
      hasOlderMessagesRef.current = page.hasMore;

      setMessages((previousMessages) => {
        const existingIds = new Set(
          previousMessages.map((message) => message.id),
        );
        const olderMessages = page.messages.filter(
          (message) => !existingIds.has(message.id),
        );
        const stableMessages = preserveStableMessages(previousMessages, [
          ...olderMessages,
          ...previousMessages,
        ]);
        messagesRef.current = stableMessages;
        return stableMessages;
      });
    } catch {
      // Older history is nice-to-have; keep the current conversation usable.
    } finally {
      isLoadingOlderMessagesRef.current = false;
      setIsLoadingOlderMessages(false);
    }
  }, []);

  const markLatestIncomingMessageAsRead = useCallback(() => {
    const activeThreadId = threadIdRef.current;
    const activeUserId = currentUserIdRef.current;

    if (!activeThreadId || !activeUserId) {
      return;
    }

    const latestIncomingMessage = messagesRef.current
      .slice()
      .reverse()
      .find((message) => message.senderId !== activeUserId);

    if (
      !latestIncomingMessage ||
      lastReadMessageIdRef.current === latestIncomingMessage.id
    ) {
      return;
    }

    lastReadMessageIdRef.current = latestIncomingMessage.id;
    markThreadAsRead(activeThreadId, activeUserId).catch(() => {
      lastReadMessageIdRef.current = null;
    });
  }, []);

  const markReadIfAtBottom = useCallback(() => {
    if (isListAtBottom()) {
      markLatestIncomingMessageAsRead();
    }
  }, [isListAtBottom, markLatestIncomingMessageAsRead]);

  const handleListLayout = useCallback(
    (height: number) => {
      listViewportHeightRef.current = height;
      markReadIfAtBottom();
    },
    [markReadIfAtBottom],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      listContentHeightRef.current = height;
      if (shouldScrollToBottomRef.current) {
        listRef.current?.scrollToEnd({ animated: true });
        shouldScrollToBottomRef.current = false;
      }
      requestAnimationFrame(markReadIfAtBottom);
    },
    [markReadIfAtBottom],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      listScrollOffsetRef.current = contentOffset.y;
      listContentHeightRef.current = contentSize.height;
      listViewportHeightRef.current = layoutMeasurement.height;
      if (contentOffset.y <= LOAD_OLDER_AT_TOP_THRESHOLD) {
        loadOlderMessages();
      }
      markReadIfAtBottom();
    },
    [loadOlderMessages, markReadIfAtBottom],
  );

  if (!threadId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <EmptyState
            title="Thread not found"
            description="Open this chat from the messages list."
          />
        </View>
      </SafeAreaView>
    );
  }

  const isLoading = isLoadingThread || isLoadingMessages;

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            initialNumToRender={20}
            ListHeaderComponent={
              isLoadingOlderMessages ? (
                <View style={styles.olderMessagesLoader}>
                  <ActivityIndicator color={colors.accent} size="small" />
                </View>
              ) : null
            }
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS === "android"}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            onContentSizeChange={handleContentSizeChange}
            onEndReached={markLatestIncomingMessageAsRead}
            onEndReachedThreshold={0.1}
            onLayout={(event) =>
              handleListLayout(event.nativeEvent.layout.height)
            }
            onScroll={handleScroll}
            scrollEventThrottle={100}
          />
        )}

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Start conversation..."
            placeholderTextColor={colors.mutedText}
            style={styles.input}
            multiline
            editable={!isSending}
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.sendButtonPressed,
            ]}
          >
            <Text style={styles.sendButtonText}>
              {isSending ? "..." : "Send"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    ...typography.title,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  olderMessagesLoader: {
    alignItems: "center",
    paddingVertical: 8,
  },
  messagesContent: {
    gap: 10,
    paddingTop: 8,
  },
  messageRow: {
    width: "100%",
  },
  messageRowCurrentUser: {
    alignItems: "flex-end",
  },
  messageRowOther: {
    alignItems: "flex-start",
  },
  messageBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "80%",
    gap: 4,
  },
  messageBubbleCurrentUser: {
    backgroundColor: colors.accent,
  },
  messageBubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageSender: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextCurrentUser: {
    color: colors.accentText,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  sendButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: colors.accentText,
    fontWeight: "700",
  },
});
