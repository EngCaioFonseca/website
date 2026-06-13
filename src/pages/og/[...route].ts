import { OGImageRoute } from 'astro-og-canvas';
import { SITE } from '../../consts';

// Terminal-styled Open Graph cards, one per top-level route, generated at build.
// Referenced from BaseHead as /og/<key>.png.

const MONO = 'JetBrains Mono';

const pages: Record<string, { title: string; description: string }> = {
  home: { title: 'Caio Fonseca', description: 'Software engineer @ Red Hat · PhD in molecular communications' },
  about: { title: 'About', description: 'Software engineer at Red Hat, PhD in molecular communications.' },
  experience: { title: 'Experience', description: 'Red Hat · UCLA · RIT · Safra Institute · WIT' },
  projects: { title: 'Projects', description: 'Software — 8Knot (maintainer), CollectOSS, and more.' },
  academic: { title: 'Academic research', description: 'Publications, research projects, education.' },
  writing: { title: 'Writing', description: 'Notes on software, systems and research.' },
  contact: { title: 'Contact', description: `Get in touch — ${SITE.email}` },
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[13, 13, 12]],
    border: { color: [43, 189, 146], width: 10, side: 'inline-start' },
    padding: 70,
    font: {
      title: { color: [241, 239, 232], families: [MONO], weight: 'Bold', size: 62 },
      description: { color: [168, 166, 157], families: [MONO], size: 30, lineHeight: 1.4 },
    },
    fonts: [
      'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf',
      'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf',
    ],
  }),
});
