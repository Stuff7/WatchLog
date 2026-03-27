import type { Media, EpisodeRef } from "$/types.d.ts";

// -- Card display helpers ------------------------------------------------------

export type RefreshStatus =
  | "idle"
  | "pending"
  | "updating"
  | "changed"
  | "unchanged"
  | "error";

export const POSTER_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%230c0c10'/%3E%3Ctext x='50' y='82' font-size='28' text-anchor='middle' fill='%2327272a'%3E?%3C/text%3E%3C/svg%3E";

const STATUS_COLORS: Record<string, string> = {
  "Returning Series": "#34d399",
  Ended: "#71717a",
  Canceled: "#f87171",
  "In Production": "#818cf8",
  Released: "#38bdf8",
};

export const statusColor = (status: string): string =>
  STATUS_COLORS[status] ?? "#52525b";
export const stars = (rating: number | null | undefined): number =>
  rating ? Math.round((rating / 10) * 5) : 0;
export const epLabel = (ep: EpisodeRef): string =>
  `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}`;

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function daysUntilLabel(iso: string | null | undefined): string | null {
  const d = daysUntil(iso);
  if (d === null || d < 0) return null;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `In ${d}d`;
}

// -- Diff ----------------------------------------------------------------------

export type DiffEntry = { field: string; from: string; to: string };

const DIFF_FIELDS = [
  "name",
  "status",
  "network",
  "rating",
  "vote_count",
  "runtime",
  "premiered",
  "ended",
  "overview",
  "tagline",
  "poster",
  "backdrop",
  "number_of_seasons",
  "number_of_episodes",
  "release_date",
  "language",
] as const satisfies readonly (keyof Media)[];

const epStr = (e: Media["last_episode"]) =>
  e ? `S${e.season}E${e.episode} – ${e.name}` : "none";

export function diffMedia(old: Media, fresh: Media): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  for (const f of DIFF_FIELDS) {
    const a = old[f] ?? null,
      b = fresh[f] ?? null;
    if (String(a) !== String(b))
      diffs.push({ field: f, from: String(a), to: String(b) });
  }
  const ag = (old.genres ?? []).join(", "),
    bg = (fresh.genres ?? []).join(", ");
  if (ag !== bg) diffs.push({ field: "genres", from: ag, to: bg });
  if (epStr(old.last_episode) !== epStr(fresh.last_episode))
    diffs.push({
      field: "last_episode",
      from: epStr(old.last_episode),
      to: epStr(fresh.last_episode),
    });
  if (epStr(old.next_episode) !== epStr(fresh.next_episode))
    diffs.push({
      field: "next_episode",
      from: epStr(old.next_episode),
      to: epStr(fresh.next_episode),
    });
  return diffs;
}
