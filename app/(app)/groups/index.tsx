import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text } from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, GroupAccessRequest } from "@/src/models/types";
import {
  approveGroupAccessRequest,
  fetchAllGroups,
  fetchPendingAccessRequests,
  fetchUserAccessRequests,
  fetchUserGroups,
  requestGroupAccess,
} from "@/src/services/firebase/groups";
import { colors } from "@/src/theme/colors";

export default function GroupsScreen() {
  const router = useRouter();
  const { isAdmin, profile, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Group[]>([]);
  const [requests, setRequests] = useState<GroupAccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<GroupAccessRequest[]>(
    [],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user) {
      return;
    }

    const [nextGroups, nextMemberships, nextRequests, nextPendingRequests] =
      await Promise.all([
        fetchAllGroups(),
        fetchUserGroups(user.uid),
        fetchUserAccessRequests(user.uid),
        isAdmin ? fetchPendingAccessRequests() : Promise.resolve([]),
      ]);

    setGroups(nextGroups);
    setMemberships(nextMemberships);
    setRequests(nextRequests);
    setPendingRequests(nextPendingRequests);
  }, [isAdmin, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadGroups();
    } catch {
      setGroups([]);
      setMemberships([]);
      setRequests([]);
      setPendingRequests([]);
    } finally {
      setRefreshing(false);
    }
  }, [loadGroups]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadGroups().catch(() => {
      setGroups([]);
      setMemberships([]);
      setRequests([]);
      setPendingRequests([]);
    });
  }, [loadGroups, user]);

  const membershipSlugs = useMemo(
    () => new Set(memberships.map((group) => group.slug)),
    [memberships],
  );
  const requestStatusByGroupId = useMemo(
    () => new Map(requests.map((request) => [request.groupId, request.status])),
    [requests],
  );

  async function onRequestAccess(group: Group) {
    if (!profile) {
      return;
    }

    setBusyId(group.id);
    try {
      await requestGroupAccess(group, profile);
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  async function onApproveRequest(request: GroupAccessRequest) {
    if (!user) {
      return;
    }

    setBusyId(request.id);
    try {
      await approveGroupAccessRequest(request, user.uid);
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <ScreenIntro>
        {isAdmin
          ? "Review access requests and manage group entry."
          : "Browse available bible study groups"}
      </ScreenIntro>
      {isAdmin && pendingRequests.length ? (
        <>
          <SectionHeader title="Pending Access Requests" />
          {pendingRequests.map((request) => (
            <Card key={`${request.groupId}-${request.userId}`}>
              <Text style={styles.title}>{request.userDisplayName}</Text>
              <Text style={styles.meta}>{request.userEmail}</Text>
              <Text style={styles.description}>
                Requested access to {request.groupName}
              </Text>
              <Button
                disabled={busyId === request.id}
                label={busyId === request.id ? "Approving..." : "Approve"}
                onPress={() => onApproveRequest(request)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <SectionHeader title={isAdmin ? "All Groups" : "Available Groups"} />
      {groups.length ? (
        groups.map((group) => {
          const isMember = membershipSlugs.has(group.slug);
          const requestStatus = requestStatusByGroupId.get(group.id);

          if (isAdmin || isMember) {
            return (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/(app)/groups/${group.slug}`)}
              />
            );
          }

          return (
            <Card key={group.id}>
              <Text style={styles.title}>{group.name}</Text>
              <Text style={styles.meta}>{group.organization}</Text>
              <Text style={styles.description}>{group.description}</Text>
              {requestStatus === "pending" ? (
                <Text style={styles.pending}>Access request pending</Text>
              ) : (
                <Button
                  disabled={!profile || busyId === group.id}
                  label={
                    busyId === group.id ? "Requesting..." : "Request access"
                  }
                  onPress={() => onRequestAccess(group)}
                />
              )}
            </Card>
          );
        })
      ) : (
        <EmptyState
          title="No groups found"
          description="Groups will appear here after an admin creates them."
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: colors.accent,
    fontWeight: "600",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
  pending: {
    color: colors.mutedText,
    fontWeight: "700",
  },
});
