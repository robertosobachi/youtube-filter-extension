import { filterFeed, isHomeResponse } from './feed';
import { maxAge } from './filters/age';
import { interceptFetch, interceptInitialData } from './intercept';
import { PAGE_KEY, parseMaxAgeDays } from './settings';
import type { Predicate } from './types';

// Read on every response, so a setting changed in the popup applies to the next continuation.
function currentFilters(): Predicate[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PAGE_KEY);
  } catch {}
  const days = parseMaxAgeDays(raw);
  return days > 0 ? [maxAge(days)] : [];
}

function transform(data: unknown): boolean {
  if (!isHomeResponse(data)) return false;
  const { removed, total } = filterFeed(data, currentFilters());
  console.debug(`[yt-age] removed ${removed}/${total}`);
  return removed > 0;
}

interceptInitialData(transform);
interceptFetch(transform);
