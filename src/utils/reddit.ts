export interface RedditThread {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  numComments: number;
  permalink: string;
}

export async function searchReddit(
  query: string,
  title: string,
): Promise<RedditThread[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "SEARCH_REDDIT", query, title },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log("[Cold Open] message error:", chrome.runtime.lastError);
          resolve([]);
          return;
        }
        resolve(response?.threads ?? []);
      },
    );
  });
}
