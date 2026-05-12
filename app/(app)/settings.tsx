import { useRouter } from 'expo-router';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { isFirebaseConfigured } from '@/src/services/firebase/config';
import { listContentPaths } from '@/src/services/content/mdx';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function onLogout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <ScreenContainer>
      <SectionHeader title="Settings" subtitle="Manage session and inspect foundation setup status." />
      <Card>
        <SectionHeader title="Firebase" subtitle={isFirebaseConfigured() ? 'Configured' : 'Missing EXPO_PUBLIC_FIREBASE_* values'} />
      </Card>
      <Card>
        <SectionHeader title="Managed Content Paths" subtitle={listContentPaths().join('\n')} />
      </Card>
      <Button label="Log out" onPress={onLogout} variant="danger" />
    </ScreenContainer>
  );
}
