// The slice of the extension API this project uses, to avoid a @types/chrome dependency.
declare namespace chrome.storage {
  interface StorageChange {
    oldValue?: unknown;
    newValue?: unknown;
  }
  const local: {
    get(key: string): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
  };
  const onChanged: {
    addListener(callback: (changes: Record<string, StorageChange>, areaName: string) => void): void;
  };
}
