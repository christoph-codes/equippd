import { useLocalSearchParams, useRouter } from 'expo-router';

import { StudyCard } from '@/src/components/cards/StudyCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { loadStudiesByGroup } from '@/src/services/content/mdx';

export default function GroupStudiesScreen() {
  const router = useRouter();
  const { groupSlug } = useLocalSearchParams<{ groupSlug: string }>();
  const studies = loadStudiesByGroup(groupSlug);

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
