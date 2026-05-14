import { Stack } from 'expo-router';

import { BrandHeaderTitle } from '@/src/components/brand/BrandLogo';
import { colors } from '@/src/theme/colors';

export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[groupSlug]/index" options={{ headerTitle: () => <BrandHeaderTitle title="Group" /> }} />
      <Stack.Screen name="[groupSlug]/studies/index" options={{ headerTitle: () => <BrandHeaderTitle title="Studies" /> }} />
      <Stack.Screen name="[groupSlug]/studies/[studySlug]" options={{ headerTitle: () => <BrandHeaderTitle title="Study" /> }} />
    </Stack>
  );
}
