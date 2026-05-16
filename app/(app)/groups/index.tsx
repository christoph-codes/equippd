import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GroupCard } from "@/src/components/cards/GroupCard";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Modal } from "@/src/components/ui/Modal";
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
  const [requestModalVisible, setRequestModalVisible] = useState(false);

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

  const groupById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
  );
  const myGroups = useMemo(() => {
    const entries: Array<{
      group: Group;
      status: GroupAccessRequest["status"];
    }> = [];
    const seen = new Set<string>();

    memberships.forEach((group) => {
      seen.add(group.id);
      entries.push({ group, status: "approved" });
    });

    requests.forEach((request) => {
      const group = groupById.get(request.groupId);
      if (!group) {
        return;
      }

      const existingIndex = entries.findIndex(
        (entry) => entry.group.id === group.id,
      );
      if (existingIndex >= 0) {
        entries[existingIndex] = { group, status: request.status };
        seen.add(group.id);
        return;
      }

      if (!seen.has(group.id)) {
        seen.add(group.id);
        entries.push({ group, status: request.status });
      }
    });

    return entries.sort((a, b) => a.group.name.localeCompare(b.group.name));
  }, [groupById, memberships, requests]);
  const myGroupStatusById = useMemo(
    () =>
      new Map<string, GroupAccessRequest["status"]>(
        myGroups.map((entry) => [entry.group.id, entry.status]),
      ),
    [myGroups],
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

  function statusLabel(status: GroupAccessRequest["status"]) {
    if (status === "approved") {
      return "Visit";
    }

    if (status === "rejected") {
      return "Rejected";
    }

    return "Pending";
  }

  function canOpenGroup(status: GroupAccessRequest["status"]) {
    return status === "approved";
  }

  function statusTone(status: GroupAccessRequest["status"]) {
    if (status === "rejected" || status === "pending") {
      return styles.statusInactive;
    }

    return styles.statusApproved;
  }

  return (
    <View style={styles.container}>
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
            : "View your groups and request access to more."}
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

        {isAdmin ? (
          <>
            <SectionHeader title="All Groups" />
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
                description="Groups will appear here after an admin creates them."
              />
            )}
          </>
        ) : (
          <>
            <SectionHeader title="My groups" />
            {myGroups.length ? (
              myGroups.map(({ group, status }) => {
                const openGroup = canOpenGroup(status);

                return (
                  <Card key={group.id}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardCopy}>
                        <Text style={styles.title}>{group.name}</Text>
                      </View>
                      {openGroup ? (
                        <Button
                          label="Visit"
                          size="small"
                          onPress={() =>
                            router.push(`/(app)/groups/${group.slug}`)
                          }
                        />
                      ) : (
                        <View style={[styles.statusPill, statusTone(status)]}>
                          <Text style={styles.statusText}>
                            {statusLabel(status)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.description}>{group.description}</Text>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                title="No groups yet"
                description="Tap the + button to request access to a group."
              />
            )}
          </>
        )}
      </ScreenContainer>

      {!isAdmin ? (
        <Pressable
          style={styles.floatingButton}
          onPress={() => setRequestModalVisible(true)}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </Pressable>
      ) : null}

      <Modal
        onRequestClose={() => setRequestModalVisible(false)}
        sheetStyle={styles.requestSheet}
        showHandle
        visible={requestModalVisible}
      >
        <Text style={styles.requestTitle}>Browse Groups</Text>

        <ScrollView contentContainerStyle={styles.requestList}>
          {groups.length ? (
            groups.map((group) => {
              const existingStatus = myGroupStatusById.get(group.id);
              const canVisit = existingStatus === "approved";
              const canJoin = !existingStatus;

              return (
                <Card key={group.id}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardCopy}>
                      <Text style={styles.title}>{group.name}</Text>
                    </View>
                    {canVisit ? (
                      <Button
                        label="Visit"
                        size="small"
                        onPress={() => {
                          router.push(`/(app)/groups/${group.slug}`);
                          setRequestModalVisible(false);
                        }}
                      />
                    ) : canJoin ? (
                      <Button
                        disabled={!profile || busyId === group.id}
                        size="small"
                        label={busyId === group.id ? "Joining..." : "Join"}
                        onPress={() => onRequestAccess(group)}
                        variant={
                          !profile || busyId === group.id ? "ghost" : "primary"
                        }
                      />
                    ) : (
                      <Button
                        disabled
                        size="small"
                        label={statusLabel(existingStatus)}
                        onPress={() => {}}
                        variant="ghost"
                      />
                    )}
                  </View>
                  <Text style={styles.description}>{group.description}</Text>
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="No groups available"
              description="Groups will appear here after an admin creates them."
            />
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: colors.accent,
    fontWeight: "600",
    backgroundColor: "blue",
  },
  description: {
    color: colors.mutedText,
    lineHeight: 20,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusApproved: {
    backgroundColor: colors.accent,
  },
  statusInactive: {
    backgroundColor: colors.surfaceAlt,
  },
  statusText: {
    color: colors.accentText,
    fontSize: 12,
    fontWeight: "700",
  },
  requestSheet: {
    backgroundColor: colors.background,
    height: "86%",
    maxHeight: "92%",
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  requestTitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  requestList: {
    gap: 12,
    paddingBottom: 16,
  },
  floatingButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
