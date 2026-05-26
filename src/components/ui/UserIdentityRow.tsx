import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  name: string;
  photoURL?: string;
  prefix?: string;
};

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "U";
}

export function UserIdentityRow({ name, photoURL, prefix }: Props) {
  const displayName = name.trim() || "Unknown user";
  const label = prefix ? `${prefix} ${displayName}` : displayName;

  return (
    <View style={styles.container}>
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>
            {getInitials(displayName)}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  avatarImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  avatarFallbackText: {
    color: colors.accentText,
    fontSize: 10,
    fontWeight: "700",
  },
  label: {
    color: colors.mutedText,
    flex: 1,
    fontSize: 12,
  },
});
