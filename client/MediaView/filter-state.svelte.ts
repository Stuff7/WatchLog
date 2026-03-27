import type { Media, Status } from "$/types.d.ts";

const STATUS_OPTIONS: Status[] = [
  "Returning Series",
  "Ended",
  "Canceled",
  "In Production",
  "Planned",
  "Pilot",
  "Released",
];

function getYear(m: Media): number | null {
  const d = m.premiered ?? m.release_date;
  return d ? new Date(d).getFullYear() : null;
}

function getRuntime(m: Media): number | null {
  return (
    m.runtime ?? m.next_episode?.runtime ?? m.last_episode?.runtime ?? null
  );
}

export type Tag = { label: string; clear: () => void };

export class FilterState {
  // -- Chip filters --------------------------------------------------------
  media_type = $state(new Set<"tv" | "movie">());
  statuses = $state(new Set<Status>());
  genres = $state(new Set<string>());
  languages = $state(new Set<string>());
  networks = $state(new Set<string>());

  // -- Text search ----------------------------------------------------------
  title_query = $state("");
  episode_query = $state("");

  // -- Episode window -------------------------------------------------------
  upcoming_enabled = $state(false);
  upcoming_days = $state(7);
  recent_enabled = $state(false);
  recent_days = $state(7);
  no_next_enabled = $state(false);

  // -- Range: rating --------------------------------------------------------
  rating_open = $state(false);
  rating_min = $state(0);
  rating_max = $state(10);
  rating_exclude_null = $state(false);

  // -- Range: runtime -------------------------------------------------------
  runtime_open = $state(false);
  runtime_min = $state(0);
  runtime_max = $state<number | null>(null);
  runtime_exclude_null = $state(false);

  // -- Range: year ----------------------------------------------------------
  year_open = $state(false);
  year_min = $state<number | null>(null);
  year_max = $state<number | null>(null);

  // -- Open sections for chip groups ----------------------------------------
  open_sections = $state(new Set<string>());

  // -- Derived options from items -------------------------------------------
  readonly status_options = STATUS_OPTIONS;

  available_genres = $derived.by(() =>
    [...new Set(this.#items.flatMap((m) => m.genres))].sort(),
  );
  available_languages = $derived.by(() =>
    [...new Set(this.#items.map((m) => m.language).filter(Boolean))].sort(),
  );
  available_networks = $derived.by(
    () =>
      [
        ...new Set(this.#items.map((m) => m.network).filter(Boolean)),
      ].sort() as string[],
  );

  year_limit_min = $derived.by(() => {
    const years = this.#items
      .map(getYear)
      .filter((y): y is number => y != null);
    return years.length ? Math.min(...years) : 1900;
  });
  year_limit_max = $derived.by(() => {
    const years = this.#items
      .map(getYear)
      .filter((y): y is number => y != null);
    return years.length ? Math.max(...years) : new Date().getFullYear();
  });
  readonly runtime_step = 5;

  runtime_limit_max = $derived.by(() => {
    const rts = this.#items
      .map(getRuntime)
      .filter((r): r is number => r != null);
    const raw = rts.length ? Math.max(...rts) : 300;
    return Math.ceil(raw / this.runtime_step) * this.runtime_step;
  });

  // -- Active checks ---------------------------------------------------------
  rating_non_trivial = $derived(this.rating_min > 0 || this.rating_max < 10);
  runtime_non_trivial = $derived(
    this.runtime_max !== null &&
      (this.runtime_min > 0 || this.runtime_max < this.runtime_limit_max),
  );
  year_non_trivial = $derived(
    this.year_min !== null &&
      this.year_max !== null &&
      (this.year_min > this.year_limit_min ||
        this.year_max < this.year_limit_max),
  );

  rating_active = $derived(
    this.rating_open && (this.rating_non_trivial || this.rating_exclude_null),
  );
  runtime_active = $derived(
    this.runtime_open &&
      (this.runtime_non_trivial || this.runtime_exclude_null),
  );
  year_active = $derived(this.year_open && this.year_non_trivial);

  active_count = $derived(
    (this.media_type.size > 0 ? 1 : 0) +
      (this.statuses.size > 0 ? 1 : 0) +
      (this.genres.size > 0 ? 1 : 0) +
      (this.languages.size > 0 ? 1 : 0) +
      (this.networks.size > 0 ? 1 : 0) +
      (this.upcoming_enabled || this.recent_enabled || this.no_next_enabled
        ? 1
        : 0) +
      (this.rating_active ? 1 : 0) +
      (this.runtime_active ? 1 : 0) +
      (this.year_active ? 1 : 0),
  );

  active_tags = $derived.by((): Tag[] => {
    const tags: Tag[] = [];

    if (this.media_type.size > 0)
      tags.push({
        label: [...this.media_type]
          .map((t) => (t === "tv" ? "TV" : "Movie"))
          .join("/"),
        clear: () => (this.media_type = new Set()),
      });
    if (this.statuses.size > 0)
      tags.push({
        label:
          this.statuses.size === 1
            ? [...this.statuses][0]
            : `Status (${this.statuses.size})`,
        clear: () => (this.statuses = new Set()),
      });
    if (this.genres.size > 0)
      tags.push({
        label:
          this.genres.size === 1
            ? [...this.genres][0]
            : `Genre (${this.genres.size})`,
        clear: () => (this.genres = new Set()),
      });
    if (this.networks.size > 0)
      tags.push({
        label:
          this.networks.size === 1
            ? [...this.networks][0]
            : `Network (${this.networks.size})`,
        clear: () => (this.networks = new Set()),
      });
    if (this.languages.size > 0)
      tags.push({
        label:
          this.languages.size === 1
            ? [...this.languages][0]
            : `Lang (${this.languages.size})`,
        clear: () => (this.languages = new Set()),
      });
    if (this.rating_open && this.rating_non_trivial)
      tags.push({
        label: `Rating ${this.rating_min.toFixed(1)}–${this.rating_max.toFixed(1)}`,
        clear: () => {
          this.rating_min = 0;
          this.rating_max = 10;
        },
      });
    if (this.rating_open && this.rating_exclude_null)
      tags.push({
        label: "Excl. unrated",
        clear: () => (this.rating_exclude_null = false),
      });
    if (this.runtime_open && this.runtime_non_trivial)
      tags.push({
        label: `Runtime ${this.runtime_min}–${this.runtime_max}m`,
        clear: () => {
          this.runtime_min = 0;
          this.runtime_max = this.runtime_limit_max;
        },
      });
    if (this.runtime_open && this.runtime_exclude_null)
      tags.push({
        label: "Excl. unknown runtime",
        clear: () => (this.runtime_exclude_null = false),
      });
    if (this.year_active)
      tags.push({
        label: `${this.year_min}–${this.year_max}`,
        clear: () => {
          this.year_min = this.year_limit_min;
          this.year_max = this.year_limit_max;
        },
      });
    if (this.upcoming_enabled)
      tags.push({
        label: `Airing ≤${this.upcoming_days}d`,
        clear: () => (this.upcoming_enabled = false),
      });
    if (this.recent_enabled)
      tags.push({
        label: `Aired ≤${this.recent_days}d ago`,
        clear: () => (this.recent_enabled = false),
      });
    if (this.no_next_enabled)
      tags.push({
        label: "No next ep",
        clear: () => (this.no_next_enabled = false),
      });
    return tags;
  });

  // -- Compiled filter predicate ---------------------------------------------
  predicate = $derived.by((): ((m: Media) => boolean) | undefined => {
    const preds: ((m: Media) => boolean)[] = [];

    const tq = this.title_query.trim().toLowerCase();
    if (tq) preds.push((m) => m.name.toLowerCase().includes(tq));

    const eq = this.episode_query.trim().toLowerCase();
    if (eq)
      preds.push(
        (m) =>
          (m.next_episode?.name ?? "").toLowerCase().includes(eq) ||
          (m.last_episode?.name ?? "").toLowerCase().includes(eq),
      );

    if (this.media_type.size > 0)
      preds.push((m) => this.media_type.has(m.media_type));
    if (this.statuses.size > 0) preds.push((m) => this.statuses.has(m.status));
    if (this.genres.size > 0)
      preds.push((m) => m.genres.some((g) => this.genres.has(g)));
    if (this.languages.size > 0)
      preds.push((m) => this.languages.has(m.language));
    if (this.networks.size > 0)
      preds.push((m) => m.network != null && this.networks.has(m.network));

    const ep_preds: ((m: Media) => boolean)[] = [];
    if (this.upcoming_enabled) {
      const cutoff = Date.now() + this.upcoming_days * 864e5;
      ep_preds.push((m) => {
        if (!m.next_episode?.air_date) return false;
        const d = new Date(m.next_episode.air_date).getTime();
        return d >= Date.now() && d <= cutoff;
      });
    }
    if (this.recent_enabled) {
      const cutoff = Date.now() - this.recent_days * 864e5;
      ep_preds.push((m) => {
        if (!m.last_episode?.air_date) return false;
        const d = new Date(m.last_episode.air_date).getTime();
        return d >= cutoff && d <= Date.now();
      });
    }
    if (this.no_next_enabled)
      ep_preds.push(
        (m) => m.status === "Returning Series" && m.next_episode == null,
      );
    if (ep_preds.length > 0) preds.push((m) => ep_preds.some((p) => p(m)));

    if (this.rating_active)
      preds.push((m) => {
        if (m.rating == null) return !this.rating_exclude_null;
        return m.rating >= this.rating_min && m.rating <= this.rating_max;
      });

    if (this.runtime_active && this.runtime_max !== null) {
      const rt_max = this.runtime_max;
      preds.push((m) => {
        const rt = getRuntime(m);
        if (rt == null) return !this.runtime_exclude_null;
        return rt >= this.runtime_min && rt <= rt_max;
      });
    }

    if (this.year_active && this.year_min !== null && this.year_max !== null) {
      const [y_min, y_max] = [this.year_min, this.year_max];
      preds.push((m) => {
        const y = getYear(m);
        return y != null && y >= y_min && y <= y_max;
      });
    }

    return preds.length > 0 ? (m) => preds.every((p) => p(m)) : undefined;
  });

  // -- Section helpers -------------------------------------------------------
  toggleChip<T>(set: Set<T>, val: T, section: string): Set<T> {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else {
      next.add(val);
      this.openSection(section);
    }
    return next;
  }

  openSection(key: string) {
    if (!this.open_sections.has(key))
      this.open_sections = new Set([...this.open_sections, key]);
  }

  toggleSection(key: string) {
    const next = new Set(this.open_sections);
    if (next.has(key)) {
      next.delete(key);
      if (key === "rating") this.rating_open = false;
      if (key === "runtime") this.runtime_open = false;
      if (key === "year") this.year_open = false;
    } else {
      next.add(key);
      if (key === "rating") {
        this.rating_open = true;
      }
      if (key === "runtime") {
        this.runtime_open = true;
        if (this.runtime_max === null)
          this.runtime_max = this.runtime_limit_max;
      }
      if (key === "year") {
        this.year_open = true;
        if (this.year_min === null) this.year_min = this.year_limit_min;
        if (this.year_max === null) this.year_max = this.year_limit_max;
      }
    }
    this.open_sections = next;
  }

  reset() {
    this.media_type = new Set();
    this.statuses = new Set();
    this.genres = new Set();
    this.languages = new Set();
    this.networks = new Set();
    this.title_query = "";
    this.episode_query = "";
    this.upcoming_enabled = false;
    this.upcoming_days = 7;
    this.recent_enabled = false;
    this.recent_days = 7;
    this.no_next_enabled = false;
    this.rating_open = false;
    this.rating_min = 0;
    this.rating_max = 10;
    this.rating_exclude_null = false;
    this.runtime_open = false;
    this.runtime_min = 0;
    this.runtime_max = null;
    this.runtime_exclude_null = false;
    this.year_open = false;
    this.year_min = null;
    this.year_max = null;
    this.open_sections = new Set();
  }

  // -- Private ---------------------------------------------------------------
  #items: Media[] = $state([]);

  setItems(items: Media[]) {
    this.#items = items;
  }
}
