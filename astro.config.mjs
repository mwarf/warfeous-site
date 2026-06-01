import { defineConfig, svgoOptimizer } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://warfeous.com',
  output: 'static',
  trailingSlash: 'never',
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
  integrations: [mdx({ optimize: true }), sitemap({
    lastmod: new Date(),
  })],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
  vite: {
    optimizeDeps: {
      exclude: ['astro:transitions', 'astro:transitions/client'],
    },
  },
});
