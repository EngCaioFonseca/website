// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Hosted as a GitHub *project page* at engcaiofonseca.github.io/website.
// `site` is the origin; `base` is the subpath the project page is served from.
// To switch to a user site later, set base to "/" and site to the new origin.
export default defineConfig({
  site: 'https://engcaiofonseca.github.io',
  base: '/website',
  trailingSlash: 'ignore',
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
