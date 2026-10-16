import { describe, expect, it } from 'vitest';
import { parseAgeDays } from '../src/time';

describe('parseAgeDays', () => {
  it.each([
    ['3 weeks ago', 21],
    ['1 year ago', 365],
    ['Streamed 2 days ago', 2],
    ['Premiered 3 weeks ago', 21],
    ['6 months ago', 180],
    ['7 months ago', 210],
    ['1 day ago', 1],
  ])('parses full form %j', (text, days) => {
    expect(parseAgeDays(text)).toBe(days);
  });

  it.each([
    ['3 wk ago', 21],
    ['1 mo ago', 30],
    ['10 yr ago', 3650],
    ['13 days ago', 13],
    ['Streamed 2 yr ago', 730],
  ])('parses abbreviated form %j', (text, days) => {
    expect(parseAgeDays(text)).toBe(days);
  });

  it.each([
    '1 hour ago',
    '4 hr ago',
    '45 minutes ago',
    '5 min ago',
    '30 seconds ago',
    '10 sec ago',
  ])('parses sub-day %j as less than one day', (text) => {
    const days = parseAgeDays(text);
    expect(days).not.toBeNull();
    expect(days).toBeLessThan(1);
  });

  it.each(['', 'LIVE', '7.5k', '1.5 thousand views', 'Scheduled for 10/20/26', '3 週間前', 'ago'])(
    'returns null for %j',
    (text) => {
      expect(parseAgeDays(text)).toBeNull();
    },
  );
});
