/** Mutates InnerTube JSON in place. Returns true if anything changed. */
export type Transform = (data: unknown) => boolean;

const BROWSE_PATH = '/youtubei/v1/browse';

/** First load: YouTube assigns `ytInitialData` in an inline script, so trap the assignment. */
export function interceptInitialData(transform: Transform): void {
  let value: unknown;
  try {
    Object.defineProperty(window, 'ytInitialData', {
      configurable: true,
      enumerable: true,
      get: () => value,
      set: (next: unknown) => {
        try {
          transform(next);
        } catch (err) {
          console.warn('[yt-age] ytInitialData transform failed', err);
        }
        value = next;
      },
    });
  } catch (err) {
    console.warn('[yt-age] could not trap ytInitialData', err);
  }
}

/** Continuations and SPA navigation: rewrite /youtubei/v1/browse responses. */
export function interceptFetch(transform: Transform): void {
  const original = window.fetch;

  window.fetch = async function (this: unknown, input: RequestInfo | URL, init?: RequestInit) {
    const res = await original.call(this, input, init);
    try {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.pathname !== BROWSE_PATH || !res.ok) return res;

      const data: unknown = await res.clone().json();
      if (!transform(data)) return res;

      const rewritten = new Response(JSON.stringify(data), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
      Object.defineProperty(rewritten, 'url', { value: res.url });
      return rewritten;
    } catch (err) {
      console.warn('[yt-age] browse transform failed', err);
      return res;
    }
  };
}
