import React from "react";
import type { OmdbSeason, OmdbShow } from "../utils/omdb";
import { calcSeasonAvg } from "../utils/omdb";

interface Props {
  data: OmdbSeason;
  onDismiss: () => void;
  light?: boolean;
  poster?: string | null;
  show?: OmdbShow | null;
}

const darkColors = {
  bg: "#1a1a1b",
  surface: "#111112",
  border: "#333",
  text: "#d7dadc",
  muted: "#818384",
  accent: "#ff4500",
  accentDim: "#ff450044",
};

const lightColors = {
  bg: "#ffffff",
  surface: "#f6f7f8",
  border: "#edeff1",
  text: "#1c1c1c",
  muted: "#878a8c",
  accent: "#ff4500",
  accentDim: "#ff450033",
};

export function SeasonCard({
  data,
  onDismiss,
  light = false,
  poster,
  show,
}: Props) {
  console.log(
    "[Cold Open] SeasonCard show:",
    show?.imdbID,
    "data:",
    data.imdbID,
  );
  const imdbId = show?.imdbID || data.imdbID;

  const avg = calcSeasonAvg(data.Episodes);
  const rated = data.Episodes.filter(
    (e) => e.imdbRating && e.imdbRating !== "N/A",
  );
  const best = [...rated].sort(
    (a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating),
  )[0];
  const worst = [...rated].sort(
    (a, b) => parseFloat(a.imdbRating) - parseFloat(b.imdbRating),
  )[0];
  const c = light ? lightColors : darkColors;

  const epNameGradient = light
    ? "linear-gradient(135deg, #1c1c1c, #cc3300)"
    : "linear-gradient(135deg, #ffffff, #ffb89a, #ff4500)";

  const ratingGradient = light
    ? "linear-gradient(180deg, #cc3300, #ff4500)"
    : "linear-gradient(180deg, #fff, #ffb89a, #ff4500)";

  return (
    <div
      style={{ ...s.card, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div style={s.sheen} />
      <div style={s.inner}>
        <div style={s.header}>
          <span style={s.imdbBadge}>IMDb</span>
          <span style={{ ...s.tag, color: c.accent, borderColor: c.accentDim }}>
            SEASON {data.Season}
          </span>
          <span style={{ ...s.dismiss, color: c.muted }} onClick={onDismiss}>
            dismiss ×
          </span>
        </div>

        <div style={s.mainGrid}>
          <div>
            <div
              style={{
                ...s.epName,
                background: epNameGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {data.Title}
            </div>
            <div style={{ ...s.showLine, color: c.muted }}>
              Season {data.Season} · {data.Episodes.length} episodes
            </div>

            <div style={s.metaGrid}>
              <div
                style={{
                  ...s.mc,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ ...s.mcLabel, color: c.muted }}>episodes</div>
                <div style={{ ...s.mcVal, color: c.text }}>
                  {data.Episodes.length}
                </div>
              </div>
              <div
                style={{
                  ...s.mc,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ ...s.mcLabel, color: c.muted }}>rated</div>
                <div style={{ ...s.mcVal, color: c.text }}>{rated.length}</div>
              </div>
              {best && (
                <div
                  style={{
                    ...s.mc,
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ ...s.mcLabel, color: c.muted }}>
                    highest rated
                  </div>
                  <div style={{ ...s.mcVal, color: c.text }}>
                    E{best.Episode} · {best.imdbRating}
                  </div>
                </div>
              )}
              {worst && (
                <div
                  style={{
                    ...s.mc,
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ ...s.mcLabel, color: c.muted }}>
                    lowest rated
                  </div>
                  <div style={{ ...s.mcVal, color: c.text }}>
                    E{worst.Episode} · {worst.imdbRating}
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...s.sectionLabel, color: c.accent }}>episodes</div>
            <div style={{ ...s.epList, borderColor: c.accent }}>
              {data.Episodes.map((ep) => (
                <div key={ep.Episode} style={s.epRow}>
                  <span style={{ ...s.epNum, color: c.muted }}>
                    E{ep.Episode}
                  </span>
                  <span style={{ ...s.epTitle, color: c.muted }}>
                    {ep.Title}
                  </span>
                  <span style={{ ...s.epRating, color: c.text }}>
                    {ep.imdbRating !== "N/A" ? ep.imdbRating : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.ratingCol}>
            {poster && (
              <img
                src={poster}
                alt=""
                style={{ ...s.posterThumb, borderColor: c.border }}
              />
            )}
            <div style={{ flex: 1 }} />
            <div
              style={{
                ...s.ratingBlock,
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <div style={{ ...s.ratingLabel, color: c.muted }}>avg</div>
              <div
                style={{
                  ...s.ratingNum,
                  background: ratingGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {avg}
              </div>
              <div style={{ ...s.ratingDenom, color: c.muted }}>/ 10</div>
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <a
            href={`https://www.imdb.com/title/${imdbId}/episodes/?season=${data.Season}`}
            target="_blank"
            rel="noreferrer"
            style={{
              ...s.openBtn,
              color: c.accent,
              border: `1px solid ${c.border}`,
            }}
          >
            view season on IMDb ↗
          </a>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "1px",
    background: "linear-gradient(90deg, transparent, #ff4500, transparent)",
    zIndex: 3,
  },
  inner: { padding: "16px 18px", position: "relative", zIndex: 2 },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },
  imdbBadge: {
    background: "#ff4500",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: "3px",
    letterSpacing: ".1em",
    fontFamily: "'Space Mono', monospace",
  },
  tag: {
    fontSize: "8px",
    border: "1px solid",
    borderRadius: "2px",
    padding: "2px 6px",
    letterSpacing: ".1em",
    fontFamily: "'Space Mono', monospace",
  },
  dismiss: {
    marginLeft: "auto",
    fontSize: "9px",
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 88px",
    gap: "16px",
    marginBottom: "14px",
    alignItems: "stretch",
  },
  epName: {
    fontSize: "26px",
    lineHeight: "1",
    letterSpacing: ".04em",
    marginBottom: "4px",
    fontFamily: "'Bebas Neue', sans-serif",
  },
  showLine: {
    fontSize: "9px",
    letterSpacing: ".06em",
    marginBottom: "12px",
    fontFamily: "'Space Mono', monospace",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "5px",
    marginBottom: "12px",
  },
  mc: { borderRadius: "4px", padding: "6px 8px" },
  mcLabel: {
    fontSize: "8px",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    marginBottom: "2px",
    fontFamily: "'Space Mono', monospace",
  },
  mcVal: {
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
  },
  sectionLabel: {
    fontSize: "8px",
    letterSpacing: ".12em",
    textTransform: "uppercase",
    marginBottom: "6px",
    fontFamily: "'Space Mono', monospace",
  },
  epList: { borderLeft: "2px solid", paddingLeft: "9px" },
  epRow: {
    display: "flex",
    gap: "8px",
    alignItems: "baseline",
    marginBottom: "4px",
  },
  epNum: {
    fontSize: "8px",
    minWidth: "22px",
    fontFamily: "'Space Mono', monospace",
  },
  epTitle: { fontSize: "10px", flex: 1, fontFamily: "'Space Mono', monospace" },
  epRating: {
    fontSize: "10px",
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
  },
  ratingCol: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  posterThumb: {
    width: "100%",
    aspectRatio: "1/1" as unknown as number,
    borderRadius: "4px",
    objectFit: "cover" as const,
    objectPosition: "center top",
    border: "1px solid",
    flexShrink: 0,
  },
  ratingBlock: {
    borderRadius: "5px",
    padding: "12px 8px",
    textAlign: "center",
  },
  ratingLabel: {
    fontSize: "8px",
    letterSpacing: ".1em",
    textTransform: "uppercase",
    marginBottom: "4px",
    fontFamily: "'Space Mono', monospace",
  },
  ratingNum: {
    fontSize: "40px",
    lineHeight: "1",
    fontFamily: "'Bebas Neue', sans-serif",
  },
  ratingDenom: {
    fontSize: "9px",
    marginBottom: "7px",
    fontFamily: "'Space Mono', monospace",
  },
  footer: { paddingTop: "10px" },
  openBtn: {
    display: "block",
    width: "100%",
    textAlign: "center",
    background: "transparent",
    borderRadius: "4px",
    padding: "7px",
    fontSize: "9px",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    textDecoration: "none",
    boxSizing: "border-box",
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
  },
};
