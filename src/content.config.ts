import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const journal = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['essay', 'note', 'photo-essay']),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    hero: z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }).optional(),
    video: z.object({ streamId: z.string(), poster: z.string(), caption: z.string().optional() }).optional(),
    gallery: z.string().optional(),
    draft: z.boolean().default(false),
    canonicalUrl: z.string().url().optional(),
    location: z.string().optional(),
  }),
});

const galleries = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/galleries', generateId: ({ entry }) => entry.replace(/\.json$/, '') }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.coerce.date(),
    location: z.string().optional(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      width: z.number(),
      height: z.number(),
    })),
  }),
});

export const collections = { journal, galleries };
