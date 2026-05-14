import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group } from "@/src/models/types";
import { fetchAccessibleGroups } from "@/src/services/firebase/groups";

export default function GroupsScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchAccessibleGroups(user.uid, isAdmin)
      .then(setGroups)
      .catch(() => {
        setGroups([]);
      });
  }, [isAdmin, user]);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Bible Study Groups"
        subtitle={
          isAdmin
            ? "All groups across Equippd."
            : "Groups you're currently part of."
        }
      />
      {groups.length ? (
        groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onPress={() => router.push(`/(app)/groups/${group.slug}`)}
          />
        ))
      ) : (
        <EmptyState
          title="No groups found"
          description="Ask a leader to add you to a group."
        />
      )}
    </ScreenContainer>
  );
}
