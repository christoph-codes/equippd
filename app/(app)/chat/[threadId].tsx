import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
  markThreadAsRead,
  sendMessageToThread,
  subscribeToThreadMessages,
  subscribeToThreadSummary,
} from "@/src/services/firebase/messages";
import { colors } from "@/src/theme/colors";

export default function ChatThreadScreen() {
  const { threadId, otherUserName } = useLocalSearchParams<{
    threadId: string;
    otherUserName?: string;
  }>();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thread, setThread] = useState<MessageThreadSummary | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);

  const currentUserId = user?.uid ?? "";
  const currentDisplayName =
    profile?.displayName ?? user?.displayName ?? "Equippd User";

  const title =
    thread?.otherParticipant.displayName ??
    (typeof otherUserName === "string" ? otherUserName : "Chat");

  useFocusEffect(
    useCallback(() => {
      if (!threadId || !currentUserId) {
        setIsLoadingThread(false);
        setIsLoadingMessages(false);
        return () => undefined;
      }

      setIsLoadingThread(true);
      setIsLoadingMessages(true);

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
        (nextMessages) => {
          setMessages(nextMessages);
          setIsLoadingMessages(false);

          const latestMessage = nextMessages[nextMessages.length - 1];
          if (!latestMessage || latestMessage.senderId === currentUserId) {
            return;
          }

          if (lastReadMessageIdRef.current === latestMessage.id) {
            return;
          }

          lastReadMessageIdRef.current = latestMessage.id;
          markThreadAsRead(threadId, currentUserId).catch(() => {
            lastReadMessageIdRef.current = null;
          });
        },
        () => {
          setIsLoadingMessages(false);
        },
      );

      return () => {
        unsubscribeThread();
        unsubscribeMessages();
      };
    }, [currentUserId, threadId]),
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
    } finally {
      setIsSending(false);
    }
  }, [canSend, currentDisplayName, currentUserId, draft, threadId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
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
            isCurrentUser ? styles.messageBubbleCurrentUser : styles.messageBubbleOther,
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
  };

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
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Direct messages update in real time.</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              title="No messages yet"
              description="Send a message to start this conversation."
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              listRef.current?.scrollToEnd({ animated: true });
            }}
          />
        )}

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message"
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
            <Text style={styles.sendButtonText}>{isSending ? "..." : "Send"}</Text>
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
    padding: 16,
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
    fontSize: 26,
    fontWeight: "800",
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
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  messagesContent: {
    gap: 10,
    paddingVertical: 8,
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
