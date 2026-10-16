import { describe, expect, it } from 'vitest';
import browseFixture from '../fixtures/home-browse.json';
import initialFixture from '../fixtures/home-initial.json';
import { filterFeed, isHomeResponse, normalise } from '../src/feed';
import { maxAge } from '../src/filters/age';
import type { FeedItem } from '../src/types';

type Json = Record<string, any>;

const browse = (): Json => structuredClone(browseFixture as Json);
const initial = (): Json => structuredClone(initialFixture as Json);

const browseItems = (d: Json): Json[] =>
  d.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;
const initialItems = (d: Json): Json[] =>
  d.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents;

const videos = (items: Json[]): FeedItem[] =>
  items.map(normalise).filter((v): v is FeedItem => v !== null);
const countKey = (items: Json[], key: string) => items.filter((i) => key in i).length;

describe('normalise', () => {
  it('reads every lockup video in the continuation fixture', () => {
    const items = videos(browseItems(browse()));
    expect(items).toHaveLength(6);
    for (const item of items) {
      expect(item.videoId).toMatch(/^[\w-]{11}$/);
      expect(item.title).not.toBe('');
      expect(item.channel).not.toBe('');
      expect(item.publishedText).toMatch(/ ago$/);
      expect(item.ageDays).not.toBeNull();
    }
  });

  it('maps fields from lockupViewModel', () => {
    const [first] = videos(browseItems(browse()));
    expect(first).toEqual({
      videoId: 'brws0000001',
      title: 'brws video 1',
      channel: 'Channel 1',
      publishedText: '4 hours ago',
      ageDays: 4 / 24,
    });
  });

  it('skips ads, shelves and the continuation in the initial fixture', () => {
    const items = initialItems(initial());
    expect(videos(items)).toHaveLength(7);
    for (const i of items) {
      if (!('richItemRenderer' in i) || 'adSlotRenderer' in i.richItemRenderer.content) {
        expect(normalise(i)).toBeNull();
      }
    }
  });

  it('finds the date when the channel spans two parts', () => {
    const item = videos(browseItems(browse())).find((v) => v.videoId === 'brws0000006');
    expect(item?.channel).toBe('Channel 6');
    expect(item?.ageDays).toBe(6);
  });
});

describe('filterFeed with maxAge(180)', () => {
  it('removes only old videos from a continuation', () => {
    const data = browse();
    const result = filterFeed(data, [maxAge(180)]);
    const items = browseItems(data);

    expect(result).toEqual({ removed: 1, total: 6 });
    for (const id of ['brws0000002']) {
      expect(videos(items).some((v) => v.videoId === id)).toBe(false);
    }
    for (const v of videos(items)) expect(v.ageDays).toBeLessThanOrEqual(180);
  });

  it('keeps the continuation item last in a continuation', () => {
    const data = browse();
    filterFeed(data, [maxAge(180)]);
    const items = browseItems(data);
    expect(countKey(items, 'continuationItemRenderer')).toBe(1);
    expect(items.at(-1)).toHaveProperty('continuationItemRenderer');
  });

  it('removes only old videos from initial data and leaves everything else', () => {
    const data = initial();
    const before = initialItems(data).slice();
    const result = filterFeed(data, [maxAge(180)]);
    const items = initialItems(data);

    expect(result).toEqual({ removed: 2, total: 7 });
    expect(items).toHaveLength(before.length - 2);
    expect(countKey(items, 'continuationItemRenderer')).toBe(1);
    expect(items.at(-1)).toHaveProperty('continuationItemRenderer');
    expect(countKey(items, 'richSectionRenderer')).toBe(1);
    expect(items.filter((i) => i.richItemRenderer?.content.adSlotRenderer)).toHaveLength(1);
    for (const id of ['init0000002', 'init0000007']) {
      expect(videos(items).some((v) => v.videoId === id)).toBe(false);
    }
  });

  it('removes nothing with no predicates', () => {
    const data = initial();
    expect(filterFeed(data, [])).toEqual({ removed: 0, total: 7 });
    expect(data).toEqual(initialFixture);
  });

  it('keeps items whose age cannot be parsed', () => {
    const data = browse();
    const part =
      browseItems(data)[1].richItemRenderer.content.lockupViewModel.metadata.lockupMetadataViewModel
        .metadata.contentMetadataViewModel.metadataRows[0].metadataParts[2];
    part.text.content = 'LIVE';
    delete part.accessibilityLabel;
    expect(filterFeed(data, [maxAge(180)])).toEqual({ removed: 0, total: 6 });
  });
});

describe('isHomeResponse', () => {
  it('is true for both home fixtures', () => {
    expect(isHomeResponse(browse())).toBe(true);
    expect(isHomeResponse(initial())).toBe(true);
  });

  it('is false for another browse id or missing context', () => {
    const data = browse();
    for (const s of data.responseContext.serviceTrackingParams) {
      for (const p of s.params) if (p.key === 'browse_id') p.value = 'FEsubscriptions';
    }
    expect(isHomeResponse(data)).toBe(false);
    expect(isHomeResponse({})).toBe(false);
    expect(isHomeResponse(null)).toBe(false);
  });
});
