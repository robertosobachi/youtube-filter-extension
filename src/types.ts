export type FeedItem = {
  videoId: string;
  title: string;
  channel: string;
  publishedText: string;
  ageDays: number | null;
};

/** Returns true to keep the item. */
export type Predicate = (item: FeedItem) => boolean;
