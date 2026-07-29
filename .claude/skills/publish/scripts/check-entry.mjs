#!/usr/bin/env node
// House-rule checks for journal entries — the rules the zod schema can't see.
// Usage: node check-entry.mjs <entry.mdx> [more.mdx...]
// Exit 1 if any entry has a failure; warnings don't fail the run.

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: check-entry.mjs <entry.mdx> [more.mdx...]');
  process.exit(2);
}

let anyFail = false;

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { fm, body: m[2] };
}

for (const file of files) {
  const fails = [];
  const warns = [];
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(raw);

  if (!parsed) {
    console.log(`${file}\n  FAIL  no frontmatter block found`);
    anyFail = true;
    continue;
  }
  const { fm, body } = parsed;

  // Title length: display scale wraps badly past ~55 chars; target is under 50.
  if (!fm.title) fails.push('missing title');
  else if (fm.title.length > 55) fails.push(`title is ${fm.title.length} chars (wraps badly past 55)`);
  else if (fm.title.length > 50) warns.push(`title is ${fm.title.length} chars (target is under 50)`);

  if (!['essay', 'note', 'photo-essay'].includes(fm.type)) {
    fails.push(`type "${fm.type}" is not essay | note | photo-essay`);
  }

  // Bare YYYY-MM-DD only: times/timezones shift the displayed date in Mountain Time.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.publishedAt || '')) {
    fails.push(`publishedAt "${fm.publishedAt}" must be bare YYYY-MM-DD`);
  }

  // Em dashes are banned in the house style (frontmatter and body alike).
  const emDashLines = raw.split('\n')
    .map((l, i) => (l.includes('—') ? i + 1 : 0))
    .filter(Boolean);
  if (emDashLines.length) fails.push(`em dash on line(s) ${emDashLines.join(', ')}`);

  // Third-person bio taglines are the opposite of the journal's voice.
  if (/Michael Warf is/.test(body)) fails.push('third-person bio tagline in body ("Michael Warf is...")');

  // Exclamation marks in prose (allow inside code fences).
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const bangs = (prose.match(/!(?!\[)/g) || []).length; // ignore image syntax ![
  if (bangs > 0) warns.push(`${bangs} exclamation mark(s) in prose (voice: no exclamation enthusiasm)`);

  // Dropcap needs an opening sentence long enough to wrap around the cap.
  if (fm.type === 'essay' && fm.dropcap !== 'false') {
    const firstPara = prose.trim().split(/\n\s*\n/)[0] || '';
    const firstSentence = firstPara.split(/(?<=[.!?])\s/)[0] || '';
    const words = firstSentence.trim().split(/\s+/).filter(Boolean).length;
    if (words > 0 && words < 10) {
      warns.push(`opening sentence is ${words} words; set dropcap: false (needs ~10+ to wrap the cap)`);
    }
  }

  // Photo essays need a resolvable gallery with complete image rows.
  if (fm.type === 'photo-essay') {
    if (!fm.gallery) {
      fails.push('photo-essay has no gallery field');
    } else {
      const galleryPath = path.join(path.dirname(file), '../galleries', `${fm.gallery}.json`);
      if (!fs.existsSync(galleryPath)) {
        fails.push(`gallery file not found: ${galleryPath}`);
      } else {
        const g = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        (g.images || []).forEach((img, i) => {
          for (const key of ['src', 'alt', 'width', 'height']) {
            if (img[key] === undefined || img[key] === '') fails.push(`gallery image ${i + 1} missing ${key}`);
          }
        });
      }
    }
  }

  const status = fails.length ? 'FAIL' : warns.length ? 'WARN' : 'OK';
  console.log(`${file}  [${status}]`);
  for (const f of fails) console.log(`  FAIL  ${f}`);
  for (const w of warns) console.log(`  warn  ${w}`);
  if (fails.length) anyFail = true;
}

process.exit(anyFail ? 1 : 0);
