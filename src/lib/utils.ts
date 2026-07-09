export const TYPE_LABEL: Record<string, string> = {
  essay: 'Essay',
  note: 'Note',
  'photo-essay': 'Photo-essay',
};

// Frontmatter dates parse as UTC midnight; format in UTC so they don't
// shift a day backward in Mountain Time.
const MONTH_LONG = new Intl.DateTimeFormat('en-CA', { month: 'long', timeZone: 'UTC' });

interface GroupedEntries<T> {
  label: string;
  entries: T[];
}

export function groupEntriesByMonth<T extends { data: { publishedAt: Date } }>(entries: T[]): GroupedEntries<T>[] {
  const groups: GroupedEntries<T>[] = [];
  let current: GroupedEntries<T> | null = null;

  for (const entry of entries) {
    const d = entry.data.publishedAt;
    const label = `${MONTH_LONG.format(d)} ${d.getUTCFullYear()}`;
    if (!current || current.label !== label) {
      current = { label, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
}

export function formatDate(date: Date): string {
  // en-CA abbreviates months with a trailing period; the meta strings want a bare "May", "Jun".
  return `${date.getUTCDate()} ${MONTH_LONG.format(date).slice(0, 3)} ${date.getUTCFullYear()}`;
}

export function readingTime(body: string): number {
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
