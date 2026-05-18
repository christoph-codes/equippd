import { Stack } from "expo-router";

import { BrandHeaderTitle } from "@/src/components/brand/BrandLogo";
import { colors } from "@/src/theme/colors";

export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Groups" }}
      />
      <Stack.Screen
        name="[groupSlug]/index"
        options={{
          headerTitle: "Group",
          headerTitleStyle: {
            color: colors.text,
            fontSize: 19,
            fontWeight: "800",
          },
        }}
      />
      <Stack.Screen
        name="[groupSlug]/studies/index"
        options={{ headerTitle: () => <BrandHeaderTitle title="Studies" /> }}
      />
      <Stack.Screen
        name="[groupSlug]/studies/[studySlug]"
        options={{
          headerTitle: "Study",
          headerTitleStyle: {
            color: colors.text,
            fontSize: 19,
            fontWeight: "800",
          },
        }}
      />
    </Stack>
  );
}
