import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Tabs } from "expo-router";

import { BrandHeaderTitle } from "@/src/components/brand/BrandLogo";
import { colors } from "@/src/theme/colors";

export default function AppLayout() {
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
          fontWeight: "700",
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
          headerTitle: () => <BrandHeaderTitle title="Home" />,
          title: "Home",
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
            headerTitle: () => <BrandHeaderTitle title="Groups" />,
            title: "Groups",
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
          headerTitle: () => <BrandHeaderTitle title="Notes" />,
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          headerTitle: () => <BrandHeaderTitle title="Messages" />,
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          headerTitle: () => <BrandHeaderTitle title="Music" />,
          title: "Music",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          headerTitle: () => <BrandHeaderTitle title="Account" />,
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes/[noteId]"
        options={{ href: null, title: "Note" }}
      />
      <Tabs.Screen name="shop" options={{ href: null, title: "Shop" }} />
      <Tabs.Screen
        name="settings"
        options={{ href: null, title: "Settings" }}
      />
    </Tabs>
  );
}
