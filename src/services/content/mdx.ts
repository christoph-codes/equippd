import matter from "gray-matter";

import { MusicItem } from "@/src/models/types";
import { musicMdxContent } from "@/src/services/content/registry";

type RawDoc = {
  path: string;
  source: string;
};

export function loadMusicItems(): MusicItem[] {
  return musicMdxContent.map((doc) => {
    const parsed = matter(doc.source);
    return {
      title: String(parsed.data.title ?? ""),
      artist: String(parsed.data.artist ?? ""),
      description: String(parsed.data.description ?? "").trim(),
      link: String(parsed.data.link ?? "#"),
    };
  });
}

export function listContentPaths() {
  return musicMdxContent.map((doc: RawDoc) => doc.path);
}
