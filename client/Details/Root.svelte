<script lang="ts">
  import type { Media, MediaDetails } from "$/types.d.ts";
  import { type Tab, formatDate, formatRuntime, formatMoney } from "./utils.ts";
  import Hero from "./Hero.svelte";
  import Episodes from "./Episodes.svelte";
  import Overview from "./Overview.svelte";
  import Cast from "./Cast.svelte";
  import MediaTab from "./Media.svelte";
  import More from "./More.svelte";

  type Props = {
    media: Media;
    details: MediaDetails;
    profile_id: string;
    in_list: boolean;
    onAdd: () => Promise<void>;
    onRemove: () => void;
    onToggleWatched: () => void;
    onclose: () => void;
  };
  let {
    media,
    details,
    profile_id,
    in_list,
    onAdd,
    onRemove,
    onToggleWatched,
    onclose,
  }: Props = $props();

  let active_tab = $state<Tab>("overview");
  let active_season_override = $state<number | null>(null);
  const active_season = $derived(
    active_season_override ?? details.seasons?.[0]?.season_number ?? 1,
  );

  import { onMount } from "svelte";
  let root_el = $state<HTMLElement | null>(null);
  let scrolled = $state(false);
  onMount(() => {
    const scroller = root_el?.parentElement;
    if (!scroller) return;
    const handler = () => {
      scrolled = scroller.scrollTop > 60;
    };
    scroller.addEventListener("scroll", handler, { passive: true });
    return () => scroller.removeEventListener("scroll", handler);
  });

  function setTab(t: Tab) {
    active_tab = t;
    root_el?.parentElement?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const tabs = $derived<Tab[]>(
    media.media_type === "tv"
      ? ["overview", "episodes", "cast", "media", "more"]
      : ["overview", "cast", "media", "more"],
  );

  const us_rating = $derived(
    details.content_ratings.find((r) => r.country === "US")?.rating ?? null,
  );
  const director = $derived(
    details.crew
      .filter((c) => c.job === "Director")
      .map((c) => c.name)
      .join(", ") || null,
  );
  const writers = $derived(
    details.crew
      .filter((c) =>
        ["Writer", "Screenplay", "Story", "Creator"].includes(c.job),
      )
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ") || null,
  );
  const trailer = $derived(
    details.videos.find((v) => v.type === "Trailer" && v.official) ??
      details.videos.find((v) => v.type === "Trailer") ??
      details.videos.find((v) => v.type === "Teaser") ??
      null,
  );
  const providers = $derived(details.watch_providers?.["US"] ?? null);

  const meta = $derived<[string, string | number][]>(
    media.media_type === "tv"
      ? [
          ["Status", media.status],
          ["Network", media.network ?? "—"],
          ["Premiered", formatDate(media.premiered)],
          ["Ended", media.status === "Ended" ? formatDate(media.ended) : "—"],
          ["Seasons", media.number_of_seasons ?? "—"],
          ["Episodes", media.number_of_episodes ?? "—"],
          ["Runtime", media.runtime ? `${media.runtime}m/ep` : "—"],
          ["Language", media.language.toUpperCase()],
          [
            "Created by",
            details.created_by.map((p) => p.name).join(", ") || "—",
          ],
          ["Writers", writers ?? "—"],
        ]
      : [
          ["Status", media.status],
          ["Released", formatDate(media.release_date)],
          ["Runtime", formatRuntime(media.runtime)],
          ["Language", media.language.toUpperCase()],
          ["Director", director ?? "—"],
          ["Writers", writers ?? "—"],
          ["Budget", formatMoney(details.budget)],
          ["Revenue", formatMoney(details.revenue)],
          ["Studio", details.production_companies?.[0]?.name ?? "—"],
        ],
  );
</script>

<div class="root" bind:this={root_el} role="region" aria-label="Media detail">
  <Hero {media} {us_rating} {onclose} {scrolled} />

  <div class="sheet">
    <div class="tab-bar" role="tablist" aria-label="Sections">
      {#each tabs as tab}
        <button
          class="tab"
          class:active={active_tab === tab}
          onclick={() => setTab(tab)}
          role="tab"
          aria-selected={active_tab === tab}>{tab}</button
        >
      {/each}
    </div>

    {#if active_tab === "overview"}
      <Overview
        {media}
        {details}
        {meta}
        {trailer}
        {providers}
        {profile_id}
        {in_list}
        {onAdd}
        {onRemove}
        {onToggleWatched}
      />
    {:else if active_tab === "episodes" && media.media_type === "tv"}
      <Episodes
        {details}
        {active_season}
        onSeasonChange={(n) => {
          active_season_override = n;
        }}
        {profile_id}
        media_id={media.id}
      />
    {:else if active_tab === "cast"}
      <Cast {details} />
    {:else if active_tab === "media"}
      <MediaTab {details} />
    {:else if active_tab === "more"}
      <More {media} {details} />
    {/if}
  </div>
</div>

<style lang="postcss">
  @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap");

  .root {
    --bg: #0b0b11;
    --sur: #111119;
    --sur2: #18182a;
    --b: rgba(255, 255, 255, 0.07);
    --b2: rgba(255, 255, 255, 0.13);
    --text: #e6e6f0;
    --muted: rgba(230, 230, 240, 0.48);
    --faint: rgba(230, 230, 240, 0.24);
    --acc: #b87fff;
    --acc2: #f5c542;
    --grn: #4ade80;
    --mono: "DM Mono", ui-monospace, monospace;
    --serif: "Instrument Serif", Georgia, serif;
    --sans: "DM Sans", system-ui, sans-serif;

    display: block;
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
  }

  .sheet {
    background: var(--bg);
    padding-bottom: env(safe-area-inset-bottom, 20px);
  }

  .tab-bar {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    background: var(--sur);
    border-bottom: 1px solid var(--b);
    position: sticky;
    top: 0;
    z-index: 30;
  }
  .tab-bar::-webkit-scrollbar {
    display: none;
  }

  .tab {
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 0.63rem;
    font-weight: 500;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--faint);
    padding: 0 20px;
    height: 46px;
    min-width: 60px;
    cursor: pointer;
    background: transparent;
    border: none;
    white-space: nowrap;
    position: relative;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .tab::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 2px;
    background: var(--acc);
    border-radius: 2px 2px 0 0;
    transform: scaleX(0);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .tab:hover:not(.active) {
    color: rgba(230, 230, 240, 0.55);
  }
  .tab.active {
    color: var(--acc);
  }
  .tab.active::after {
    transform: scaleX(1);
  }

  /* --- Shared child styles -------------------------------------------------
     These classes are used across Cast, Media, More, and Overview.
     Defined here as :global so child components can reference them without
     redeclaring. Source of truth is this file.
  ---------------------------------------------------------------------------- */
  :global(.block) {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  :global(.block-title) {
    margin: 0;
    font-family: var(--mono);
    font-size: 0.58rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--faint);
  }

  :global(.detail-grid) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--b);
    max-width: 540px;
  }
  @media (max-width: 360px) {
    :global(.detail-grid) {
      grid-template-columns: 1fr;
    }
  }
  :global(.detail-row) {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 11px 12px 11px 0;
    border-bottom: 1px solid var(--b);
  }
  :global(.detail-row dt) {
    font-family: var(--mono);
    font-size: 0.55rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--faint);
  }
  :global(.detail-row dd) {
    margin: 0;
    font-size: 0.82rem;
    color: rgba(230, 230, 240, 0.85);
  }

  :global(.h-scroll) {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
  }
  :global(.h-scroll::-webkit-scrollbar) {
    display: none;
  }

  :global(.rec-card) {
    flex-shrink: 0;
    width: 100px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    scroll-snap-align: start;
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  :global(.rec-img) {
    width: 100%;
    aspect-ratio: 2/3;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--b);
    background: var(--sur);
    transition: border-color 0.15s;
  }
  :global(.rec-card:hover .rec-img) {
    border-color: var(--acc);
  }
  :global(.rec-img img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  :global(.rec-name) {
    font-size: 0.67rem;
    color: var(--muted);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.15s;
  }
  :global(.rec-card:hover .rec-name) {
    color: var(--text);
  }
  :global(.rec-score) {
    font-family: var(--mono);
    font-size: 0.6rem;
    color: var(--acc2);
  }

  :global(.tags) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  :global(.tag) {
    font-size: 0.69rem;
    color: var(--muted);
    border: 1px solid var(--b);
    border-radius: 100px;
    padding: 4px 11px;
    white-space: nowrap;
    transition:
      border-color 0.14s,
      color 0.14s;
  }
  :global(.tag:hover) {
    border-color: var(--b2);
    color: var(--text);
  }

  :focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
    border-radius: 3px;
  }
</style>
