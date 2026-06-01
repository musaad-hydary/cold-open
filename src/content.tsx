import React from "react";
import ReactDOM from "react-dom/client";
import { parseThreadTitle } from "./utils/parseThread";
import { fetchEpisode, fetchSeason, fetchShow, fetchMovie } from "./utils/omdb";
import { ImdbCard } from "./components/IMDBCard";
import { SeasonCard } from "./components/SeasonCard";
import { MovieCard } from "./components/MovieCard";

const STORAGE_KEY = "tl_dismissed";

export function isLightMode(): boolean {
  const html = document.documentElement;
  if (html.getAttribute("data-theme") === "light") return true;
  if (html.getAttribute("data-theme") === "dark") return false;
  if (document.body.classList.contains("res-nightmode")) return false;
  if (document.body.classList.contains("night")) return false;

  const htmlBg = window.getComputedStyle(html).backgroundColor;
  if (htmlBg) {
    const match = htmlBg.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      const luminance = (r * 299 + g * 587 + b * 114) / 1000;
      return luminance > 128;
    }
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function findInsertTarget(): Element | null {
  const selectors = [
    "shreddit-post",
    "[data-testid='post-container']",
    "[data-click-id='body']",
    ".Post",
    ".thing.link",
    "#siteTable .link",
    "article",
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
  host.id = "thread-lens-root";
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
  const title = document.title;
  const parsed = parseThreadTitle(title);
  if (!parsed) {
    console.log("[Cold Open] no match in title:", title);
    return;
  }

  const light = isLightMode();

  if (parsed.type === "episode") {
    const [data, show] = await Promise.all([
      fetchEpisode(parsed.title, parsed.season, parsed.episode),
      fetchShow(parsed.title),
    ]);
    if (!data) {
      console.log("[Cold Open] no OMDB data");
      return;
    }
    const key = `${parsed.title}-S${parsed.season}E${parsed.episode}`;
    const episodeData = data;
    const showData = show;
    const posterUrl =
      show?.Poster && show.Poster !== "N/A" ? show.Poster : null;
    waitForTarget((target) => {
      const dismiss = mount(
        <ImdbCard
          data={episodeData}
          onDismiss={() => dismiss?.()}
          light={light}
          poster={posterUrl}
          show={showData}
        />,
        target,
        key,
      );
    });
  }

  if (parsed.type === "season") {
    const [data, show] = await Promise.all([
      fetchSeason(parsed.title, parsed.season),
      fetchShow(parsed.title),
    ]);
    if (!data) {
      console.log("[Cold Open] no season data");
      return;
    }
    const key = `${parsed.title}-S${parsed.season}`;
    const seasonData = data;
    const showData = show;
    const posterUrl =
      show?.Poster && show.Poster !== "N/A" ? show.Poster : null;
    waitForTarget((target) => {
      const dismiss = mount(
        <SeasonCard
          data={seasonData}
          onDismiss={() => dismiss?.()}
          light={light}
          poster={posterUrl}
          show={showData}
        />,
        target,
        key,
      );
    });
  }

  if (parsed.type === "movie") {
    const data = await fetchMovie(parsed.title, parsed.year);
    if (!data) {
      console.log("[Cold Open] no movie data");
      return;
    }
    const key = `movie_${parsed.title}_${parsed.year || ""}`;
    const movieData = data;
    waitForTarget((target) => {
      const dismiss = mount(
        <MovieCard
          data={movieData}
          onDismiss={() => dismiss?.()}
          light={light}
        />,
        target,
        key,
      );
    });
  }
}

init();
