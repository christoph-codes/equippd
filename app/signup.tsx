import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { Button } from "@/src/components/ui/Button";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { TextInput } from "@/src/components/ui/TextInput";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme/colors";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    setError("");
    setLoading(true);
    try {
      await signUp(displayName, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.logoWrap}>
          <BrandLogo width={160} />
        </View>
        <Text style={styles.subtitle}>
          Join Equippd to strengthen your walk through community and studies.
        </Text>
        <View style={styles.form}>
          <TextInput
            label="Display name"
            onChangeText={setDisplayName}
            value={displayName}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            label="Password"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            disabled={loading}
            label={loading ? "Creating account..." : "Sign up"}
            onPress={onSignup}
          />
          <Button
            label="Back to log in"
            onPress={() => router.replace("/login")}
            variant="ghost"
          />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  form: {
    width: "100%",
    gap: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 8,
  },
});
