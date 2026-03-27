export type Tab = "overview" | "episodes" | "cast" | "media" | "more";

export const FALLBACK_PERSON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%2311111a'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%231e1e2e'/%3E%3Cellipse cx='40' cy='72' rx='22' ry='14' fill='%231e1e2e'/%3E%3C/svg%3E";

export const FALLBACK_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150'%3E%3Crect width='100' height='150' fill='%2311111a'/%3E%3Ctext x='50' y='82' font-size='24' text-anchor='middle' fill='%231e1e2e'%3E?%3C/text%3E%3C/svg%3E";

export function epLabel(s: number, e: number) {
  return `S${String(s).padStart(2, "0")}E${String(e).padStart(2, "0")}`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function formatRuntime(mins: number | null | undefined) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatMoney(n: number | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
