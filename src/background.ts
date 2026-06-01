export {};

interface RedditPost {
  data: {
    title: string;
    permalink: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_utc: number;
  };
}

interface RedditThread {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  numComments: number;
  permalink: string;
  createdUtc: number;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Cold Open installed");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SEARCH_REDDIT") {
    const { query, title } = message as { query: string; title: string };
    const encoded = encodeURIComponent(query);
    const url = `https://www.reddit.com/search.json?q=${encoded}&sort=relevance&limit=25&type=link&t=all`;

    fetch(url, { headers: { "User-Agent": "ColdOpen/0.1" } })
      .then((r) => r.json())
      .then((data: { data?: { children?: RedditPost[] } }) => {
        const posts: RedditPost[] = data?.data?.children ?? [];
        const titleWords = title
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 2);

        const threads: RedditThread[] = posts
          .map((p) => ({
            title: p.data.title,
            url: `https://www.reddit.com${p.data.permalink}`,
            subreddit: p.data.subreddit,
            score: p.data.score,
            numComments: p.data.num_comments,
            permalink: p.data.permalink,
            createdUtc: p.data.created_utc,
          }))
          .filter((p) => {
            const postTitleLower = p.title.toLowerCase();
            const hasDiscussion =
              /discuss|episode|spoiler|reaction|finale|premiere|review/i.test(
                p.title,
              );
            const titleWordMatches = titleWords.filter((w: string) =>
              postTitleLower.includes(w),
            ).length;
            const matchesTitleWords = titleWordMatches >= titleWords.length;
            return hasDiscussion && matchesTitleWords;
          })
          .sort((a, b) => b.numComments - a.numComments);

        sendResponse({ threads });
      })
      .catch((e: Error) => {
        console.log("[Cold Open] Reddit fetch error:", e);
        sendResponse({ threads: [] });
      });
    return true;
  }
});
