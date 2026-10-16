const UNIT_DAYS: Record<string, number> = {
  second: 1 / 86400,
  sec: 1 / 86400,
  minute: 1 / 1440,
  min: 1 / 1440,
  hour: 1 / 24,
  hr: 1 / 24,
  day: 1,
  week: 7,
  wk: 7,
  month: 30,
  mo: 30,
  year: 365,
  yr: 365,
};

// English only. Accepts a leading word such as "Streamed" or "Premiered".
const RELATIVE =
  /(?:^|\s)(\d+)\s+(second|sec|minute|min|hour|hr|day|week|wk|month|mo|year|yr)s?\s+ago$/;

export function parseAgeDays(text: string): number | null {
  const match = RELATIVE.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * UNIT_DAYS[match[2]];
}
