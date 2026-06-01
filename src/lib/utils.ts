export const TYPE_LABEL: Record<string, string> = {
  essay: 'Essay',
  note: 'Note',
  'photo-essay': 'Photo-essay',
};

export const TONES: Record<string, string> = {
  amber: 'linear-gradient(135deg, #C9B690 0%, #8A6A48 70%, #5C4327 100%)',
  glacier: 'linear-gradient(160deg, #A89E8A 0%, #524A3F 100%)',
  blue: 'linear-gradient(165deg, #5C6E78 0%, #2A3037 100%)',
  cold: 'linear-gradient(160deg, #8FA3AE 0%, #45525A 100%)',
  warm: 'linear-gradient(135deg, #D4B188 0%, #3F5D6B 110%)',
};

interface GroupedEntries<T> {
  label: string;
  entries: T[];
}

export function groupEntriesByMonth<T extends { data: { publishedAt: Date } }>(entries: T[]): GroupedEntries<T>[] {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const groups: GroupedEntries<T>[] = [];
  let current: GroupedEntries<T> | null = null;

  for (const entry of entries) {
    const d = entry.data.publishedAt;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!current || current.label !== label) {
      current = { label, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
}

export function formatDate(date: Date): string {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

export function readingTime(body: string): number {
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
