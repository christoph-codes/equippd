import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { StudyCard } from '@/src/components/cards/StudyCard';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { loadStudiesByGroup } from '@/src/services/content/mdx';
import { canAccessGroup } from '@/src/services/firebase/groups';

export default function GroupStudiesScreen() {
  const router = useRouter();
  const { groupSlug } = useLocalSearchParams<{ groupSlug: string }>();
  const { isAdmin, user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const studies = loadStudiesByGroup(groupSlug);

  useEffect(() => {
    if (!groupSlug || !user) {
      return;
    }

    setAccessChecked(false);
    void canAccessGroup(user.uid, groupSlug, isAdmin).then((nextHasAccess) => {
      setHasAccess(nextHasAccess);
      setAccessChecked(true);
    });
  }, [groupSlug, isAdmin, user]);

  if (accessChecked && !hasAccess) {
    return (
      <ScreenContainer>
        <EmptyState title="Access required" description="Request access to this group before opening its studies." />
        <Button label="Browse groups" onPress={() => router.replace('/(app)/groups')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Studies" subtitle={`Group: ${groupSlug}`} />
      {studies.length ? (
        studies.map((study) => (
          <StudyCard
            key={study.slug}
            study={study}
            onPress={() => router.push(`/(app)/groups/${groupSlug}/studies/${study.slug}`)}
          />
        ))
      ) : (
        <EmptyState title="No studies found" description="Add MDX files under /content/studies to populate this screen." />
      )}
    </ScreenContainer>
  );
}
