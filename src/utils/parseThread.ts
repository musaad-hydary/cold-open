export interface EpisodeInfo {
  type: "episode";
  title: string;
  season: number;
  episode: number;
}

export interface SeasonInfo {
  type: "season";
  title: string;
  season: number;
}

export interface MovieInfo {
  type: "movie";
  title: string;
  year?: string;
}

export type ThreadInfo = EpisodeInfo | SeasonInfo | MovieInfo;

function cleanTitle(t: string): string {
  return t
    .trim()
    .replace(/^[[(](.+?)[)\]]\s*/, "$1")
    .replace(/[-–—]+$/, "")
    .replace(
      /\s*(series|season|episode|finale|premiere|discussion|thread|post)\b.*/i,
      "",
    )
    .trim();
}

function subredditAsTitle(text: string): string {
  const m = text.match(/r\/(\w+)\s*$/);
  if (!m) return "";
  return m[1]
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/^(.)/, (c) => c.toUpperCase())
    .trim();
}

const GENERIC = /^(episode|ep|discussion|episode discussion)$/i;

export function parseThreadTitle(text: string): ThreadInfo | null {
  const cleaned = text.replace(/\s*:\s*r\/\w+\s*$/, "").trim();

  // S01E01 or S01xE01
  const seMatch = cleaned.match(/[Ss](\d{1,2})[Xx]?[Ee](\d{1,2})/);
  if (seMatch && seMatch.index !== undefined) {
    const before = cleaned.slice(0, seMatch.index).trim();
    const s = parseInt(seMatch[1]);
    const e = parseInt(seMatch[2]);
    let title = before ? cleanTitle(before) : "";
    if (!title || GENERIC.test(title)) title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: s, episode: e };
  }

  // 2x01 format
  const nxMatch = cleaned.match(/(\d{1,2})[Xx](\d{1,2})/);
  if (nxMatch && nxMatch.index !== undefined) {
    const before = cleaned.slice(0, nxMatch.index).trim();
    const s = parseInt(nxMatch[1]);
    const e = parseInt(nxMatch[2]);
    let title = cleanTitle(before);
    if (!title || GENERIC.test(title)) title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: s, episode: e };
  }

  // "eps1.0" or "1.0" format (Mr Robot S1-S3) — permissive, underscore after ok
  const dotMatch =
    cleaned.match(/\beps?(\d+)\.(\d+)/i) ||
    cleaned.match(/\b(\d)\.(\d{1,2})\b/);
  if (dotMatch) {
    const s = parseInt(dotMatch[1]);
    const e = parseInt(dotMatch[2]);
    const title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: s, episode: e };
  }

  // "403" compact format (Mr Robot S4)
  const compactMatch = cleaned.match(/\b([1-9])(\d{2})\b/);
  if (compactMatch) {
    const s = parseInt(compactMatch[1]);
    const e = parseInt(compactMatch[2]);
    const title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: s, episode: e };
  }

  // "Act X, Ep Y" format
  const actEpMatch = cleaned.match(
    /[Aa]ct\s*(\d+),?\s*[Ee]p(?:isode)?\s*(\d+)/,
  );
  if (actEpMatch) {
    const s = parseInt(actEpMatch[1]);
    const e = parseInt(actEpMatch[2]);
    const title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: s, episode: e };
  }

  // "Ep X" with no season (treat as S01)
  const epOnlyMatch = cleaned.match(/\bEp(?:isode)?\s*(\d+)\b/i);
  if (epOnlyMatch) {
    const e = parseInt(epOnlyMatch[1]);
    const title = subredditAsTitle(text);
    if (title) return { type: "episode", title, season: 1, episode: e };
  }

  // [Show] with no S/E code — skip AFTER all episode checks
  if (cleaned.match(/^\[(.+?)\]/)) return null;

  // Season discussion
  const seasonMatch =
    cleaned.match(/(.+?)\s*[-–—]?\s*[Ss]eason\s*(\d{1,2})/i) ||
    cleaned.match(
      /(.+?)\s*[-–—]?\s*[Ss]\s*(\d{1,2})\s*(overall|discussion|hub)/i,
    ) ||
    cleaned.match(/(.+?)\s*(\d{1,2})(?:st|nd|rd|th)?\s*[Ss]eason/i);

  if (seasonMatch) {
    const title = seasonMatch[1]
      .trim()
      .replace(/[-–—]+$/, "")
      .replace(
        /\s*(series|episode|finale|premiere|discussion|thread|post|hub|overall).*/i,
        "",
      )
      .trim();
    return { type: "season", title, season: parseInt(seasonMatch[2]) };
  }

  // Movie
  const yearMatch = cleaned.match(/\((\d{4})\)/);
  const movieKeywords =
    /\b(film discussion|movie discussion|movie thread|film thread|official discussion|dreadit)\b/i;
  const onMoviesSub = text.match(/r\/(movies|horror|truefilm|criterion)\b/i);
  const notTV = !cleaned.match(/\b(episode|season|series|S\d{2}E\d{2})\b/i);

  if (notTV && (movieKeywords.test(cleaned) || yearMatch || onMoviesSub)) {
    const title = cleaned
      .replace(
        /\s*[-–—]\s*(film|movie|discussion|spoiler|thread|review|spoilers).*/i,
        "",
      )
      .replace(/\s*\[.*?\]\s*/g, "")
      .replace(/\s*\(\d{4}\).*$/, "")
      .replace(/^(official\s+)?(dreadit\s+)?discussion\s*[-–—:]\s*/i, "")
      .trim();
    const year = yearMatch ? yearMatch[1] : undefined;
    if (title.length > 2) return { type: "movie", title, year };
  }

  return null;
}
