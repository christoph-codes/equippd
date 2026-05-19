import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { useAuth } from "@/src/hooks/useAuth";
import { Group } from "@/src/models/types";
import { fetchAccessibleGroups } from "@/src/services/firebase/groups";
import { colors } from "@/src/theme/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    void fetchAccessibleGroups(user.uid, isAdmin)
      .then((nextGroups) => {
        setGroups(nextGroups);
      })
      .catch(() => {
        setGroups([]);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, user]);

  return (
    <View style={styles.screen}>
      <ScreenContainer>
        <ScreenIntro>
          {`Welcome, ${user?.displayName || "Equippd Member"}!`}
        </ScreenIntro>

        {groups.length ? (
          <>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.title}>Groups</Text>
              </View>
            </View>
            {groups.slice(0, 2).map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/(app)/groups/${group.slug}`)}
              />
            ))}
          </>
        ) : (
          <>
            <EmptyState
              title="No groups yet"
              description="Explore available groups and request access from an admin."
            />
          </>
        )}
        <Button
          label="Explore groups"
          onPress={() => router.push("/(app)/groups")}
        />
      </ScreenContainer>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    gap: 12,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
