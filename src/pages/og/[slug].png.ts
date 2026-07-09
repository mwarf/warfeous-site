import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { TYPE_LABEL, formatDate } from '../../lib/utils';

// This endpoint is prerendered, so it only ever runs at build time in Node.
// resvg is a native module the Workers bundler chokes on; require() keeps it
// out of the static import graph.
const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');

export const prerender = true;

export async function getStaticPaths() {
  const entries = await getCollection('journal', ({ data }) => !data.draft);
  return entries.map(entry => ({
    params: { slug: entry.id },
    props: {
      title: entry.data.title,
      type: entry.data.type,
      publishedAt: entry.data.publishedAt,
    },
  }));
}

const fraunces = fs.readFileSync(path.join(process.cwd(), 'src/assets/og/fraunces-og.ttf'));
const mono = fs.readFileSync(path.join(process.cwd(), 'src/assets/og/ia-writer-mono-og.ttf'));

interface Props {
  title: string;
  type: string;
  publishedAt: Date;
}

export async function GET({ props }: APIContext) {
  const { title, type, publishedAt } = props as Props;
  const eyebrow = `${TYPE_LABEL[type] || type} · ${formatDate(publishedAt)}`.toUpperCase();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#EAE6D5',
          padding: '72px 80px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontFamily: 'iA Writer Mono S',
                fontSize: '26px',
                letterSpacing: '0.08em',
                color: '#6B7268',
              },
              children: eyebrow,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexGrow: 1,
                alignItems: 'center',
                paddingBottom: '40px',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Fraunces',
                    fontSize: title.length > 34 ? '68px' : '84px',
                    lineHeight: 1.02,
                    letterSpacing: '-0.032em',
                    color: '#2A2F2D',
                    maxWidth: '980px',
                  },
                  children: title,
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontFamily: 'Fraunces',
                fontSize: '38px',
                letterSpacing: '-0.02em',
                color: '#1B201F',
              },
              children: 'warfeous',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fraunces', data: fraunces, weight: 400, style: 'normal' },
        { name: 'iA Writer Mono S', data: mono, weight: 400, style: 'normal' },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
}
