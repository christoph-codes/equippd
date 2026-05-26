import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { listContentPaths } from "@/src/services/content/mdx";
import { isFirebaseConfigured } from "@/src/services/firebase/config";
import { colors } from "@/src/theme/colors";

export default function SettingsScreen() {
  const router = useRouter();
  const { refreshProfile, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function onLogout() {
    await signOut();
    router.replace("/login");
  }

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile]);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <PageHeader
        title="Settings"
        subtitle="App configuration and account shortcuts."
      />
      <Card>
        <SectionHeader
          title="Account"
          subtitle="Manage your profile, password, and photo in one place."
        />
        <Button
          label="Open account management"
          onPress={() => router.push("/(app)/account")}
        />
      </Card>
      <Card>
        <SectionHeader
          title="Firebase"
          subtitle={
            isFirebaseConfigured()
              ? "Configured"
              : "Missing EXPO_PUBLIC_FIREBASE_* values"
          }
        />
      </Card>
      <Card>
        <SectionHeader
          title="Managed Content Paths"
          subtitle={listContentPaths().join("\n")}
        />
      </Card>
      <Button label="Log out" onPress={onLogout} variant="danger" />
    </ScreenContainer>
  );
}
