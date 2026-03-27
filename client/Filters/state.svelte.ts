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

export { STATUS_OPTIONS, getYear, getRuntime };

export class SearchBarState {
  // -- chip filters ----------------------------------------------------------
  media_type = $state<Set<"tv" | "movie">>(new Set());
  statuses = $state<Set<string>>(new Set());
  genres = $state<Set<string>>(new Set());
  languages = $state<Set<string>>(new Set());
  networks = $state<Set<string>>(new Set());

  // -- text search -----------------------------------------------------------
  title_query = $state("");
  episode_query = $state("");

  // -- episode filters -------------------------------------------------------
  upcoming_enabled = $state(false);
  upcoming_days = $state(7);
  recent_enabled = $state(false);
  recent_days = $state(7);
  no_next_enabled = $state(false);

  // -- range filters ---------------------------------------------------------
  rating_enabled = $state(false);
  rating_min = $state(0);
  rating_max = $state(10);
  rating_exclude_null = $state(false);

  runtime_enabled = $state(false);
  runtime_min = $state(0);
  runtime_max = $state<number | null>(null);
  runtime_exclude_null = $state(false);

  year_enabled = $state(false);
  year_min = $state<number | null>(null);
  year_max = $state<number | null>(null);

  // -- section state ---------------------------------------------------------
  open_sections = $state(new Set<string>());

  // -- derived list options --------------------------------------------------
  available_genres = $derived.by(() =>
    [...new Set(this.items.flatMap((m) => m.genres))].sort(),
  );
  available_languages = $derived.by(() =>
    [...new Set(this.items.map((m) => m.language).filter(Boolean))].sort(),
  );
  available_networks = $derived.by(
    () =>
      [
        ...new Set(this.items.map((m) => m.network).filter(Boolean)),
      ].sort() as string[],
  );

  year_limit_min = $derived.by(() => {
    const years = this.items
      .map((m) => getYear(m))
      .filter((y): y is number => y != null);
    return years.length ? Math.min(...years) : 1900;
  });
  year_limit_max = $derived.by(() => {
    const years = this.items
      .map((m) => getYear(m))
      .filter((y): y is number => y != null);
    return years.length ? Math.max(...years) : new Date().getFullYear();
  });
  runtime_limit_max = $derived.by(() => {
    const runtimes = this.items
      .map((m) => getRuntime(m))
      .filter((r): r is number => r != null);
    return runtimes.length ? Math.max(...runtimes) : 300;
  });

  // -- non-trivial / active --------------------------------------------------
  rating_non_trivial = $derived(this.rating_min > 0 || this.rating_max < 10);
  runtime_non_trivial = $derived(
    this.runtime_max !== null &&
      (this.runtime_min > 0 || this.runtime_max < this.runtime_limit_max),
  );
  year_non_trivial = $derived(
    this.year_min !== null &&
      this.year_max !== null &&
      (this.year_min > this.year_limit_min || this.year_max < this.year_limit_max),
  );

  rating_active = $derived(
    this.rating_enabled && (this.rating_non_trivial || this.rating_exclude_null),
  );
  runtime_active = $derived(
    this.runtime_enabled && (this.runtime_non_trivial || this.runtime_exclude_null),
  );
  year_active = $derived(this.year_enabled && this.year_non_trivial);

  // -- active count ----------------------------------------------------------
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

  // -- active tags -----------------------------------------------------------
  active_tags = $derived.by(() => {
    const tags: { label: string; clear: () => void }[] = [];
    const set = (label: string, clear: () => void) =>
      tags.push({ label, clear });

    if (this.media_type.size > 0)
      set(
        [...this.media_type]
          .map((x) => (x === "tv" ? "TV" : "Movie"))
          .join("/"),
        () => (this.media_type = new Set()),
      );
    if (this.statuses.size > 0)
      set(
        this.statuses.size === 1
          ? [...this.statuses][0]
          : `Status (${this.statuses.size})`,
        () => (this.statuses = new Set()),
      );
    if (this.genres.size > 0)
      set(
        this.genres.size === 1
          ? [...this.genres][0]
          : `Genre (${this.genres.size})`,
        () => (this.genres = new Set()),
      );
    if (this.networks.size > 0)
      set(
        this.networks.size === 1
          ? [...this.networks][0]
          : `Network (${this.networks.size})`,
        () => (this.networks = new Set()),
      );
    if (this.languages.size > 0)
      set(
        this.languages.size === 1
          ? [...this.languages][0]
          : `Lang (${this.languages.size})`,
        () => (this.languages = new Set()),
      );

    if (this.rating_enabled && this.rating_non_trivial)
      set(
        `Rating ${Number(this.rating_min).toFixed(1)}\u2013${Number(this.rating_max).toFixed(1)}`,
        () => {
          this.rating_min = 0;
          this.rating_max = 10;
        },
      );
    if (this.rating_enabled && this.rating_exclude_null)
      set("Excl. unrated", () => {
        this.rating_exclude_null = false;
      });
    if (this.runtime_enabled && this.runtime_non_trivial)
      set(`Runtime ${this.runtime_min}\u2013${this.runtime_max}m`, () => {
        this.runtime_min = 0;
        this.runtime_max = this.runtime_limit_max;
      });
    if (this.runtime_enabled && this.runtime_exclude_null)
      set("Excl. unknown runtime", () => {
        this.runtime_exclude_null = false;
      });
    if (this.year_active)
      set(`${this.year_min}\u2013${this.year_max}`, () => {
        this.year_min = this.year_limit_min;
        this.year_max = this.year_limit_max;
      });

    if (this.upcoming_enabled)
      set(
        `Airing \u2264${this.upcoming_days}d`,
        () => (this.upcoming_enabled = false),
      );
    if (this.recent_enabled)
      set(
        `Aired \u2264${this.recent_days}d ago`,
        () => (this.recent_enabled = false),
      );
    if (this.no_next_enabled)
      set("No next ep", () => (this.no_next_enabled = false));
    return tags;
  });

  // -- filter predicate ------------------------------------------------------
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
      const y_min = this.year_min,
        y_max = this.year_max;
      preds.push((m) => {
        const y = getYear(m);
        return y != null && y >= y_min && y <= y_max;
      });
    }

    return preds.length > 0 ? (m) => preds.every((p) => p(m)) : undefined;
  });

  // -- methods ---------------------------------------------------------------
  #getItems: () => Media[];

  constructor(getItems: () => Media[]) {
    this.#getItems = getItems;
    $effect(() => {
      if (this.runtime_enabled && this.runtime_max === null)
        this.runtime_max = this.runtime_limit_max;
    });
    $effect(() => {
      if (this.year_enabled && this.year_min === null)
        this.year_min = this.year_limit_min;
      if (this.year_enabled && this.year_max === null)
        this.year_max = this.year_limit_max;
    });
  }

  get items(): Media[] {
    return this.#getItems();
  }

  toggleChip<T>(set: Set<T>, val: T, section: string): Set<T> {
    const next = new Set(set);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
      this.openSection(section);
    }
    return next;
  }

  openSection(s: string) {
    if (!this.open_sections.has(s))
      this.open_sections = new Set([...this.open_sections, s]);
  }

  closeSection(s: string) {
    this.open_sections = new Set([...this.open_sections].filter((x) => x !== s));
  }

  toggleSection(s: string) {
    if (this.open_sections.has(s)) {
      this.closeSection(s);
      if (s === "rating") this.rating_enabled = false;
      if (s === "runtime") this.runtime_enabled = false;
      if (s === "year") this.year_enabled = false;
    } else {
      this.openSection(s);
      if (s === "rating") this.rating_enabled = true;
      if (s === "runtime") this.runtime_enabled = true;
      if (s === "year") this.year_enabled = true;
    }
  }

  clearFilters() {
    this.media_type = new Set();
    this.statuses = new Set();
    this.genres = new Set();
    this.languages = new Set();
    this.networks = new Set();
    this.upcoming_enabled = false;
    this.upcoming_days = 7;
    this.recent_enabled = false;
    this.recent_days = 7;
    this.no_next_enabled = false;
    this.rating_enabled = false;
    this.rating_min = 0;
    this.rating_max = 10;
    this.rating_exclude_null = false;
    this.runtime_enabled = false;
    this.runtime_min = 0;
    this.runtime_max = null;
    this.runtime_exclude_null = false;
    this.year_enabled = false;
    this.year_min = null;
    this.year_max = null;
    this.open_sections = new Set();
  }
}
