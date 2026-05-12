import { Stack } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="groups" options={{ title: 'Groups', headerShown: false }} />
      <Stack.Screen name="notes/[noteId]" options={{ title: 'Note' }} />
      <Stack.Screen name="music" options={{ title: 'Music' }} />
      <Stack.Screen name="shop" options={{ title: 'Shop' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
