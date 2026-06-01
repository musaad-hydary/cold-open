const API_KEY = import.meta.env.VITE_OMDB_KEY;
const CACHE_TTL = 1000 * 60 * 60 * 24;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

async function getCached<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key] as CacheEntry<T> | undefined;
      if (!entry) return resolve(null);
      if (Date.now() - entry.ts > CACHE_TTL) return resolve(null);
      resolve(entry.data);
    });
  });
}

async function setCache(key: string, data: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: { data, ts: Date.now() } }, resolve);
  });
}

export interface OmdbEpisode {
  Title: string;
  Released: string;
  Runtime: string;
  Plot: string;
  Actors: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Response: string;
  Error?: string;
}

export interface OmdbSeasonEpisode {
  Title: string;
  Released: string;
  Episode: string;
  imdbRating: string;
  imdbID: string;
}

export interface OmdbSeason {
  Title: string;
  Season: string;
  Episodes: OmdbSeasonEpisode[];
  Response: string;
  imdbID: string;
}

export interface OmdbShow {
  Title: string;
  Poster: string;
  imdbID: string;
  Response: string;
}

export interface OmdbMovie {
  Title: string;
  Year: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Response: string;
}

export async function fetchShow(title: string): Promise<OmdbShow | null> {
  const key = `show_${title}`;
  const cached = await getCached<OmdbShow>(key);
  if (cached) return cached;

  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&type=series&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data: OmdbShow = await res.json();
    if (data.Response === "False") return null;
    await setCache(key, data);
    return data;
  } catch (e) {
    console.log("[Cold Open] show fetch error:", e);
    return null;
  }
}

export async function fetchEpisode(
  title: string,
  season: number,
  episode: number,
): Promise<OmdbEpisode | null> {
  const key = `ep_${title}_${season}_${episode}`;
  const cached = await getCached<OmdbEpisode>(key);
  if (cached) {
    console.log("[Cold Open] cache hit:", key);
    return cached;
  }

  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&Season=${season}&Episode=${episode}&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data: OmdbEpisode = await res.json();
    if (data.Response === "False") return null;
    await setCache(key, data);
    return data;
  } catch (e) {
    console.log("[Cold Open] fetch error:", e);
    return null;
  }
}

export async function fetchSeason(
  title: string,
  season: number,
): Promise<OmdbSeason | null> {
  const key = `season_${title}_${season}`;
  const cached = await getCached<OmdbSeason>(key);
  if (cached) {
    console.log("[Cold Open] cache hit:", key);
    return cached;
  }

  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&Season=${season}&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data: OmdbSeason = await res.json();
    if (data.Response === "False") return null;
    await setCache(key, data);
    return data;
  } catch (e) {
    console.log("[Cold Open] fetch error:", e);
    return null;
  }
}

export function calcSeasonAvg(episodes: OmdbSeasonEpisode[]): string {
  const rated = episodes
    .map((e) => parseFloat(e.imdbRating))
    .filter((r) => !isNaN(r));
  if (rated.length === 0) return "N/A";
  const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
  return avg.toFixed(1);
}

export async function fetchMovie(
  title: string,
  year?: string,
): Promise<OmdbMovie | null> {
  const key = `movie_${title}_${year || ""}`;
  const cached = await getCached<OmdbMovie>(key);
  if (cached) {
    console.log("[Cold Open] cache hit:", key);
    return cached;
  }

  const yearParam = year ? `&y=${year}` : "";
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&type=movie${yearParam}&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data: OmdbMovie = await res.json();
    if (data.Response === "False") return null;
    await setCache(key, data);
    return data;
  } catch (e) {
    console.log("[Cold Open] fetch error:", e);
    return null;
  }
}
