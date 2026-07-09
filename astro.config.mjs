import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://warfeous.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [mdx({ optimize: true }), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
  vite: {
    ssr: {
      // Native module used by the build-time OG image endpoint; not bundleable.
      external: ['@resvg/resvg-js'],
    },
  },
});
