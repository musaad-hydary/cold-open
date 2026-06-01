export interface RedditThread {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  numComments: number;
  permalink: string;
  createdUtc: number;
}

const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

interface CacheEntry {
  data: RedditThread[];
  ts: number;
}

async function getCachedThreads(key: string): Promise<RedditThread[] | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as CacheEntry | undefined;
      if (!entry) return resolve(null);
      if (Date.now() - entry.ts > CACHE_TTL) return resolve(null);
      resolve(entry.data);
    });
  });
}

async function cacheThreads(key: string, data: RedditThread[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: { data, ts: Date.now() } }, resolve);
  });
}

export async function searchReddit(
  query: string,
  title: string,
): Promise<RedditThread[]> {
  const cacheKey = `reddit_${query}`;
  const cached = await getCachedThreads(cacheKey);
  if (cached) {
    console.log("[Cold Open] Reddit cache hit:", cacheKey);
    return cached;
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "SEARCH_REDDIT", query, title },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.log("[Cold Open] message error:", chrome.runtime.lastError);
          resolve([]);
          return;
        }
        const threads: RedditThread[] = response?.threads ?? [];
        await cacheThreads(cacheKey, threads);
        resolve(threads);
      },
    );
  });
}
