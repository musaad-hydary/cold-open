import React from "react";
import ReactDOM from "react-dom/client";
import { searchReddit } from "./utils/reddit";
import { RedditCard } from "./components/RedditCard";

console.log("[Cold Open] IMDB content script running", document.title);

const STORAGE_KEY = "co_imdb_dismissed";

function isLightMode(): boolean {
  const bg = window.getComputedStyle(document.documentElement).backgroundColor;
  if (bg) {
    const match = bg.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      return (r * 299 + g * 587 + b * 114) / 1000 > 128;
    }
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getPageTitle(): string {
  const og = document.querySelector(
    'meta[property="og:title"]',
  ) as HTMLMetaElement;
  const raw = og?.content || document.title;
  return raw
    .replace(/⭐.*$/, "")
    .replace(/\s*\(TV Episode.*?\)/i, "")
    .replace(/\s*\(TV Series.*?\)/i, "")
    .replace(/\s*\(\d{4}.*?\)/, "")
    .replace(/\s+[-–|]\s+IMDb\s*$/i, "")
    .replace(/\s+[-–|]\s+TV.*$/i, "")
    .replace(/["""'']/g, "")
    .replace(/\s+eps?\d+\.\d+.*$/i, "")
    .replace(/\s+S\d+\.E\d+.*$/i, "")
    .trim();
}

function buildQuery(): string {
  const title = getPageTitle();

  const epMatch = document.title.match(/S(\d+)\.E(\d+)/);
  if (epMatch) {
    return `${title} S${epMatch[1]}E${epMatch[2]} discussion`;
  }

  const seasonParam = new URLSearchParams(window.location.search).get("season");
  if (seasonParam) {
    return `${title} season ${seasonParam} discussion`;
  }

  return `${title} discussion`;
}

function findInsertTarget(): Element | null {
  const selectors = [
    '[data-testid="above-the-fold-summary"]',
    '[data-testid="hero-title-block__title"]',
    '[data-testid="hero-title-block"]',
    ".sc-afe43def",
    '[class*="TitleBlock"]',
    '[class*="TitleHeader"]',
    "h1",
    "main",
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function waitForTarget(callback: (el: Element) => void) {
  const el = findInsertTarget();
  if (el) {
    callback(el);
    return;
  }
  const observer = new MutationObserver(() => {
    const found = findInsertTarget();
    if (found) {
      observer.disconnect();
      callback(found);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function mount(node: React.ReactNode, target: Element, key: string) {
  const dismissedRaw = sessionStorage.getItem(STORAGE_KEY);
  const dismissed: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
  if (dismissed.includes(key)) return;

  const host = document.createElement("div");
  host.id = "cold-open-reddit-root";
  const shadow = host.attachShadow({ mode: "open" });

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap";
  shadow.appendChild(fontLink);

  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  function dismiss() {
    const d: string[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    d.push(key);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    host.remove();
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") dismiss();
    },
    { once: true },
  );

  target.parentElement?.insertBefore(host, target);
  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>{node}</React.StrictMode>,
  );

  return dismiss;
}

async function init() {
  const path = window.location.pathname;

  const isOnEpisodesListPage =
    path.includes("/episodes") && !document.title.match(/S\d+\.E\d+/);
  if (isOnEpisodesListPage) {
    console.log("[Cold Open] skipping episode list page");
    return;
  }

  const title = getPageTitle();

  if (/^(episode list|full cast|trivia|reviews|awards|faq)$/i.test(title)) {
    console.log("[Cold Open] skipping non-title page:", title);
    return;
  }

  const query = buildQuery();
  const key = `imdb_${window.location.pathname}`;
  const light = isLightMode();

  console.log("[Cold Open] title:", title);
  console.log("[Cold Open] query:", query);

  const threads = await searchReddit(query, title);
  console.log("[Cold Open] found threads:", threads.length, threads);

  const threadData = threads;
  waitForTarget((target) => {
    const dismiss = mount(
      <RedditCard
        threads={threadData}
        title={title}
        onDismiss={() => dismiss?.()}
        light={light}
      />,
      target,
      key,
    );
  });
}

setTimeout(init, 1200);
