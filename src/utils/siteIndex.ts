import type { CollectionEntry } from 'astro:content';
import { withBase } from './url';

export type SiteIndexEntry = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  type: 'project' | 'publication' | 'post' | 'page';
  tags: string[];
  keywords: string;
};

export function buildSiteIndex(
  projects: CollectionEntry<'projects'>[],
  publications: CollectionEntry<'publications'>[],
  posts: CollectionEntry<'posts'>[],
): SiteIndexEntry[] {
  const pages: SiteIndexEntry[] = [
    {
      id: 'page-about',
      title: 'About',
      excerpt: 'Software engineer at Red Hat, PhD in molecular communications.',
      href: withBase('/about'),
      type: 'page',
      tags: ['bio', 'background'],
      keywords: 'about caio fonseca red hat phd',
    },
    {
      id: 'page-experience',
      title: 'Experience',
      excerpt: 'Professional timeline — Red Hat, research, teaching.',
      href: withBase('/experience'),
      type: 'page',
      tags: ['career', 'jobs'],
      keywords: 'experience work red hat ucla rit',
    },
    {
      id: 'page-academic',
      title: 'Academic research',
      excerpt: 'Publications, research projects, education.',
      href: withBase('/academic'),
      type: 'page',
      tags: ['research', 'phd', 'papers'],
      keywords: 'academic publications molecular communications glioblastoma eeg',
    },
    {
      id: 'page-contact',
      title: 'Contact',
      excerpt: 'Get in touch by email or social.',
      href: withBase('/contact'),
      type: 'page',
      tags: ['email'],
      keywords: 'contact email reach',
    },
  ];

  const projectEntries: SiteIndexEntry[] = projects.map((p) => ({
    id: `project-${p.id}`,
    title: p.data.title,
    excerpt: p.data.description,
    href: p.data.repo ?? p.data.url ?? withBase('/projects'),
    type: 'project' as const,
    tags: [...p.data.tags, p.data.kind],
    keywords: `${p.data.title} ${p.data.description} ${p.data.tags.join(' ')} ${p.data.kind}`,
  }));

  const pubEntries: SiteIndexEntry[] = publications.map((p) => ({
    id: `pub-${p.id}`,
    title: p.data.title,
    excerpt: p.data.abstract ?? `${p.data.authors} — ${p.data.venue} (${p.data.year})`,
    href: p.data.url ?? p.data.doi ?? withBase('/academic'),
    type: 'publication' as const,
    tags: [...p.data.tags, p.data.type],
    keywords: `${p.data.title} ${p.data.authors} ${p.data.venue} ${p.data.tags.join(' ')}`,
  }));

  const postEntries: SiteIndexEntry[] = posts
    .filter((p) => !p.data.draft)
    .map((p) => ({
      id: `post-${p.id}`,
      title: p.data.title,
      excerpt: p.data.description,
      href: withBase(`/writing/${p.id}/`),
      type: 'post' as const,
      tags: p.data.tags,
      keywords: `${p.data.title} ${p.data.description} ${p.data.tags.join(' ')}`,
    }));

  return [...pages, ...projectEntries, ...pubEntries, ...postEntries];
}

export function searchSiteIndex(
  index: SiteIndexEntry[],
  query: string,
  limit = 8,
): SiteIndexEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return index
    .map((entry) => {
      const title = entry.title.toLowerCase();
      const hay = `${entry.title} ${entry.excerpt} ${entry.tags.join(' ')} ${entry.keywords}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 12;
        if (entry.tags.some((tag) => tag.toLowerCase().includes(t))) score += 6;
        if (hay.includes(t)) score += 2;
      }
      return { entry, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);
}

export function typeLabel(type: SiteIndexEntry['type']): string {
  switch (type) {
    case 'project':
      return 'project';
    case 'publication':
      return 'paper';
    case 'post':
      return 'post';
    default:
      return 'page';
  }
}
