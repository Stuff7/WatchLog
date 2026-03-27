<script lang="ts" module>
  import type { Media, EpisodeRef } from "$/types.d.ts";

  export type SortKey =
    | "title"
    | "status"
    | "network"
    | "rating"
    | "next"
    | "last";

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
    { key: "network", label: "Network" },
    { key: "next", label: "Next Ep" },
    { key: "last", label: "Last Ep" },
  ];

  function epDate(ep: EpisodeRef | null | undefined): number | null {
    if (!ep?.air_date) return null;
    const t = new Date(ep.air_date).getTime();
    return isNaN(t) ? null : t;
  }

  function cmpNullsLast(
    a: number | null,
    b: number | null,
    asc: boolean,
  ): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return asc ? a - b : b - a;
  }

  function cmpStrNullsLast(
    a: string | null | undefined,
    b: string | null | undefined,
    asc: boolean,
  ): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return asc ? a.localeCompare(b) : b.localeCompare(a);
  }

  function getComparator(
    key: SortKey,
    asc: boolean,
  ): (a: Media, b: Media) => number {
    switch (key) {
      case "title":
        return (a, b) => cmpStrNullsLast(a.name, b.name, asc);
      case "status":
        return (a, b) => cmpStrNullsLast(a.status, b.status, asc);
      case "network":
        return (a, b) => cmpStrNullsLast(a.network, b.network, asc);
      case "rating":
        return (a, b) => cmpNullsLast(a.rating ?? null, b.rating ?? null, asc);
      case "next":
        return (a, b) =>
          cmpNullsLast(epDate(a.next_episode), epDate(b.next_episode), asc);
      case "last":
        return (a, b) =>
          cmpNullsLast(epDate(a.last_episode), epDate(b.last_episode), asc);
    }
  }
</script>

<script lang="ts">
  type Props = {
    list: Media[];
    selection_mode: boolean;
    selected_count: number;
    refresh_running: boolean;
    onRefresh: () => void;
    onSelectAll: () => void;
  };

  let {
    list = $bindable(),
    selection_mode,
    selected_count,
    refresh_running,
    onRefresh,
    onSelectAll,
  }: Props = $props();

  let sort_key = $state<SortKey | null>(null);
  let sort_asc = $state(true);
  let snapshot: Media[] | null = null;

  function select(key: SortKey) {
    if (snapshot === null) snapshot = Array.from(list);
    sort_asc = sort_key === key ? !sort_asc : true;
    sort_key = key;
    list.sort(getComparator(key, sort_asc));
  }

  function clear() {
    if (snapshot === null) return;
    list.splice(0, list.length, ...snapshot);
    snapshot = null;
    sort_key = null;
    sort_asc = true;
  }
</script>

<div class="sortbar">
  <span class="sortbar-label">Sort</span>

  <div class="sortbar-pills">
    {#each SORT_OPTIONS as opt}
      {@const active = sort_key === opt.key}
      <button
        class="pill"
        class:active
        onclick={() => select(opt.key)}
        type="button"
      >
        {opt.label}
        {#if active}<span class="dir" class:desc={!sort_asc}>↑</span>{/if}
      </button>
    {/each}
  </div>

  {#if sort_key}
    <button class="clear" onclick={clear} type="button" title="Clear sort"
      >✕</button
    >
  {/if}

  <div class="sortbar-right">
    {#if selection_mode}
      <span class="sel-count">{selected_count} selected</span>
      <button
        class="refresh-btn"
        class:running={refresh_running}
        onclick={onRefresh}
        disabled={refresh_running}
        type="button"
      >
        {#if refresh_running}
          <span class="spinner"></span>Refreshing…
        {:else}
          <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
            <path
              d="M13.5 8A5.5 5.5 0 1 1 8 2.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M8 2.5L11 5.5M8 2.5L5 5.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Refresh
        {/if}
      </button>
      <button
        class="icon-btn"
        onclick={onSelectAll}
        type="button"
        title="Deselect all">✕</button
      >
    {:else}
      <button
        class="select-hint"
        onclick={onSelectAll}
        type="button"
        title="Select all"
      >
        <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
          <rect
            x="2"
            y="2"
            width="5"
            height="5"
            rx="1"
            stroke="currentColor"
            stroke-width="1.25"
          />
          <rect
            x="9"
            y="2"
            width="5"
            height="5"
            rx="1"
            stroke="currentColor"
            stroke-width="1.25"
          />
          <rect
            x="2"
            y="9"
            width="5"
            height="5"
            rx="1"
            stroke="currentColor"
            stroke-width="1.25"
          />
          <rect
            x="9"
            y="9"
            width="5"
            height="5"
            rx="1"
            stroke="currentColor"
            stroke-width="1.25"
          />
        </svg>
        Select
      </button>
    {/if}
  </div>
</div>

<style lang="postcss">
  .sortbar {
    @apply flex items-center gap-3 px-4 border-b border-white/[0.06] shrink-0 bg-black/30;
    height: 2.25rem;
  }

  .sortbar-label {
    @apply font-mono text-white/20 text-xs tracking-[0.2em] uppercase shrink-0 select-none;
  }

  .sortbar-pills {
    @apply flex items-center flex-1;
  }

  .pill {
    @apply relative font-mono uppercase text-xs tracking-widest px-3
           text-white/30 bg-transparent border-0 cursor-pointer select-none
           flex items-center gap-1.5 transition-colors duration-100;
    height: 2.25rem;

    &::after {
      @apply absolute bottom-0 inset-x-0 h-px bg-amber-400 opacity-0 transition-opacity duration-150;
      content: "";
    }
    &:hover {
      @apply text-white/60;
    }
    &.active {
      @apply text-amber-400;
      &::after {
        @apply opacity-100;
      }
    }
  }

  .dir {
    @apply inline-block text-amber-400 transition-transform duration-150 font-bold text-xs;
    &.desc {
      transform: rotate(180deg);
    }
  }

  .clear {
    @apply font-mono text-xs text-white/20 hover:text-red-400 bg-transparent border-0
           cursor-pointer shrink-0 px-1 transition-colors duration-150 select-none;
  }

  .sortbar-right {
    @apply flex items-center gap-2 shrink-0 border-l border-white/[0.06] pl-3;
  }

  .select-hint {
    @apply flex items-center gap-1.5 font-mono text-xs text-white/20 hover:text-white/50
           bg-transparent border-none cursor-pointer transition-colors duration-150 select-none;
  }

  .sel-count {
    @apply font-mono text-xs text-amber-400/70;
  }

  .refresh-btn {
    @apply flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest
           text-amber-400 bg-amber-400/10 border border-amber-400/25
           cursor-pointer px-2.5 py-1 transition-all duration-150 select-none;
    &:hover:not(:disabled) {
      @apply bg-amber-400/20 border-amber-400/50;
    }
    &:disabled {
      @apply opacity-60 cursor-not-allowed;
    }
    &.running {
      @apply text-amber-400/60;
    }
  }

  .icon-btn {
    @apply font-mono text-xs text-white/20 hover:text-white/60 bg-transparent border-none
           cursor-pointer transition-colors duration-150 select-none px-1;
  }

  .spinner {
    @apply inline-block w-2.5 h-2.5 rounded-full border border-amber-400/30 border-t-amber-400;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
