#!/usr/bin/env node
// cf-upload.mjs — upload stills to Cloudflare Images and print ready-to-paste
// gallery rows (with real pixel dimensions) for src/content/galleries/*.json
// or a hero frontmatter snippet.
//
// Usage:
//   pnpm cf-upload photo1.jpg photo2.jpg
//
// Requires in .env (gitignored, never commit):
//   CLOUDFLARE_ACCOUNT_ID     Cloudflare dashboard, right sidebar
//   CLOUDFLARE_IMAGES_TOKEN   API token with the Cloudflare Images:Edit permission
//
// These are secrets used only by this script. The site itself only needs the
// public delivery hash (PUBLIC_CF_IMAGES_HASH).

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

// Merge .env into the environment without overriding real env vars.
const envFile = resolve('.env');
if (existsSync(envFile)) {
	for (const line of readFileSync(envFile, 'utf8').split('\n')) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_IMAGES_TOKEN: token } = process.env;
const files = process.argv.slice(2);

function die(msg) {
	console.error(`error: ${msg}`);
	process.exit(1);
}

if (!files.length) die('no files given. usage: pnpm cf-upload <image> [image...]');
if (!accountId || !token) die('set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_TOKEN in .env');

const MIME = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.avif': 'image/avif',
};

// Pixel dimensions via macOS sips (no dependency to install).
function dimensions(file) {
	try {
		const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], {
			encoding: 'utf8',
		});
		const w = out.match(/pixelWidth:\s*(\d+)/);
		const h = out.match(/pixelHeight:\s*(\d+)/);
		if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
	} catch {
		// fall through to die below
	}
	die(`could not read dimensions of ${file} (sips failed)`);
}

let printed = 0;
for (const file of files) {
	const ext = extname(file).toLowerCase();
	const type = MIME[ext];
	if (!type) {
		console.error(`skip ${file}: unsupported type "${ext}"`);
		continue;
	}
	if (!existsSync(file)) {
		console.error(`skip ${file}: not found`);
		continue;
	}

	const { width, height } = dimensions(file);
	const body = new FormData();
	body.append('file', new Blob([readFileSync(file)], { type }), basename(file));

	const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body,
	});
	const json = await res.json();
	if (!json.success) {
		console.error(`upload failed for ${file}:`, JSON.stringify(json.errors));
		continue;
	}

	if (printed++ > 0) console.log(',');
	console.log(JSON.stringify({ src: json.result.id, alt: '', caption: '', width, height }, null, 2));
}

if (printed) {
	console.error(`\n${printed} image(s) uploaded. Paste the row(s) into the gallery's images list,`);
	console.error('then fill in alt and caption. For a hero, use just the src value.');
}
