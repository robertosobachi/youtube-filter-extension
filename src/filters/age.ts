import type { Predicate } from '../types';

/** Keeps items up to `days` old. Items with an unknown age are kept. */
export const maxAge =
  (days: number): Predicate =>
  (item) =>
    item.ageDays === null || item.ageDays <= days;
