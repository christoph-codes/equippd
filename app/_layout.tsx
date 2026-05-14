// Buffer polyfill must be first — gray-matter and some Firebase internals rely on it in React Native.
import { Buffer } from "buffer";
if (typeof global.Buffer === "undefined") {
  (global as unknown as Record<string, unknown>).Buffer = Buffer;
}

import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AuthProvider } from "@/src/context/AuthContext";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme/colors";

function RootGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inProtectedArea =
      pathname === "/dashboard" ||
      pathname.startsWith("/groups") ||
      pathname.startsWith("/notes") ||
      pathname.startsWith("/music") ||
      pathname.startsWith("/shop") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/(app)");

    if (!user && inProtectedArea) {
      router.replace("/login");
      return;
    }

    if (
      user &&
      (pathname === "/login" || pathname === "/signup" || pathname === "/")
    ) {
      router.replace("/(app)/dashboard");
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Log In" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
