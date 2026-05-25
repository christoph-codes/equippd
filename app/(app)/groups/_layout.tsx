import { Stack } from "expo-router";

import { BrandHeaderTitle } from "@/src/components/brand/BrandLogo";
import { colors } from "@/src/theme/colors";
import { typography } from "@/src/theme/typography";

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
        options={{ headerShown: false, title: "GROUPS" }}
      />
      <Stack.Screen
        name="[groupSlug]/index"
        options={{
          headerTitle: "GROUP",
          headerTitleStyle: {
            color: colors.text,
            fontFamily: typography.sectionTitle.fontFamily,
            fontSize: typography.sectionTitle.fontSize,
            fontWeight: typography.sectionTitle.fontWeight,
          },
        }}
      />
      <Stack.Screen
        name="[groupSlug]/studies/index"
        options={{ headerTitle: () => <BrandHeaderTitle title="STUDIES" /> }}
      />
      <Stack.Screen
        name="[groupSlug]/studies/[studySlug]"
        options={{
          headerTitle: "STUDY",
          headerTitleStyle: {
            color: colors.text,
            fontFamily: typography.sectionTitle.fontFamily,
            fontSize: typography.sectionTitle.fontSize,
            fontWeight: typography.sectionTitle.fontWeight,
          },
        }}
      />
    </Stack>
  );
}
