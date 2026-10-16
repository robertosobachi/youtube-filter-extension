import { OPTIONS, STORAGE_KEY, parseMaxAgeDays } from './settings';

async function init(): Promise<void> {
  const select = document.querySelector<HTMLSelectElement>('#max-age')!;
  const status = document.querySelector<HTMLElement>('#status')!;

  for (const { label, days } of OPTIONS) select.add(new Option(label, String(days)));

  const items = await chrome.storage.local.get(STORAGE_KEY);
  select.value = String(parseMaxAgeDays(items[STORAGE_KEY]));

  select.addEventListener('change', async () => {
    await chrome.storage.local.set({ [STORAGE_KEY]: Number(select.value) });
    status.textContent = 'Saved. Reload YouTube to refilter videos already shown.';
  });
}

init();
