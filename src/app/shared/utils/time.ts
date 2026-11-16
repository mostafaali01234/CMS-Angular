// shared/utils/time.ts
const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' });

/** The backend sends UTC. Make sure the browser reads it as UTC even if the "Z" is missing. */
export function parseUtc(s: string): Date {
  return new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(s) ? s : s + 'Z');
}

/** "الآن", "قبل 5 دقائق", "أمس" ... older than a month: the date. */
export function timeAgo(s: string | null | undefined): string {
  if (!s) return '';
  const date = parseUtc(s);
  const diff = (date.getTime() - Date.now()) / 1000;   // negative = in the past
  const abs = Math.abs(diff);
  if (abs < 45) return 'الآن';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return date.toLocaleDateString('ar-EG-u-nu-latn');
}
