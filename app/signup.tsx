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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    setError('');
    setLoading(true);
    try {
      await signUp(displayName, email, password);
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
      <SectionHeader title="Create your Equippd account" subtitle="Create your platform account, then request access to the groups you want to join." />
      <Card>
        <TextInput label="Display name" onChangeText={setDisplayName} value={displayName} />
        <TextInput autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <TextInput label="Password" onChangeText={setPassword} secureTextEntry value={password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button disabled={loading} label={loading ? 'Creating account...' : 'Sign up'} onPress={onSignup} />
        <Button label="Back to log in" onPress={() => router.replace('/login')} variant="ghost" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
  },
});
