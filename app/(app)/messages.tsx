import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";

import { ComingSoonPanel } from "@/src/components/ui/ComingSoonPanel";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme/colors";

export default function MessagesScreen() {
  const { refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      <ScreenIntro>Group conversation tools are on the way.</ScreenIntro>
      <ComingSoonPanel
        title="Messages"
        description="Messaging will give groups a shared place for check-ins, updates, and encouragement."
      />
    </ScreenContainer>
  );
}
