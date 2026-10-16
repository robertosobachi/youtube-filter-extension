import { parseAgeDays } from './time';
import type { FeedItem, Predicate } from './types';

type Json = Record<string, any>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null;

/**
 * Normalises a feed array element. Only `richItemRenderer.content.lockupViewModel` videos
 * qualify; ads, shelves, continuations and anything unrecognised return null.
 */
export function normalise(node: unknown): FeedItem | null {
  if (!isObject(node)) return null;
  const lockup = node.richItemRenderer?.content?.lockupViewModel;
  if (!isObject(lockup) || lockup.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') return null;

  const meta = lockup.metadata?.lockupMetadataViewModel;
  const rows: unknown = meta?.metadata?.contentMetadataViewModel?.metadataRows;
  const parts: Json[] = Array.isArray(rows)
    ? rows.flatMap((r) => (isObject(r) && Array.isArray(r.metadataParts) ? r.metadataParts : []))
    : [];

  // Visible text is abbreviated ("4 hr ago"); the accessibility label has the full form.
  let publishedText = '';
  let ageDays: number | null = null;
  for (const part of parts) {
    for (const text of [part?.accessibilityLabel, part?.text?.content]) {
      if (typeof text !== 'string') continue;
      const days = parseAgeDays(text);
      if (days !== null) {
        publishedText = text;
        ageDays = days;
        break;
      }
    }
    if (ageDays !== null) break;
  }

  return {
    videoId: String(lockup.contentId ?? ''),
    title: String(meta?.title?.content ?? ''),
    channel: String(parts[0]?.text?.content ?? ''),
    publishedText,
    ageDays,
  };
}

/**
 * Removes, in place, every array element that normalises to a video failing a predicate.
 * Non-video elements (including continuationItemRenderer) are never removed.
 */
export function filterFeed(
  data: unknown,
  predicates: Predicate[],
): { removed: number; total: number } {
  let removed = 0;
  let total = 0;

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      let write = 0;
      for (const el of node) {
        const item = normalise(el);
        if (item) {
          total++;
          if (!predicates.every((keep) => keep(item))) {
            removed++;
            continue;
          }
        } else {
          walk(el);
        }
        node[write++] = el;
      }
      node.length = write;
    } else if (isObject(node)) {
      for (const key in node) walk(node[key]);
    }
  };

  walk(data);
  return { removed, total };
}

/** True when the response is the home feed (first page, SPA navigation or continuation). */
export function isHomeResponse(data: unknown): boolean {
  const services: unknown = isObject(data) ? data.responseContext?.serviceTrackingParams : null;
  if (!Array.isArray(services)) return false;
  return services.some(
    (s) =>
      Array.isArray(s?.params) &&
      s.params.some((p: Json) => p?.key === 'browse_id' && p?.value === 'FEwhat_to_watch'),
  );
}
