// ISOLATED world: mirrors the popup setting into youtube.com localStorage for the MAIN-world filter.
import { PAGE_KEY, STORAGE_KEY, parseMaxAgeDays } from './settings';

function mirror(value: unknown): void {
  try {
    localStorage.setItem(PAGE_KEY, String(parseMaxAgeDays(value)));
  } catch (err) {
    console.warn('[yt-age] could not mirror setting', err);
  }
}

chrome.storage.local.get(STORAGE_KEY).then((items) => mirror(items[STORAGE_KEY]));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && STORAGE_KEY in changes) mirror(changes[STORAGE_KEY].newValue);
});
