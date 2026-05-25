import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { Button } from "@/src/components/ui/Button";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { TextInput } from "@/src/components/ui/TextInput";
import { useAuth } from "@/src/hooks/useAuth";
import { brand } from "@/src/theme/brand";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(10)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 380,
        delay: 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 420,
        delay: 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslate, heroOpacity, heroTranslate]);

  async function onLogin() {
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} centered>
      <Animated.View
        style={[
          styles.hero,
          { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] },
        ]}
      >
        <BrandLogo width={180} />
        <Text style={styles.subtitle}>{brand.loginSubtitle}</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.formCard,
          { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] },
        ]}
      >
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
          label={loading ? "Logging in..." : "Log in"}
          onPress={onLogin}
        />
        <Button
          label="Create account"
          onPress={() => router.push("/signup")}
          variant="ghost"
        />
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  kicker: {
    ...typography.labelCaps,
    color: colors.accent,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.mutedText,
    textAlign: "center",
    maxWidth: 320,
  },
  formCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  error: {
    color: colors.danger,
    ...typography.caption,
  },
});
