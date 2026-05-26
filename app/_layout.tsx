// Buffer polyfill must be first — gray-matter and some Firebase internals rely on it in React Native.
import { Buffer } from "buffer";
if (typeof global.Buffer === "undefined") {
  (global as unknown as Record<string, unknown>).Buffer = Buffer;
}

import { Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
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
      pathname.startsWith("/account") ||
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
    return <LoadingOverlay visible fullScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleAlign: "left",
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rajdhani_700Bold,
  });

  if (!fontsLoaded) {
    return <LoadingOverlay visible fullScreen />;
  }

  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}
