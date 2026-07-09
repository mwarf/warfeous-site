import rss from '@astrojs/rss';
import { getCollection, getEntry } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const parser = new MarkdownIt({ html: true });

function renderBody(body: string): string {
  return sanitizeHtml(parser.render(body), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      blockquote: ['class'],
      img: ['src', 'alt', 'width', 'height'],
    },
  });
}

export async function GET(context: APIContext) {
  const entries = await getCollection('journal', ({ data }) => !data.draft);
  const sorted = entries.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
  const site = context.site!;

  const items = await Promise.all(
    sorted.map(async entry => {
      const isPhotoEssay = entry.data.type === 'photo-essay';
      let content: string;

      if (isPhotoEssay) {
        // Summaries plus image links for photo essays; full text stays on the site.
        const parts: string[] = [];
        if (entry.data.excerpt) parts.push(`<p>${entry.data.excerpt}</p>`);
        if (entry.data.gallery) {
          const galleryEntry = await getEntry('galleries', entry.data.gallery.id);
          for (const img of galleryEntry?.data.images ?? []) {
            const src = new URL(img.src, site).toString();
            parts.push(`<p><a href="${src}">${img.caption || img.alt}</a></p>`);
          }
        }
        parts.push(`<p><a href="${new URL(`/journal/${entry.id}`, site)}">View the photo essay</a></p>`);
        content = parts.join('\n');
      } else {
        content = renderBody(entry.body || '');
      }

      return {
        title: entry.data.title,
        pubDate: entry.data.publishedAt,
        description: entry.data.excerpt || '',
        link: `/journal/${entry.id}`,
        categories: entry.data.tags,
        content,
      };
    })
  );

  return rss({
    title: 'warfeous',
    description: 'Notes from Southern Alberta. Essays, notes, and photo essays by Michael Warf.',
    site,
    trailingSlash: false,
    items,
    customData: '<language>en-ca</language>',
  });
}
