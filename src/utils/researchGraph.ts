import type { CollectionEntry } from 'astro:content';

export type GraphNode = {
  id: string;
  label: string;
  type: 'paper' | 'project' | 'topic';
  href?: string;
};

export type GraphLink = {
  source: string;
  target: string;
};

export type ResearchGraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

function topicId(tag: string): string {
  return `topic-${tag.toLowerCase().replace(/\s+/g, '-')}`;
}

function shortTitle(title: string, max = 42): string {
  return title.length <= max ? title : `${title.slice(0, max - 1)}…`;
}

export function buildResearchGraph(
  publications: CollectionEntry<'publications'>[],
  researchProjects: CollectionEntry<'projects'>[],
): ResearchGraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const topicSet = new Set<string>();

  for (const p of publications) {
    nodes.push({
      id: `paper-${p.id}`,
      label: shortTitle(p.data.title),
      type: 'paper',
      href: p.data.url ?? p.data.doi,
    });
    for (const tag of p.data.tags) {
      topicSet.add(tag);
      links.push({ source: `paper-${p.id}`, target: topicId(tag) });
    }
  }

  for (const p of researchProjects) {
    nodes.push({
      id: `project-${p.id}`,
      label: p.data.title,
      type: 'project',
      href: p.data.url,
    });
    for (const tag of p.data.tags) {
      topicSet.add(tag);
      links.push({ source: `project-${p.id}`, target: topicId(tag) });
    }
  }

  for (const tag of topicSet) {
    nodes.push({
      id: topicId(tag),
      label: tag,
      type: 'topic',
    });
  }

  return { nodes, links };
}

export function nodeColor(type: GraphNode['type'], accent: string): string {
  switch (type) {
    case 'paper':
      return accent;
    case 'project':
      return '#6366f1';
    case 'topic':
      return 'var(--faint)';
  }
}

export function nodeRadius(type: GraphNode['type'], compact: boolean): number {
  const scale = compact ? 0.85 : 1;
  switch (type) {
    case 'paper':
      return 5 * scale;
    case 'project':
      return 6.5 * scale;
    case 'topic':
      return 4 * scale;
  }
}
