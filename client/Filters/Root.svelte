<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import Collapsible from "$/Collapsible.svelte";
  import RangeSection from "./RangeSection.svelte";
  import { SearchBarState, STATUS_OPTIONS } from "./state.svelte.ts";

  let {
    filter = $bindable(),
    items,
  }: {
    filter: ((item: Media) => boolean) | undefined;
    items: Media[];
  } = $props();

  const s = new SearchBarState(() => items);

  $effect(() => {
    filter = s.predicate;
  });

  const chip_sections = $derived([
    {
      key: "status",
      label: "Status",
      options: STATUS_OPTIONS,
      selected: s.statuses,
      toggle: (v: string) =>
        (s.statuses = s.toggleChip(s.statuses, v as any, "status")),
    },
    {
      key: "genre",
      label: "Genre",
      options: s.available_genres,
      selected: s.genres,
      toggle: (v: string) => (s.genres = s.toggleChip(s.genres, v, "genre")),
    },
    {
      key: "network",
      label: "Network",
      options: s.available_networks,
      selected: s.networks,
      toggle: (v: string) =>
        (s.networks = s.toggleChip(s.networks, v, "network")),
    },
    {
      key: "language",
      label: "Language",
      options: s.available_languages,
      selected: s.languages,
      toggle: (v: string) =>
        (s.languages = s.toggleChip(s.languages, v, "language")),
    },
  ]);

  const has_panel_filter = $derived(s.active_count > 0);
  const has_search_query = $derived(
    !!s.title_query.trim() || !!s.episode_query.trim(),
  );
  let expanded = $state(false);
</script>

<div class="sb">
  <div class="sb-top">
    <input
      class="sb-input"
      type="text"
      placeholder="Search title…"
      bind:value={s.title_query}
    />
    <input
      class="sb-input sb-input--sm"
      type="text"
      placeholder="Episode name…"
      bind:value={s.episode_query}
    />

    <div class="sb-pills">
      {#each ["tv", "movie"] as const as t}
        <button
          class="pill"
          class:active={s.media_type.has(t)}
          onclick={() => (s.media_type = s.toggleChip(s.media_type, t, ""))}
        >
          {t === "tv" ? "TV" : "Movie"}
        </button>
      {/each}
    </div>

    <button
      class="sb-expand"
      class:active={expanded || has_panel_filter}
      onclick={() => (expanded = !expanded)}
    >
      Filters{s.active_count > 0 ? ` (${s.active_count})` : ""}
      <i class="icon sb-chevron" class:open={expanded}></i>
    </button>

    {#if has_search_query || has_panel_filter}
      <button
        class="sb-clear"
        onclick={() => {
          s.title_query = "";
          s.episode_query = "";
          s.clearFilters();
        }}
      >
        Reset
      </button>
    {/if}
  </div>

  {#if s.active_tags.length > 0}
    <div class="sb-tags">
      {#each s.active_tags as tag}
        <button class="sb-tag" onclick={tag.clear}>{tag.label} ✕</button>
      {/each}
    </div>
  {/if}

  {#if expanded}
    <div class="sb-panel">
      {#each chip_sections as cs}
        {#if cs.options.length > 0}
          <Collapsible
            open={s.open_sections.has(cs.key)}
            onclick={() => s.toggleSection(cs.key)}
          >
            {#snippet label()}
              <span class="sb-label"
                >{cs.label}{cs.selected.size > 0
                  ? ` (${cs.selected.size})`
                  : ""}</span
              >
            {/snippet}
            {#snippet children()}
              <div class="sb-chips">
                {#each cs.options as opt}
                  <button
                    class="chip"
                    class:active={cs.selected.has(opt as any)}
                    onclick={() => cs.toggle(opt)}>{opt}</button
                  >
                {/each}
              </div>
            {/snippet}
          </Collapsible>
        {/if}
      {/each}

      <RangeSection
        open={s.open_sections.has("rating")}
        ontoggle={() => s.toggleSection("rating")}
        bind:min={s.rating_min}
        bind:max={s.rating_max}
        min_limit={0}
        max_limit={10}
        step={0.1}
        formatter={(v) => Number(v).toFixed(1)}
        bind:exclude_null={s.rating_exclude_null}
        exclude_label="Exclude unrated"
      >
        {#snippet header()}
          Rating
          {#if s.rating_enabled && s.rating_non_trivial}
            <span class="sb-val"
              >{Number(s.rating_min).toFixed(1)}–{Number(s.rating_max).toFixed(
                1,
              )}</span
            >
          {/if}
        {/snippet}
      </RangeSection>

      <RangeSection
        open={s.open_sections.has("runtime")}
        ontoggle={() => s.toggleSection("runtime")}
        bind:min={s.runtime_min}
        bind:max={s.runtime_max}
        min_limit={0}
        max_limit={s.runtime_limit_max}
        step={5}
        formatter={(v) => `${Math.round(v)}m`}
        bind:exclude_null={s.runtime_exclude_null}
        exclude_label="Exclude unknown runtime"
      >
        {#snippet header()}
          Runtime
          {#if s.runtime_enabled && s.runtime_non_trivial}
            <span class="sb-val">{s.runtime_min}–{s.runtime_max}m</span>
          {/if}
        {/snippet}
      </RangeSection>

      <RangeSection
        open={s.open_sections.has("year")}
        ontoggle={() => s.toggleSection("year")}
        bind:min={s.year_min}
        bind:max={s.year_max}
        min_limit={s.year_limit_min}
        max_limit={s.year_limit_max}
        step={1}
        formatter={(v) => Math.round(v)}
      >
        {#snippet header()}
          Year
          {#if s.year_active}
            <span class="sb-val">{s.year_min}–{s.year_max}</span>
          {/if}
        {/snippet}
      </RangeSection>

      <Collapsible
        open={s.open_sections.has("episodes")}
        onclick={() => s.toggleSection("episodes")}
      >
        {#snippet label()}
          <span class="sb-label">
            Episodes
            {#if s.upcoming_enabled || s.recent_enabled || s.no_next_enabled}
              <span class="sb-val">●</span>
            {/if}
          </span>
        {/snippet}
        {#snippet children()}
          <label class="sb-check-row" class:inactive={!s.upcoming_enabled}>
            <input
              type="checkbox"
              bind:checked={s.upcoming_enabled}
              onchange={() => {
                if (s.upcoming_enabled) s.openSection("episodes");
              }}
            />
            <span>Airing in next</span>
            <input
              class="sb-days"
              type="number"
              min="1"
              max="365"
              bind:value={s.upcoming_days}
              disabled={!s.upcoming_enabled}
            />
            <span>days</span>
          </label>
          <label class="sb-check-row" class:inactive={!s.recent_enabled}>
            <input
              type="checkbox"
              bind:checked={s.recent_enabled}
              onchange={() => {
                if (s.recent_enabled) s.openSection("episodes");
              }}
            />
            <span>Aired in last</span>
            <input
              class="sb-days"
              type="number"
              min="1"
              max="365"
              bind:value={s.recent_days}
              disabled={!s.recent_enabled}
            />
            <span>days</span>
          </label>
          <label class="sb-check-row" class:inactive={!s.no_next_enabled}>
            <input
              type="checkbox"
              bind:checked={s.no_next_enabled}
              onchange={() => {
                if (s.no_next_enabled) s.openSection("episodes");
              }}
            />
            <span>Returning with no next episode scheduled</span>
          </label>
        {/snippet}
      </Collapsible>
    </div>
  {/if}
</div>

<style lang="postcss">
  .sb {
    @apply border-b border-white/[0.07] shrink-0 flex flex-col;
  }
  .sb-top {
    @apply flex items-center gap-2 px-3 py-1.5;
  }
  .sb-input {
    @apply flex-1 bg-transparent border border-white/10 text-white/70 text-xs font-mono px-2 py-1 rounded;
    &:focus {
      @apply outline-none border-amber-400/50;
    }
    &::placeholder {
      @apply text-white/20;
    }
    &.sb-input--sm {
      @apply flex-none w-36;
    }
  }
  .sb-pills {
    @apply flex gap-1;
  }
  .sb-expand {
    @apply flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs font-mono transition-colors px-2 py-1 border border-white/10 rounded whitespace-nowrap;
    &.active {
      @apply border-amber-400/30 text-amber-400/70;
    }
  }
  .icon.sb-chevron {
    @apply text-[0.6rem] text-current transition-transform duration-200;
    display: inline-block;
    &.open {
      transform: rotate(180deg);
    }
  }
  .sb-clear {
    @apply text-white/30 hover:text-white/60 text-xs font-mono transition-colors whitespace-nowrap;
  }
  .sb-tags {
    @apply flex flex-wrap gap-1 px-3 pb-1.5;
  }
  .sb-tag {
    @apply text-xs font-mono text-amber-400/60 border border-amber-400/20 px-1.5 py-0.5 rounded
           hover:text-amber-400 hover:border-amber-400/50 transition-colors cursor-pointer;
  }
  .sb-panel {
    @apply px-3 pb-1 pt-1 flex flex-col border-t border-white/[0.07];
  }
  .sb-label {
    @apply text-white/25 text-xs font-mono uppercase tracking-[0.12em] flex items-center gap-1.5;
  }
  .sb-val {
    @apply text-amber-400/60 normal-case tracking-normal;
  }
  .sb-chips {
    @apply flex flex-wrap gap-1;
  }
  .sb-check-row {
    @apply flex items-center gap-2 text-white/50 text-xs font-mono cursor-pointer transition-opacity;
    &.inactive {
      @apply opacity-40;
    }
    &:hover {
      @apply opacity-100;
    }
    .sb-days {
      @apply w-14 bg-zinc-900 border border-white/10 text-white/70 text-xs font-mono px-2 py-0.5 rounded;
      &:disabled {
        @apply cursor-not-allowed;
      }
      &:focus {
        @apply outline-none border-amber-400/50;
      }
    }
  }
  .pill,
  .chip {
    @apply bg-zinc-900 border border-white/10 text-white/40 text-xs font-mono px-2 py-0.5 rounded transition-colors cursor-pointer;
    &:hover {
      @apply text-white/70;
    }
    &.active {
      @apply border-amber-400/50 text-amber-400;
    }
  }
  input[type="number"] {
    @apply w-20 bg-zinc-900 border border-white/10 text-white/70 text-xs font-mono px-2 py-1 rounded;
    &:focus {
      @apply outline-none border-amber-400/50;
    }
    &:disabled {
      @apply opacity-40 cursor-not-allowed;
    }
  }
  input[type="checkbox"] {
    @apply accent-amber-400 cursor-pointer;
  }
</style>
