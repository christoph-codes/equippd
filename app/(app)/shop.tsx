import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";

import { ComingSoonPanel } from "@/src/components/ui/ComingSoonPanel";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme/colors";

export default function ShopScreen() {
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
      <SectionHeader
        title="Shop"
        subtitle="A polished placeholder for upcoming Equippd apparel and gear."
      />
      <ComingSoonPanel
        title="Equippd Shop"
        description="The commerce experience is intentionally deferred. This section is ready for future products, categories, and checkout flow integration."
      />
    </ScreenContainer>
  );
}
