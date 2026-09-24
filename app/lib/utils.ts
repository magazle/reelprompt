// ── Text helpers ─────────────────────────────────────────────────────────────

/** Strip all HTML tags, collapse whitespace, return plain text. */
export function htmlToPlain(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Count words in an HTML string. Uses \s+ split so multiple spaces don't inflate count. */
export function countWords(html: string): number {
  const plain = htmlToPlain(html);
  return plain ? plain.split(/\s+/).length : 0;
}

// ── Read-time helpers ─────────────────────────────────────────────────────────

/** Estimated read time in seconds. Falls back to 130 WPM if not calibrated. */
export function readTimeSec(words: number, wpm: number | null): number {
  return Math.round((words / (wpm ?? 130)) * 60);
}

/** Format seconds as "45s" or "2m 15s". */
export function formatReadTime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Format a Unix timestamp as "May 11". */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
