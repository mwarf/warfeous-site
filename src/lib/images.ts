// Cloudflare Images delivery URLs. Entries reference stills by Image ID in
// frontmatter; local paths (starting with "/") and full URLs pass through
// untouched so seeded content keeps working before images are uploaded.
// The delivery hash is public. Keep the environment override for alternate
// deployments, but don't let a missing CI variable turn image IDs into broken
// relative URLs.
const CF_HASH =
  (import.meta.env.PUBLIC_CF_IMAGES_HASH as string | undefined) ||
  'GLfMUvWq6peuDyFS0jOqDA';

export function isImagePath(src: string): boolean {
  return src.startsWith('/') || src.startsWith('http');
}

export function imageUrl(src: string, _width = 1200): string {
  if (isImagePath(src) || !CF_HASH) return src;
  return `https://imagedelivery.net/${CF_HASH}/${src}/public`;
}

export function imageSrcset(_src: string): undefined {
  return undefined;
}
