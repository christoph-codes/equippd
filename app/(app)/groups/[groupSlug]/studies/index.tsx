import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { StudyCard } from "@/src/components/cards/StudyCard";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Study, StudyEngagement } from "@/src/models/types";
import {
  fetchStudiesByGroup,
  fetchStudyEngagementByGroup,
} from "@/src/services/firebase/firestore";
import { canAccessGroup } from "@/src/services/firebase/groups";

export default function GroupStudiesScreen() {
  const router = useRouter();
  const { groupSlug } = useLocalSearchParams<{ groupSlug: string }>();
  const { isAdmin, user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [studies, setStudies] = useState<Study[]>([]);
  const [engagementByStudy, setEngagementByStudy] = useState<
    Record<string, StudyEngagement>
  >({});

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

  useEffect(() => {
    if (!groupSlug) return;
    void fetchStudiesByGroup(groupSlug).then(setStudies);
  }, [groupSlug]);

  useEffect(() => {
    if (!groupSlug) {
      setEngagementByStudy({});
      return;
    }

    void fetchStudyEngagementByGroup(groupSlug).then(setEngagementByStudy);
  }, [groupSlug]);

  const sortedStudies = [...studies].sort((a, b) => {
    const aTotal = engagementByStudy[a.slug]?.total ?? 0;
    const bTotal = engagementByStudy[b.slug]?.total ?? 0;
    if (aTotal !== bTotal) {
      return bTotal - aTotal;
    }
    return a.title.localeCompare(b.title);
  });

  const topStudySlug = sortedStudies[0]?.slug;

  if (accessChecked && !hasAccess) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Access required"
          description="Request access to this group before opening its studies."
        />
        <Button
          label="Browse groups"
          onPress={() => router.replace("/(app)/groups")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Studies" subtitle={`Group: ${groupSlug}`} />
      {sortedStudies.length ? (
        sortedStudies.map((study) => (
          <StudyCard
            key={study.slug}
            study={study}
            engagement={engagementByStudy[study.slug]}
            isTopEngaged={Boolean(
              topStudySlug &&
              study.slug === topStudySlug &&
              (engagementByStudy[study.slug]?.total ?? 0) > 0,
            )}
            onPress={() =>
              router.push(`/(app)/groups/${groupSlug}/studies/${study.slug}`)
            }
          />
        ))
      ) : (
        <EmptyState
          title="No studies yet"
          description="Studies for this group will appear here."
        />
      )}
    </ScreenContainer>
  );
}
