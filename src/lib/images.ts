// Cloudflare Images delivery URLs. Entries reference stills by Image ID in
// frontmatter; local paths (starting with "/") and full URLs pass through
// untouched so seeded content keeps working before images are uploaded.
// PUBLIC_CF_IMAGES_HASH is the account hash from the Cloudflare Images dashboard.
const CF_HASH = import.meta.env.PUBLIC_CF_IMAGES_HASH as string | undefined;

export const IMG_WIDTHS = [480, 800, 1200, 1600];

export function isImagePath(src: string): boolean {
  return src.startsWith('/') || src.startsWith('http');
}

export function imageUrl(src: string, width = 1200): string {
  if (isImagePath(src) || !CF_HASH) return src;
  return `https://imagedelivery.net/${CF_HASH}/${src}/w=${width},f=auto`;
}

export function imageSrcset(src: string, widths = IMG_WIDTHS): string | undefined {
  if (isImagePath(src) || !CF_HASH) return undefined;
  return widths.map(w => `${imageUrl(src, w)} ${w}w`).join(', ');
}
