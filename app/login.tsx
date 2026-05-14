import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { BrandLogo } from '@/src/components/brand/BrandLogo';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { TextInput } from '@/src/components/ui/TextInput';
import { useAuth } from '@/src/hooks/useAuth';
import { colors } from '@/src/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(app)/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <BrandLogo width={190} />
      <SectionHeader
        title="Welcome to Equippd"
        subtitle="Strengthen your walk through studies, notes, and brotherhood."
      />
      <Card>
        <TextInput autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <TextInput label="Password" onChangeText={setPassword} secureTextEntry value={password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button disabled={loading} label={loading ? 'Logging in...' : 'Log in'} onPress={onLogin} />
        <Button label="Create account" onPress={() => router.push('/signup')} variant="ghost" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
  },
});
