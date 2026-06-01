import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const entries = await getCollection('journal', ({ data }) => !data.draft);
  const sorted = entries.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: 'warfeous',
    description: 'Notes from Southern Alberta. Essays, notes, and photo essays by Michael Warf.',
    site: context.site!.toString(),
    items: sorted.map(entry => ({
      title: entry.data.title,
      pubDate: entry.data.publishedAt,
      description: entry.data.excerpt || '',
      link: `/journal/${entry.id}`,
      categories: entry.data.tags,
    })),
    customData: '<language>en-ca</language>',
  });
}
