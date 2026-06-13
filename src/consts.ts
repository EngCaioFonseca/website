// Central site configuration — change things here, not scattered across files.

export const SITE = {
  title: 'Caio Fonseca',
  role: 'Software engineer & researcher',
  // One-line identity used in hero / meta description.
  description:
    'Software engineer at Red Hat and PhD in molecular communications — building at the intersection of biology, machine learning and systems.',
  // Public URL (project page). Mirrors `site` + `base` in astro.config.mjs.
  url: 'https://engcaiofonseca.github.io/website',
  author: 'Caio Fonseca',
  locale: 'en',

  // TODO(caio): confirm your public-facing email.
  email: 'caio.fonseca@waltoninstitute.ie',

  // Drop a PDF at public/cv.pdf and set this to '/cv.pdf' to show the download.
  cvUrl: '' as string,

  // Account whose public repos power Projects → "From GitHub". Set to your
  // active account; change to 'caioqfonseca' if that one holds the repos to show.
  githubUser: 'EngCaioFonseca',
} as const;

export const SOCIAL = [
  { key: 'github', label: 'GitHub', href: 'https://github.com/EngCaioFonseca', icon: 'ti ti-brand-github' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/caioqfonseca', icon: 'ti ti-brand-linkedin' },
  { key: 'researchgate', label: 'ResearchGate', href: 'https://www.researchgate.net/profile/Caio-Fonseca', icon: 'ti ti-brand-researchgate' },
  { key: 'email', label: 'Email', href: `mailto:${SITE.email}`, icon: 'ti ti-mail' },
] as const;

export const NAV = [
  { href: '/', label: 'home' },
  { href: '/projects', label: 'projects' },
  { href: '/experience', label: 'experience' },
  { href: '/academic', label: 'academic' },
  { href: '/writing', label: 'writing' },
  { href: '/about', label: 'about' },
  { href: '/contact', label: 'contact' },
] as const;

// Third-party services for the "live" features. Fill these in to switch them on;
// each gracefully no-ops while empty so the site always builds.
export const SERVICES = {
  // Formspree: create a free form, paste its ID (the part after /f/).
  formspreeId: '', // e.g. 'xayzqwer'
  // GoatCounter: your site code (the subdomain you register).
  goatcounterCode: '', // e.g. 'caiofonseca'
  // giscus (comments): from https://giscus.app after enabling Discussions.
  giscus: {
    repo: '', // 'caioqfonseca/caioqfonseca.github.io'
    repoId: '',
    category: 'Announcements',
    categoryId: '',
  },
} as const;
