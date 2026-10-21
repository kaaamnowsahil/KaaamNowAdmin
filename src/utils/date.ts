const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Mock timestamps are relative to load time so the demo never looks stale. */
export const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * MINUTE).toISOString();

export const hoursAgo = (hours: number) => minutesAgo(hours * 60);

export const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

/** Local YYYY-MM-DD, offset by whole days from today. */
export const localDate = (offsetDays = 0) => {
  const date = new Date(Date.now() + offsetDays * DAY);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

/** "2026-10-20" → "Tue, 20 Oct" */
export const formatDay = (value: string, locale: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1));
};

/** ISO → "20 Oct 2026" */
export const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

/** ISO → "20 Oct, 14:05" */
export const formatDateTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

/** ISO → "5 min ago" / "in 2 hours" */
export const formatRelative = (iso: string, locale: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < HOUR) {
    return rtf.format(Math.round(diff / MINUTE), 'minute');
  }
  if (abs < DAY) {
    return rtf.format(Math.round(diff / HOUR), 'hour');
  }
  return rtf.format(Math.round(diff / DAY), 'day');
};

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / MINUTE));

export const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();
