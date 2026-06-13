// Base-aware URL helper. On a GitHub project page the site is served from a
// subpath (e.g. "/website"), so every internal link/asset must include it.
// `import.meta.env.BASE_URL` is "/website/" (or "/") and is inlined at build,
// so this works in .astro files, endpoints, and client React islands alike.

const RAW = import.meta.env.BASE_URL;

export function withBase(path = '/'): string {
  const base = RAW.endsWith('/') ? RAW.slice(0, -1) : RAW; // "" or "/website"
  if (!path || path === '/') return `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
