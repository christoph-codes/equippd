import matter from 'gray-matter';

import { MusicItem, Study } from '@/src/models/types';
import { musicMdxContent, studyMdxContent } from '@/src/services/content/registry';

type RawDoc = {
  path: string;
  source: string;
};

function parseStudy(doc: RawDoc): Study {
  const parsed = matter(doc.source);
  const data = parsed.data as Omit<Study, 'content'>;

  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    content: parsed.content.trim(),
  };
}

export function loadStudiesByGroup(groupSlug: string) {
  return studyMdxContent.map(parseStudy).filter((study) => study.groupSlug === groupSlug);
}

export function loadStudy(groupSlug: string, studySlug: string) {
  return loadStudiesByGroup(groupSlug).find((study) => study.slug === studySlug) ?? null;
}

export function loadMusicItems(): MusicItem[] {
  return musicMdxContent.map((doc) => {
    const parsed = matter(doc.source);
    return {
      title: String(parsed.data.title ?? ''),
      artist: String(parsed.data.artist ?? ''),
      description: String(parsed.data.description ?? '').trim(),
      link: String(parsed.data.link ?? '#'),
    };
  });
}

export function listContentPaths() {
  return [...studyMdxContent, ...musicMdxContent].map((doc) => doc.path);
}
