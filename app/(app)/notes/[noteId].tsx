import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function LegacyNoteRoute() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(app)/notes");
  }, [router]);

  return null;
}
