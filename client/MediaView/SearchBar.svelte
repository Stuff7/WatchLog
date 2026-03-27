<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import RangeInput from "$/RangeInput.svelte";
  import Collapsible from "$/Collapsible.svelte";
  import { FilterState } from "./filter-state.svelte.ts";

  let {
    filter = $bindable(),
    items,
  }: { filter: ((item: Media) => boolean) | undefined; items: Media[] } =
    $props();

  const fs = new FilterState();

  $effect(() => {
    fs.setItems(items);
  });
  $effect(() => {
    filter = fs.predicate;
  });

  const has_active = $derived(
    fs.active_count > 0 || !!fs.title_query.trim() || !!fs.episode_query.trim(),
  );
  let expanded = $state(false);

  // Template only needs string-level access; type safety is enforced by FilterState internals.
  type ChipSection = {
    key: string;
    label: string;
    options: string[];
    selected: Set<string>;
    toggle: (v: string) => void;
  };

  const chip_sections = $derived<ChipSection[]>([
    {
      key: "status",
      label: "Status",
      options: fs.status_options,
      selected: fs.statuses as Set<string>,
      toggle: (v) =>
        (fs.statuses = fs.toggleChip(
          fs.statuses,
          v as import("$/types.d.ts").Status,
          "status",
        )),
    },
    {
      key: "genre",
      label: "Genre",
      options: fs.available_genres,
      selected: fs.genres,
      toggle: (v) => (fs.genres = fs.toggleChip(fs.genres, v, "genre")),
    },
    {
      key: "network",
      label: "Network",
      options: fs.available_networks,
      selected: fs.networks,
      toggle: (v) => (fs.networks = fs.toggleChip(fs.networks, v, "network")),
    },
    {
      key: "language",
      label: "Language",
      options: fs.available_languages,
      selected: fs.languages,
      toggle: (v) =>
        (fs.languages = fs.toggleChip(fs.languages, v, "language")),
    },
  ]);
</script>

<div class="sb">
  <div class="sb-top">
    <input
      class="sb-input"
      type="text"
      placeholder="Search title…"
      bind:value={fs.title_query}
    />
    <input
      class="sb-input sb-input--sm"
      type="text"
      placeholder="Episode name…"
      bind:value={fs.episode_query}
    />

    <div class="sb-pills">
      {#each ["tv", "movie"] as const as t}
        <button
          class="pill"
          class:active={fs.media_type.has(t)}
          onclick={() => (fs.media_type = fs.toggleChip(fs.media_type, t, ""))}
        >
          {t === "tv" ? "TV" : "Movie"}
        </button>
      {/each}
    </div>

    <button
      class="sb-expand"
      class:active={expanded || fs.active_count > 0}
      onclick={() => (expanded = !expanded)}
    >
      Filters{fs.active_count > 0 ? ` (${fs.active_count})` : ""}
      <i class="sb-chevron" class:open={expanded}></i>
    </button>

    {#if has_active}
      <button class="sb-clear" onclick={() => fs.reset()}>Reset</button>
    {/if}
  </div>

  {#if fs.active_tags.length > 0}
    <div class="sb-tags">
      {#each fs.active_tags as tag}
        <button class="sb-tag" onclick={tag.clear}>{tag.label} ✕</button>
      {/each}
    </div>
  {/if}

  {#if expanded}
    <div class="sb-panel">
      <!-- -- Chip sections -- -->
      {#each chip_sections as section}
        {#if section.options.length > 0}
          <Collapsible
            open={fs.open_sections.has(section.key)}
            onclick={() => fs.toggleSection(section.key)}
          >
            {#snippet label()}
              <span class="sb-label">
                {section.label}{section.selected.size > 0
                  ? ` (${section.selected.size})`
                  : ""}
              </span>
            {/snippet}
            {#snippet children()}
              <div class="sb-chips">
                {#each section.options as opt}
                  <button
                    class="chip"
                    class:active={section.selected.has(opt)}
                    onclick={() => section.toggle(opt)}
                  >
                    {opt}
                  </button>
                {/each}
              </div>
            {/snippet}
          </Collapsible>
        {/if}
      {/each}

      <!-- -- Rating -- -->
      <Collapsible
        open={fs.open_sections.has("rating")}
        onclick={() => fs.toggleSection("rating")}
      >
        {#snippet label()}
          <span class="sb-label">
            Rating
            {#if fs.rating_open && fs.rating_non_trivial}
              <span class="sb-val"
                >{fs.rating_min.toFixed(1)}–{fs.rating_max.toFixed(1)}</span
              >
            {/if}
          </span>
        {/snippet}
        {#snippet children()}
          <RangeInput
            bind:min={fs.rating_min}
            bind:max={fs.rating_max}
            min_limit={0}
            max_limit={10}
            step={0.1}
            formatter={(v) => Number(v).toFixed(1)}
          />
          <label class="sb-check-row">
            <input type="checkbox" bind:checked={fs.rating_exclude_null} />
            <span>Exclude unrated</span>
          </label>
        {/snippet}
      </Collapsible>

      <!-- -- Runtime -- -->
      <Collapsible
        open={fs.open_sections.has("runtime")}
        onclick={() => fs.toggleSection("runtime")}
      >
        {#snippet label()}
          <span class="sb-label">
            Runtime
            {#if fs.runtime_open && fs.runtime_non_trivial}
              <span class="sb-val">{fs.runtime_min}–{fs.runtime_max}m</span>
            {/if}
          </span>
        {/snippet}
        {#snippet children()}
          {#if fs.runtime_max !== null}
            <RangeInput
              bind:min={fs.runtime_min}
              bind:max={fs.runtime_max}
              min_limit={0}
              max_limit={fs.runtime_limit_max}
              step={fs.runtime_step}
              formatter={(v) => `${Math.round(v)}m`}
            />
            <label class="sb-check-row">
              <input type="checkbox" bind:checked={fs.runtime_exclude_null} />
              <span>Exclude unknown runtime</span>
            </label>
          {/if}
        {/snippet}
      </Collapsible>

      <!-- -- Year -- -->
      <Collapsible
        open={fs.open_sections.has("year")}
        onclick={() => fs.toggleSection("year")}
      >
        {#snippet label()}
          <span class="sb-label">
            Year
            {#if fs.year_active}<span class="sb-val"
                >{fs.year_min}–{fs.year_max}</span
              >{/if}
          </span>
        {/snippet}
        {#snippet children()}
          {#if fs.year_min !== null && fs.year_max !== null}
            <RangeInput
              bind:min={fs.year_min}
              bind:max={fs.year_max}
              min_limit={fs.year_limit_min}
              max_limit={fs.year_limit_max}
              step={1}
              formatter={(v) => Math.round(v)}
            />
          {/if}
        {/snippet}
      </Collapsible>

      <!-- -- Episodes -- -->
      <Collapsible
        open={fs.open_sections.has("episodes")}
        onclick={() => fs.toggleSection("episodes")}
      >
        {#snippet label()}
          <span class="sb-label">
            Episodes
            {#if fs.upcoming_enabled || fs.recent_enabled || fs.no_next_enabled}<span
                class="sb-val">●</span
              >{/if}
          </span>
        {/snippet}
        {#snippet children()}
          <label class="sb-check-row" class:inactive={!fs.upcoming_enabled}>
            <input
              type="checkbox"
              bind:checked={fs.upcoming_enabled}
              onchange={() => {
                if (fs.upcoming_enabled) fs.openSection("episodes");
              }}
            />
            <span>Airing in next</span>
            <input
              class="sb-days"
              type="number"
              min="1"
              max="365"
              bind:value={fs.upcoming_days}
              disabled={!fs.upcoming_enabled}
            />
            <span>days</span>
          </label>
          <label class="sb-check-row" class:inactive={!fs.recent_enabled}>
            <input
              type="checkbox"
              bind:checked={fs.recent_enabled}
              onchange={() => {
                if (fs.recent_enabled) fs.openSection("episodes");
              }}
            />
            <span>Aired in last</span>
            <input
              class="sb-days"
              type="number"
              min="1"
              max="365"
              bind:value={fs.recent_days}
              disabled={!fs.recent_enabled}
            />
            <span>days</span>
          </label>
          <label class="sb-check-row" class:inactive={!fs.no_next_enabled}>
            <input
              type="checkbox"
              bind:checked={fs.no_next_enabled}
              onchange={() => {
                if (fs.no_next_enabled) fs.openSection("episodes");
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
    @apply flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs font-mono
           transition-colors px-2 py-1 border border-white/10 rounded whitespace-nowrap;
    &.active {
      @apply border-amber-400/30 text-amber-400/70;
    }
  }
  .sb-chevron {
    @apply text-[0.6rem] text-current transition-transform duration-200 inline-block;
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
    @apply bg-zinc-900 border border-white/10 text-white/40 text-xs font-mono px-2 py-0.5 rounded
           transition-colors cursor-pointer;
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
