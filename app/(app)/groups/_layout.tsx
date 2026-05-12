import { Stack } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
      <Stack.Screen name="[groupSlug]/index" options={{ title: 'Group' }} />
      <Stack.Screen name="[groupSlug]/studies/index" options={{ title: 'Studies' }} />
      <Stack.Screen name="[groupSlug]/studies/[studySlug]" options={{ title: 'Study' }} />
    </Stack>
  );
}
