import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_AGE_DAYS, OPTIONS, parseMaxAgeDays } from '../src/settings';

describe('parseMaxAgeDays', () => {
  it('defaults to 180 days', () => {
    expect(DEFAULT_MAX_AGE_DAYS).toBe(180);
  });

  it.each([undefined, null, '', 'abc', -5, NaN, '1e999'])('falls back to default for %j', (raw) => {
    expect(parseMaxAgeDays(raw)).toBe(DEFAULT_MAX_AGE_DAYS);
  });

  it.each([
    [30, 30],
    ['365', 365],
    [0, 0],
    ['0', 0],
  ])('reads %j as %j', (raw, days) => {
    expect(parseMaxAgeDays(raw)).toBe(days);
  });

  it('offers the default and an off option', () => {
    expect(OPTIONS.map((o) => o.days)).toContain(DEFAULT_MAX_AGE_DAYS);
    expect(OPTIONS.map((o) => o.days)).toContain(0);
  });
});
