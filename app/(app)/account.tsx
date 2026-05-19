import Constants from "expo-constants";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LoadingOverlay } from "@/src/components/ui/LoadingOverlay";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { TextInput } from "@/src/components/ui/TextInput";
import { useAuth } from "@/src/hooks/useAuth";
import {
  deleteFileByUrl,
  uploadProfilePhoto,
} from "@/src/services/firebase/storage";
import { colors } from "@/src/theme/colors";

const PROFILE_REFRESH_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Profile refresh timed out. Please check your connection and try again.",
        ),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AccountScreen() {
  const router = useRouter();
  const {
    profile,
    refreshProfile,
    signOut,
    updatePassword,
    updateProfile,
    user,
  } = useAuth();

  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || "",
  );
  const [savingName, setSavingName] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? "-";
  const currentYear = new Date().getFullYear();

  const activePhotoURL = profile?.photoURL || user?.photoURL || null;
  const initials = useMemo(() => {
    const source =
      displayName.trim() ||
      profile?.displayName ||
      user?.displayName ||
      "Member";
    const words = source.split(/\s+/).filter(Boolean);
    if (!words.length) {
      return "M";
    }

    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }, [displayName, profile?.displayName, user?.displayName]);

  async function onSaveDisplayName() {
    const nextName = displayName.trim();
    if (!nextName) {
      Alert.alert("Display Name Required", "Please enter a display name.");
      return;
    }

    setSavingName(true);
    try {
      await updateProfile(nextName, activePhotoURL);
      await withTimeout(refreshProfile(), PROFILE_REFRESH_TIMEOUT_MS);
      Alert.alert("Profile Updated", "Your display name has been updated.");
    } catch (err) {
      Alert.alert("Could Not Update Profile", (err as Error).message);
    } finally {
      setSavingName(false);
    }
  }

  async function onSelectPhoto() {
    if (!user) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted && process.env.NODE_ENV !== "development") {
      Alert.alert(
        "Permission Needed",
        "Please allow photo library access to upload a profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ["images"],
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    setSavingPhoto(true);
    try {
      const selectedAsset = result.assets[0];
      const previousPhotoURL = activePhotoURL;
      const uploadedPhotoURL = await uploadProfilePhoto(
        user.uid,
        selectedAsset.uri,
        {
          fileName: selectedAsset.fileName ?? undefined,
          mimeType: selectedAsset.mimeType ?? undefined,
        },
      );
      await updateProfile(
        displayName.trim() ||
          profile?.displayName ||
          user.displayName ||
          "Member",
        uploadedPhotoURL,
      );
      if (previousPhotoURL && previousPhotoURL !== uploadedPhotoURL) {
        void deleteFileByUrl(previousPhotoURL);
      }
      await withTimeout(refreshProfile(), PROFILE_REFRESH_TIMEOUT_MS);
      Alert.alert("Photo Updated", "Your profile photo has been uploaded.");
    } catch (err) {
      Alert.alert("Could Not Upload Photo", (err as Error).message);
    } finally {
      setSavingPhoto(false);
    }
  }

  async function onRemovePhoto() {
    if (!activePhotoURL) {
      return;
    }

    setSavingPhoto(true);
    try {
      await updateProfile(
        displayName.trim() ||
          profile?.displayName ||
          user?.displayName ||
          "Member",
        null,
      );
      void deleteFileByUrl(activePhotoURL);
      await withTimeout(refreshProfile(), PROFILE_REFRESH_TIMEOUT_MS);
      Alert.alert("Photo Removed", "Your profile photo was removed.");
    } catch (err) {
      Alert.alert("Could Not Remove Photo", (err as Error).message);
    } finally {
      setSavingPhoto(false);
    }
  }

  async function onChangePassword() {
    setPasswordError("");

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setPasswordError("Please fill out all password fields.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    if (nextPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      await updatePassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      Alert.alert("Password Updated", "Your password has been changed.");
    } catch (err) {
      setPasswordError((err as Error).message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function onLogout() {
    await signOut();
    router.replace("/login");
  }

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await withTimeout(refreshProfile(), PROFILE_REFRESH_TIMEOUT_MS);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile]);

  return (
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
      <SectionHeader
        title="Account"
        subtitle="Manage your profile, credentials, and session."
      />

      <Card>
        <View style={styles.photoRow}>
          <View style={styles.photoShell}>
            {activePhotoURL ? (
              <Image
                source={{ uri: activePhotoURL }}
                style={styles.photo}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <Button
              label={savingPhoto ? "Uploading..." : "Upload profile photo"}
              onPress={onSelectPhoto}
              disabled={savingPhoto}
            />
            <Button
              label="Remove photo"
              variant="ghost"
              onPress={onRemovePhoto}
              disabled={!activePhotoURL || savingPhoto}
            />
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Display Name"
          subtitle="This appears across your groups and notes."
        />
        <TextInput
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Button
          label={savingName ? "Saving..." : "Save display name"}
          onPress={onSaveDisplayName}
          disabled={savingName}
        />
      </Card>

      <Card>
        <SectionHeader
          title="Update Password"
          subtitle="Confirm your current password to keep your account secure."
        />
        <TextInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextInput
          label="New Password"
          value={nextPassword}
          onChangeText={setNextPassword}
          secureTextEntry
        />
        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {passwordError ? (
          <Text style={styles.error}>{passwordError}</Text>
        ) : null}
        <Button
          label={changingPassword ? "Updating..." : "Update password"}
          onPress={onChangePassword}
          disabled={changingPassword}
        />
      </Card>

      <Card>
        <SectionHeader title="Account Info" />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {profile?.email || user?.email || "-"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>UID</Text>
          <Text style={styles.infoValue}>{user?.uid || "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>
            {formatDateTime(profile?.createdAt || user?.metadata?.creationTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Sign-in</Text>
          <Text style={styles.infoValue}>
            {formatDateTime(user?.metadata?.lastSignInTime)}
          </Text>
        </View>
      </Card>

      <Button label="Log out" variant="danger" onPress={onLogout} />

      <View style={styles.footer}>
        <Text
          style={styles.footerText}
        >{`Equippd © ${currentYear}. All Rights Reserved.`}</Text>
        <Text style={styles.footerText}>{`Version ${appVersion}`}</Text>
      </View>

      <LoadingOverlay visible={savingPhoto || savingName} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photoShell: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    color: colors.mutedText,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontWeight: "600",
  },
  footer: {
    marginTop: 4,
    paddingTop: 2,
    paddingBottom: 6,
    alignItems: "center",
    gap: 2,
  },
  footerText: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
});
