import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
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

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchAccessibleGroups(user.uid, isAdmin)
      .then((nextGroups) => {
        setGroups(nextGroups);
      })
      .catch(() => {
        setGroups([]);
      });
  }, [isAdmin, user]);

  return (
    <ScreenContainer>
      <ScreenIntro>
        {`Welcome, ${user?.displayName || "Equippd Member"}!`}
      </ScreenIntro>

      {groups.length ? (
        <Card>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>
                {isAdmin ? "Group overview" : "Your groups"}
              </Text>
              <Text style={styles.description}>
                {isAdmin
                  ? `${groups.length} group${groups.length === 1 ? "" : "s"} available across Equippd.`
                  : `You're connected to ${groups.length} group${groups.length === 1 ? "" : "s"}.`}
              </Text>
            </View>
            <Button label="Open" onPress={() => router.push("/(app)/groups")} />
          </View>
          {groups.slice(0, 2).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => router.push(`/(app)/groups/${group.slug}`)}
            />
          ))}
        </Card>
      ) : (
        <>
          <EmptyState
            title="No groups yet"
            description="Explore available groups and request access from an admin."
          />
          <Button
            label="Explore groups"
            onPress={() => router.push("/(app)/groups")}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
});
