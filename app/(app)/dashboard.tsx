import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { NoteCard } from "@/src/components/cards/NoteCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, Note } from "@/src/models/types";
import { getMusicItemCount } from "@/src/services/content/mdx";
import { fetchAccessibleGroups } from "@/src/services/firebase/groups";
import { fetchRecentNotes } from "@/src/services/firebase/notes";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

const featuredMusicCount = getMusicItemCount();

const quickLinks = [
  {
    title: "Groups",
    description: "Jump into your active communities and studies.",
    icon: "people-outline" as const,
    href: "/(app)/groups",
  },
  {
    title: "Notes",
    description: "Capture reflections, sermon takeaways, and study notes.",
    icon: "document-text-outline" as const,
    href: "/(app)/notes",
  },
  {
    title: "Messages",
    description: "Check the group conversation area for updates.",
    icon: "chatbubbles-outline" as const,
    href: "/(app)/messages",
  },
  {
    title: "Music",
    description: "Open the worship and discovery feed.",
    icon: "musical-notes-outline" as const,
    href: "/(app)/music",
  },
  {
    title: "Account",
    description: "Update your profile, password, and session details.",
    icon: "person-circle-outline" as const,
    href: "/(app)/account",
  },
] as const;

type QuickLinkProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function QuickLinkCard({ title, description, icon, onPress }: QuickLinkProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.quickLinkCard}>
        <View style={styles.quickLinkIconWrap}>
          <Ionicons name={icon} size={20} color={colors.accentText} />
        </View>
        <View style={styles.quickLinkCopy}>
          <Text style={styles.quickLinkTitle}>{title}</Text>
          <Text style={styles.quickLinkDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
      </Card>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setRecentNotes([]);
      return;
    }

    const [nextGroups, nextNotes] = await Promise.all([
      fetchAccessibleGroups(user.uid, isAdmin),
      fetchRecentNotes(user.uid, 3, isAdmin),
    ]);

    setGroups(nextGroups);
    setRecentNotes(nextNotes);
  }, [isAdmin, user]);

  useEffect(() => {
    setLoading(true);
    void loadDashboard()
      .catch(() => {
        setGroups([]);
        setRecentNotes([]);
      })
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboard]);

  return (
    <View style={styles.screen}>
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
        <ScreenIntro>
          {`Welcome, ${user?.displayName || "Equippd Member"}!`}
        </ScreenIntro>

        <Card>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Equippd at a glance</Text>
            <Text style={styles.heroTitle}>
              Your study hub, community space, and worship library.
            </Text>
            <Text style={styles.heroDescription}>
              Start here to move between groups, notes, messages, music, and
              your account without digging through the app.
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{groups.length}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{recentNotes.length}</Text>
              <Text style={styles.statLabel}>Recent notes</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{featuredMusicCount}</Text>
              <Text style={styles.statLabel}>Music picks</Text>
            </View>
          </View>
        </Card>

        <SectionHeader
          title="Quick links"
          subtitle="Jump straight to the screens that matter most right now."
        />

        <View style={styles.quickLinks}>
          {quickLinks.map((link) => (
            <QuickLinkCard
              key={link.title}
              description={link.description}
              icon={link.icon}
              onPress={() => router.push(link.href)}
              title={link.title}
            />
          ))}
        </View>

        <SectionHeader
          title="Your groups"
          subtitle="Recent communities and study spaces available to you."
        />

        {groups.length ? (
          <>
            {groups.slice(0, 2).map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/(app)/groups/${group.slug}`)}
              />
            ))}
            <Button
              label="Explore groups"
              onPress={() => router.push("/(app)/groups")}
            />
          </>
        ) : (
          <EmptyState
            title="No groups yet"
            description="Explore available groups and request access from an admin."
          />
        )}

        <SectionHeader
          title="Recent notes"
          subtitle="Pick up where you left off or start a fresh reflection."
        />

        {recentNotes.length ? (
          <>
            {recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => router.push("/(app)/notes")}
              />
            ))}
            <Button
              label="Open notes"
              onPress={() => router.push("/(app)/notes")}
              variant="ghost"
            />
          </>
        ) : (
          <EmptyState
            title="No notes yet"
            description="Create your first note to keep study thoughts organized."
          />
        )}
      </ScreenContainer>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heroCopy: {
    gap: 4,
  },
  heroEyebrow: {
    color: colors.accent,
    ...typography.labelCaps,
  },
  heroTitle: {
    color: colors.text,
    ...typography.title,
  },
  heroDescription: {
    color: colors.mutedText,
    ...typography.bodySmall,
    marginTop: 4,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  statPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 84,
    alignItems: "center",
  },
  statValue: {
    color: colors.text,
    ...typography.sectionTitle,
  },
  statLabel: {
    color: colors.mutedText,
    ...typography.caption,
  },
  quickLinks: {
    gap: 10,
  },
  quickLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickLinkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickLinkCopy: {
    flex: 1,
    gap: 2,
  },
  quickLinkTitle: {
    color: colors.text,
    ...typography.button,
  },
  quickLinkDescription: {
    color: colors.mutedText,
    ...typography.bodySmall,
  },
});
