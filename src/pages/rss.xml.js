import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';
import { withBase } from '../utils/url';

export async function GET(context) {
  const posts = (await getCollection('posts')).filter((p) => !p.data.draft);
  return rss({
    title: `${SITE.title} — Writing`,
    description: SITE.description,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: withBase(`/writing/${post.id}/`),
      })),
  });
}
