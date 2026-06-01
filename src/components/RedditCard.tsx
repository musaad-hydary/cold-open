import React, { useState } from "react";
import type { RedditThread } from "../utils/reddit";

interface Props {
  threads: RedditThread[];
  title: string;
  onDismiss: () => void;
  light?: boolean;
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

function timeAgo(utc: number): string {
  const diff = Date.now() / 1000 - utc;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export function RedditCard({
  threads,
  title,
  onDismiss,
  light = false,
}: Props) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [sortBy, setSortBy] = useState<"comments" | "score">("comments");
  const c = light ? lightColors : darkColors;

  const sorted = [...threads].sort((a, b) =>
    sortBy === "comments" ? b.numComments - a.numComments : b.score - a.score,
  );

  return (
    <div
      style={{ ...s.card, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div style={s.sheen} />
      <div style={s.inner}>
        <div style={s.header}>
          <span style={s.badge}>Reddit</span>
          <span style={{ ...s.tag, color: c.accent, borderColor: c.accentDim }}>
            DISCUSSIONS
          </span>
          <span style={{ ...s.dismiss, color: c.muted }} onClick={onDismiss}>
            dismiss ×
          </span>
        </div>

        <div style={s.subheader}>
          <div style={{ ...s.pageTitle, color: c.muted }}>
            discussion threads for {title.toLowerCase()}
          </div>
          <div style={s.sortRow}>
            <span style={{ ...s.sortLabel, color: c.muted }}>sort by</span>
            <button
              onClick={() => setSortBy("comments")}
              style={{
                ...s.sortBtn,
                color: sortBy === "comments" ? c.accent : c.muted,
                borderColor: sortBy === "comments" ? c.accent : c.border,
                background: c.surface,
              }}
            >
              comments
            </button>
            <button
              onClick={() => setSortBy("score")}
              style={{
                ...s.sortBtn,
                color: sortBy === "score" ? c.accent : c.muted,
                borderColor: sortBy === "score" ? c.accent : c.border,
                background: c.surface,
              }}
            >
              upvotes
            </button>
          </div>
        </div>

        {!spoilerRevealed ? (
          <div
            style={{
              ...s.spoilerBanner,
              borderColor: c.border,
              background: c.surface,
            }}
            onClick={() => setSpoilerRevealed(true)}
          >
            <span style={{ ...s.spoilerIcon, color: c.accent }}>!</span>
            <span style={{ ...s.spoilerText, color: c.muted }}>
              these threads may contain spoilers
            </span>
            <span style={{ ...s.spoilerReveal, color: c.accent }}>
              show anyway
            </span>
          </div>
        ) : threads.length === 0 ? (
          <div style={{ ...s.empty, color: c.muted }}>
            no discussion threads found
          </div>
        ) : (
          <div style={s.threadList}>
            {sorted.slice(0, 3).map((t, i) => (
              <a
                key={i}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...s.thread,
                  borderColor: c.border,
                  background: c.surface,
                }}
              >
                <div style={{ ...s.threadTitle, color: c.text }}>{t.title}</div>
                <div style={s.threadMeta}>
                  <span style={{ ...s.metaBit, color: c.accent }}>
                    r/{t.subreddit}
                  </span>
                  <span style={{ ...s.metaBit, color: c.muted }}>
                    {t.score.toLocaleString()} pts
                  </span>
                  <span style={{ ...s.metaBit, color: c.muted }}>
                    {t.numComments.toLocaleString()} comments
                  </span>
                  {t.createdUtc > 0 && (
                    <span style={{ ...s.metaBit, color: c.muted }}>
                      {timeAgo(t.createdUtc)}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
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
    maxWidth: "680px",
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
    marginBottom: "10px",
  },
  badge: {
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
  subheader: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "12px",
  },
  pageTitle: {
    fontSize: "9px",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: ".06em",
    textTransform: "uppercase",
  },
  sortRow: { display: "flex", alignItems: "center", gap: "6px" },
  sortLabel: {
    fontSize: "8px",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: ".06em",
  },
  sortBtn: {
    fontSize: "8px",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: ".06em",
    border: "1px solid",
    borderRadius: "3px",
    padding: "2px 7px",
    cursor: "pointer",
  },
  spoilerBanner: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid",
    borderRadius: "4px",
    padding: "10px 12px",
    cursor: "pointer",
    marginBottom: "4px",
  },
  spoilerIcon: {
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
  },
  spoilerText: {
    fontSize: "10px",
    fontFamily: "'Space Mono', monospace",
    flex: 1,
  },
  spoilerReveal: {
    fontSize: "9px",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: ".06em",
    textDecoration: "underline",
  },
  empty: {
    fontSize: "10px",
    fontFamily: "'Space Mono', monospace",
    padding: "8px 0",
  },
  threadList: { display: "flex", flexDirection: "column", gap: "6px" },
  thread: {
    display: "block",
    borderRadius: "4px",
    padding: "10px 12px",
    border: "1px solid",
    textDecoration: "none",
    cursor: "pointer",
  },
  threadTitle: {
    fontSize: "11px",
    fontFamily: "'Space Mono', monospace",
    lineHeight: "1.5",
    marginBottom: "6px",
  },
  threadMeta: { display: "flex", gap: "10px", flexWrap: "wrap" },
  metaBit: { fontSize: "9px", fontFamily: "'Space Mono', monospace" },
};
