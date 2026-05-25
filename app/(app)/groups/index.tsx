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

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
import { Modal } from "@/src/components/ui/Modal";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenIntro } from "@/src/components/ui/ScreenIntro";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { TextInput } from "@/src/components/ui/TextInput";
import { useAuth } from "@/src/hooks/useAuth";
import { Group, GroupAccessRequest } from "@/src/models/types";
import {
  approveGroupAccessRequest,
  createGroup,
  fetchAllGroups,
  fetchPendingAccessRequests,
  fetchUserAccessRequests,
  fetchUserGroups,
  rejectGroupAccessRequest,
  requestGroupAccess,
} from "@/src/services/firebase/groups";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

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
  const [loading, setLoading] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const loadGroups = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
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

  async function onRejectRequest(request: GroupAccessRequest) {
    if (!user) {
      return;
    }

    setBusyId(request.id);
    try {
      await rejectGroupAccessRequest(request, user.uid);
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  async function onCreateGroup() {
    const normalizedSlug = groupSlug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!groupName.trim() || !normalizedSlug || !groupDescription.trim()) {
      alert("Please complete all fields before creating a group.");
      return;
    }

    setCreatingGroup(true);
    try {
      await createGroup({
        name: groupName,
        slug: normalizedSlug,
        description: groupDescription,
      });

      setGroupName("");
      setGroupSlug("");
      setGroupDescription("");
      setCreateModalVisible(false);
      await loadGroups();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create this group right now.";
      alert(message);
    } finally {
      setCreatingGroup(false);
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
                <View style={styles.requestActions}>
                  <Button
                    disabled={busyId === request.id}
                    label={busyId === request.id ? "Approving..." : "Approve"}
                    onPress={() => onApproveRequest(request)}
                    size="small"
                  />
                  <Button
                    disabled={busyId === request.id}
                    label={busyId === request.id ? "Rejecting..." : "Deny"}
                    onPress={() => onRejectRequest(request)}
                    size="small"
                    variant="danger"
                  />
                </View>
              </Card>
            ))}
          </>
        ) : null}

        <>
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
              description="You haven't joined or requested a group yet. Tap the search button to browse available groups."
            />
          )}
        </>
      </ScreenContainer>

      {isAdmin ? (
        <>
          <Pressable
            style={[styles.floatingButton, styles.floatingSecondaryButton]}
            onPress={() => setRequestModalVisible(true)}
          >
            <Ionicons
              name="search-outline"
              size={26}
              color={colors.background}
            />
          </Pressable>
          <Pressable
            style={styles.floatingButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={28} color={colors.background} />
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.floatingButton}
          onPress={() => setRequestModalVisible(true)}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </Pressable>
      )}

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
                    {isAdmin ? (
                      <Button
                        label="Visit"
                        size="small"
                        onPress={() => {
                          router.push(`/(app)/groups/${group.slug}`);
                          setRequestModalVisible(false);
                        }}
                      />
                    ) : canVisit ? (
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

      <Modal
        onRequestClose={() => setCreateModalVisible(false)}
        sheetStyle={styles.requestSheet}
        showHandle
        visible={createModalVisible}
      >
        <Text style={styles.requestTitle}>Create Group</Text>

        <View style={styles.createForm}>
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={(value) => {
              setGroupName(value);
              if (!groupSlug) {
                setGroupSlug(
                  value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, ""),
                );
              }
            }}
            placeholder="Community Study Group"
          />
          <TextInput
            label="Slug"
            value={groupSlug}
            onChangeText={setGroupSlug}
            placeholder="community-study-group"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            label="Description"
            value={groupDescription}
            onChangeText={setGroupDescription}
            placeholder="Short description of this group"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.descriptionInput}
          />
          <View style={styles.createActions}>
            <View style={styles.actionButtonWrap}>
              <Button
                label="Cancel"
                onPress={() => setCreateModalVisible(false)}
                variant="ghost"
                disabled={creatingGroup}
              />
            </View>
            <View style={styles.actionButtonWrap}>
              <Button
                label={creatingGroup ? "Creating..." : "Create"}
                onPress={() => void onCreateGroup()}
                disabled={creatingGroup}
              />
            </View>
          </View>
        </View>
      </Modal>
      <LoadingOverlay visible={loading} />
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
    ...typography.sectionTitle,
  },
  meta: {
    color: colors.accent,
    ...typography.caption,
  },
  description: {
    color: colors.mutedText,
    ...typography.body,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
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
    ...typography.labelCaps,
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
    ...typography.labelCaps,
  },
  requestList: {
    gap: 12,
    paddingBottom: 16,
  },
  createForm: {
    gap: 12,
    paddingBottom: 16,
  },
  descriptionInput: {
    minHeight: 88,
  },
  createActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginTop: 4,
  },
  actionButtonWrap: {
    flex: 1,
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
  floatingSecondaryButton: {
    bottom: 84,
  },
});
