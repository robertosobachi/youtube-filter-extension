/** Key in chrome.storage.local, written by the popup. */
export const STORAGE_KEY = 'maxAgeDays';

/** Key in youtube.com localStorage, mirrored by the bridge so the MAIN world can read it synchronously. */
export const PAGE_KEY = 'yt-age:maxAgeDays';

export const DEFAULT_MAX_AGE_DAYS = 180;

/** 0 means off. Steps follow YouTube's rounded dates, so finer values would behave the same. */
export const OPTIONS: { label: string; days: number }[] = [
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: '2 years', days: 730 },
  { label: 'Off', days: 0 },
];

export function parseMaxAgeDays(raw: unknown): number {
  if (raw === '' || raw === null || raw === undefined) return DEFAULT_MAX_AGE_DAYS;
  const days = Number(raw);
  return Number.isFinite(days) && days >= 0 ? days : DEFAULT_MAX_AGE_DAYS;
}
