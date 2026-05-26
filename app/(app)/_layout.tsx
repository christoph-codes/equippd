import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BrandHeaderTitle } from "@/src/components/brand/BrandLogo";
import { useAuth } from "@/src/hooks/useAuth";
import { subscribeToDirectThreads } from "@/src/services/firebase/messages";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

export default function AppLayout() {
  const { user } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const unreadMessageBadge =
    unreadMessageCount > 9 ? "9+" : String(unreadMessageCount);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) {
      setUnreadMessageCount(0);
      return () => undefined;
    }

    return subscribeToDirectThreads(
      userId,
      (threads) => {
        setUnreadMessageCount(threads.filter((thread) => thread.unread).length);
      },
      () => {
        setUnreadMessageCount(0);
      },
    );
  }, [user?.uid]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          ...typography.labelCaps,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          headerTitle: () => <BrandHeaderTitle title="HOME" />,
          title: "HOME",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? "index";

          return {
            headerTitle: () => <BrandHeaderTitle title="GROUPS" />,
            title: "GROUPS",
            headerShown: focusedRoute === "index",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          };
        }}
      />
      <Tabs.Screen
        name="notes/index"
        options={{
          headerTitle: () => <BrandHeaderTitle title="NOTES" />,
          title: "NOTES",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          headerTitle: () => <BrandHeaderTitle title="MESSAGES" />,
          title: "MESSAGES",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.messagesIcon}>
              <Ionicons name="chatbubbles-outline" color={color} size={size} />
              {unreadMessageCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadMessageBadge}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          headerTitle: () => <BrandHeaderTitle title="MUSIC" />,
          title: "MUSIC",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          headerTitle: () => <BrandHeaderTitle title="ACCOUNT" />,
          title: "ACCOUNT",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes/[noteId]"
        options={{ href: null, title: "NOTE" }}
      />
      <Tabs.Screen
        name="chat/[threadId]"
        options={{ href: null, title: "CHAT" }}
      />
      <Tabs.Screen name="shop" options={{ href: null, title: "SHOP" }} />
      <Tabs.Screen
        name="settings"
        options={{ href: null, title: "SETTINGS" }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  messagesIcon: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  unreadBadgeText: {
    color: colors.accentText,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
    includeFontPadding: false,
    textAlign: "center",
  },
});
