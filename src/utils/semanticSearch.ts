import type { SiteIndexEntry } from './siteIndex';

// Fully client-side semantic search. Lazy-loads a small sentence-embedding model
// (MiniLM, ~quantized) via transformers.js from a CDN on first use, embeds the
// local site index, and ranks by cosine similarity. No server, no API key.

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const CDN = 'https://esm.sh/@xenova/transformers@2.17.2';

type Extractor = (text: string, opts: Record<string, unknown>) => Promise<{ data: Float32Array }>;

let extractor: Extractor | null = null;
let loadPromise: Promise<Extractor> | null = null;
let entryVectors: { entry: SiteIndexEntry; vec: Float32Array }[] | null = null;

async function load(): Promise<Extractor> {
  if (extractor) return extractor;
  if (!loadPromise) {
    loadPromise = (async () => {
      const url = CDN;
      const mod = (await import(/* @vite-ignore */ url)) as {
        pipeline: (task: string, model: string, opts?: Record<string, unknown>) => Promise<Extractor>;
        env: { allowLocalModels: boolean };
      };
      mod.env.allowLocalModels = false;
      const pipe = await mod.pipeline('feature-extraction', MODEL, { quantized: true });
      extractor = pipe;
      return pipe;
    })();
  }
  return loadPromise;
}

function entryText(e: SiteIndexEntry): string {
  return `${e.title}. ${e.excerpt} ${e.keywords}`;
}

async function embed(pipe: Extractor, text: string): Promise<Float32Array> {
  const out = await pipe(text, { pooling: 'mean', normalize: true });
  return out.data;
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

export type Ranked = { entry: SiteIndexEntry; score: number };

export async function semanticSearch(
  index: SiteIndexEntry[],
  query: string,
  limit = 5,
): Promise<Ranked[]> {
  const pipe = await load();
  if (!entryVectors) {
    const vecs: { entry: SiteIndexEntry; vec: Float32Array }[] = [];
    for (const e of index) {
      vecs.push({ entry: e, vec: await embed(pipe, entryText(e)) });
    }
    entryVectors = vecs;
  }
  const q = await embed(pipe, query);
  return entryVectors
    .map(({ entry, vec }) => ({ entry, score: dot(q, vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function isModelReady(): boolean {
  return extractor !== null;
}
