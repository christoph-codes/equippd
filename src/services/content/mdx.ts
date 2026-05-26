import { musicMdxContent } from "@/src/services/content/registry";

type RawDoc = {
  path: string;
  source: string;
};

/**
 * Returns the count of music items from static content.
 * Note: In React Native/Expo, gray-matter parsing doesn't work due to Buffer requirements.
 * This is now deprecated in favor of Firebase-based music management.
 */
export function getMusicItemCount(): number {
  return musicMdxContent.length;
}

export function listContentPaths() {
  return musicMdxContent.map((doc: RawDoc) => doc.path);
}
