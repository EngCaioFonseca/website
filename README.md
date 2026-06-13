# caioqfonseca.github.io

Personal site of Caio Fonseca — software engineer & researcher. Built with
[Astro](https://astro.build), Tailwind CSS and a few React islands; deployed to
GitHub Pages.

## Develop

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run check    # type-check (astro check)
```

## Where things live

| Path | What |
| --- | --- |
| `src/consts.ts` | Site config: name, URLs, socials, **service keys** (see below) |
| `src/data/experience.ts` | Experience + education timeline |
| `src/content/publications/` | One Markdown file per paper |
| `src/content/projects/` | One Markdown file per project |
| `src/content/posts/` | Blog posts (Markdown / MDX) |
| `src/components/` | UI + React islands (terminal, command palette, etc.) |
| `src/pages/` | Routes |
| `public/` | Static assets (`favicon.svg`, `og.svg`, drop a `cv.pdf` here) |

## Adding content

- **A paper** → add `src/content/publications/my-paper.md` with frontmatter
  (`title`, `authors`, `venue`, `year`, `type`, optional `doi`/`url`/`pdf`).
- **A project** → add `src/content/projects/my-project.md` (`kind: software | research`).
- **A post** → add `src/content/posts/my-post.md` (`title`, `description`, `date`).

## Live features (optional)

All of these live in `SERVICES` in `src/consts.ts` and no-op until filled in:

- **Contact form** — create a [Formspree](https://formspree.io) form, set `formspreeId`.
- **Comments** — enable GitHub Discussions, configure at [giscus.app](https://giscus.app), fill the `giscus` block.
- **Analytics** — register a [GoatCounter](https://www.goatcounter.com) site, set `goatcounterCode`.
- **Live GitHub repos** — set `githubUser`; the Projects page fetches public repos at runtime.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
deploys to GitHub Pages. In the repo settings, set **Pages → Build and
deployment → Source** to **GitHub Actions**.

> This is deployed as a **project page** at `https://engcaiofonseca.github.io/website`
> (`site` + `base: '/website'` in `astro.config.mjs`). All internal links go through
> `withBase()` in `src/utils/url.ts`. To move to a clean root URL later, create a repo
> named `<account>.github.io`, set `base: '/'`, and update `site` + `SITE.url`.
