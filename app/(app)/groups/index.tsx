import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { GroupCard } from '@/src/components/cards/GroupCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { Group } from '@/src/models/types';
import { fetchUserGroups } from '@/src/services/firebase/groups';

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void fetchUserGroups(user.uid).then(setGroups);
  }, [user]);

  return (
    <ScreenContainer>
      <SectionHeader title="Bible Study Groups" subtitle="Groups you're currently part of." />
      {groups.length ? (
        groups.map((group) => (
          <GroupCard key={group.id} group={group} onPress={() => router.push(`/(app)/groups/${group.slug}`)} />
        ))
      ) : (
        <EmptyState title="No groups found" description="Ask a leader to add you to a group." />
      )}
    </ScreenContainer>
  );
}
