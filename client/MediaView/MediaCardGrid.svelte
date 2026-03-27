<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import EpisodeInfo from "./EpisodeInfo.svelte";
  import { statusColor, stars } from "./media-utils.ts";
  import type { RefreshStatus } from "./media-utils.ts";

  type Props = {
    media: Media;
    href: string | null;
    index: number;
    selected: boolean;
    refresh_status: RefreshStatus;
    onRemove?: () => void;
    onSelect?: () => void;
  };

  let {
    media,
    href,
    index,
    selected,
    refresh_status,
    onRemove,
    onSelect,
  }: Props = $props();

  const color = $derived(statusColor(media.status));
  const genres = $derived(media.genres ?? []);
</script>

{#snippet starsRow()}
  {#each Array(5) as _, s}
    <span class:lit={s < stars(media.rating)}>★</span>
  {/each}
  {#if media.rating}
    <span class="rating-val">{media.rating.toFixed(1)}</span>
  {/if}
{/snippet}

<article class="card" aria-label={media.name}>
  <div
    class="accent-stripe"
    style="background:{color}"
    aria-hidden="true"
  ></div>

  <div class="poster">
    <!-- Full-card link sits under everything via z-index; buttons sit above it -->
    {#if href}
      <a {href} class="card-link" tabindex="0" aria-label={media.name}></a>
    {/if}

    <img src={media.poster} alt="" loading="lazy" />
    <div class="poster-fade" aria-hidden="true"></div>

    <!-- Controls layer: select button top-left only -->
    <div class="poster-controls" aria-hidden="false">
      {#if onSelect}
        <button
          class="select-btn"
          class:selected
          onclick={onSelect}
          aria-label={selected
            ? `Deselect ${media.name}`
            : `Select ${media.name}`}
          aria-pressed={selected}
        >
          <span class="checkbox-box" aria-hidden="true">
            {#if selected}
              <i></i>
            {/if}
          </span>
        </button>
      {/if}
    </div>

    <!-- Meta layer: type badge top-right, refresh badge below it, rank bottom-left, watched bottom-left -->
    <div class="poster-meta" aria-hidden="true">
      <span class="rank">#{index + 1}</span>
      <span class="type-badge" class:film={media.media_type === "movie"}>
        {media.media_type === "movie" ? "Film" : "Series"}
      </span>
      {#if media.watched}
        <span class="watched-badge" aria-label="Watched">✓</span>
      {/if}
      {#if refresh_status !== "idle"}
        <span
          class="refresh-badge"
          class:badge-pending={refresh_status === "pending"}
          class:badge-updating={refresh_status === "updating"}
          class:badge-changed={refresh_status === "changed"}
          class:badge-unchanged={refresh_status === "unchanged"}
          class:badge-error={refresh_status === "error"}
          aria-live="polite"
          aria-hidden="false"
        >
          {#if refresh_status === "updating"}
            <span class="spinner" aria-label="Updating"></span>
          {:else if refresh_status === "changed"}
            ●
          {:else if refresh_status === "unchanged"}
            ✓
          {:else if refresh_status === "error"}
            ✕
          {:else}
            ·
          {/if}
        </span>
      {/if}
    </div>

    <div class="poster-bottom">
      <h3 class="card-title">{media.name}</h3>
      {#if media.tagline}<p class="card-tagline">{media.tagline}</p>{/if}
    </div>
  </div>

  <div class="info">
    <div class="info-row">
      <span
        class="status-dot"
        style="background:{color};box-shadow:0 0 6px {color}"
        aria-hidden="true"
      ></span>
      <span class="status-text" style="color:{color}">{media.status}</span>
      <span class="info-year">{media.premiered?.slice(0, 4) ?? "—"}</span>
      {#if onRemove}
        <button
          class="remove-btn"
          aria-label="Remove {media.name}"
          onclick={onRemove}>✕</button
        >
      {/if}
    </div>

    <div class="info-row">
      <div
        class="stars-row"
        aria-label={`Rating: ${media.rating ?? "unrated"}`}
      >
        {@render starsRow()}
      </div>
      <div class="counts">
        {#if media.media_type === "tv" && media.number_of_seasons}
          <span
            >{media.number_of_seasons}S · {media.number_of_episodes ??
              "?"}EP</span
          >
        {:else if media.media_type === "movie" && media.runtime}
          <span>{media.runtime}m</span>
        {/if}
        {#if media.network}
          <span class="network">{media.network}</span>
        {/if}
      </div>
    </div>

    {#if genres.length}
      <div class="genres" aria-label="Genres">
        {#each genres.slice(0, 4) as g}
          <span class="genre-chip">{g}</span>
        {/each}
      </div>
    {/if}

    <div class="ep-section">
      <EpisodeInfo {media} compact={false} />
      {#if href}
        <a
          {href}
          class="details-link"
          aria-label="View details for {media.name}"
        >
          View details <span aria-hidden="true">→</span>
        </a>
      {/if}
    </div>
  </div>
</article>

<style lang="postcss">
  .card {
    @apply relative flex flex-col w-full overflow-hidden bg-zinc-950;

    &:hover {
      .poster img {
        transform: scale(1.05);
      }
      .accent-stripe {
        opacity: 1;
      }
    }
  }

  .accent-stripe {
    @apply absolute left-0 top-0 bottom-0 z-10 opacity-60 transition-opacity duration-300;
    width: 2px;
  }

  /* Full-card clickable link stretched over the poster */
  .card-link {
    @apply absolute inset-0 z-10;
    &:focus-visible {
      @apply outline outline-2 outline-amber-400 outline-offset-[-2px];
    }
  }

  .poster {
    @apply relative w-full overflow-hidden bg-zinc-900 shrink-0;
    aspect-ratio: 3 / 4;

    img {
      @apply w-full h-full object-cover transition-transform duration-500;
    }

    .poster-fade {
      @apply absolute inset-0 z-10;
      background: linear-gradient(
        to top,
        rgb(9 9 11) 0%,
        rgb(9 9 11 / 0.85) 18%,
        rgb(9 9 11 / 0.3) 40%,
        transparent 60%
      );
    }

    /* All decorative/status overlays */
    .poster-meta {
      @apply absolute inset-2 z-30 pointer-events-none;

      .rank {
        @apply absolute bottom-10 left-0 font-mono text-white/50 text-xs bg-black/60 px-1.5 py-0.5 tracking-wider;
      }
      .type-badge {
        @apply absolute top-0 right-0 font-mono uppercase text-amber-400 border border-amber-500/30
               bg-black/70 text-xs tracking-widest px-2 py-0.5;
        &.film {
          @apply text-sky-400 border-sky-400/25;
        }
      }
      .watched-badge {
        @apply absolute bottom-10 left-8 font-mono text-xs leading-none px-1.5 py-0.5
               bg-black/70 border border-emerald-500/40 text-emerald-400;
      }
      .refresh-badge {
        @apply absolute top-7 right-0;
      }
    }

    /* Select button — top-left only, clear of type badge */
    .poster-controls {
      @apply absolute top-2 left-2 z-30 pointer-events-none;
      > * {
        @apply pointer-events-auto;
      }
    }

    .poster-bottom {
      @apply absolute bottom-0 inset-x-0 px-3 pb-2.5 z-20 flex flex-col gap-0.5;

      .card-title {
        @apply text-sm font-semibold text-zinc-100 tracking-tight m-0 leading-snug;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .card-tagline {
        @apply text-xs italic text-white/40 m-0 leading-snug;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .info {
    @apply flex flex-col px-3 pt-2.5 pb-2 gap-2 flex-1;

    .info-row {
      @apply flex items-center gap-2 shrink-0;

      .status-text {
        @apply font-mono uppercase text-xs tracking-wider shrink-0 flex-1 min-w-0
               overflow-hidden text-ellipsis whitespace-nowrap;
      }
      .info-year {
        @apply font-mono text-white/30 text-xs shrink-0;
      }
      .counts {
        @apply flex items-center gap-2 font-mono text-white/30 text-xs flex-1 min-w-0 justify-end;
        .network {
          @apply text-white/20 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap;
          max-width: 5rem;
        }
      }
    }

    .genres {
      @apply flex items-center gap-1 shrink-0 overflow-hidden;
      flex-wrap: nowrap;
    }

    .ep-section {
      @apply mt-auto border-t border-white/[0.06] pt-2 flex flex-col shrink-0;
    }
  }

  .status-dot {
    @apply w-1.5 h-1.5 rounded-full shrink-0;
  }

  .stars-row {
    @apply flex items-center gap-0.5;
    span {
      @apply text-white/20 text-xs;
    }
    span.lit {
      @apply text-amber-400;
    }
    .rating-val {
      @apply font-mono text-white/50 text-xs ml-1;
    }
  }

  .genre-chip {
    @apply font-mono text-white/35 text-xs border border-white/10 bg-white/[0.04]
           px-1.5 py-0.5 tracking-wider shrink-0 whitespace-nowrap;
  }

  .remove-btn {
    @apply font-mono text-xs cursor-pointer leading-none px-2 py-1 shrink-0
           transition-all duration-150 text-white/40 bg-white/[0.04] border border-white/10;
    &:hover {
      @apply text-red-400 bg-red-500/10 border-red-500/30;
    }
    &:focus-visible {
      @apply outline outline-2 outline-red-400 outline-offset-1;
    }
  }

  .select-btn {
    @apply w-6 h-6 flex items-center justify-center cursor-pointer
           transition-all duration-150 bg-transparent border-none p-0;
    .checkbox-box {
      @apply w-6 h-6 rounded-full border-2 border-white/30 bg-black/50
             flex items-center justify-center transition-all duration-150 text-zinc-900;
    }
    &.selected .checkbox-box {
      @apply border-amber-400 bg-amber-400;
    }
    &:hover:not(.selected) .checkbox-box {
      @apply border-white/70 bg-black/70;
    }
    &:focus-visible {
      @apply outline outline-2 outline-amber-400 outline-offset-1;
    }
  }

  .details-link {
    @apply font-mono text-xs text-white/30 no-underline tracking-wider
           mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1
           transition-colors duration-150;
    &:hover {
      @apply text-amber-400;
    }
    &:focus-visible {
      @apply outline outline-2 outline-amber-400 outline-offset-1 rounded-sm;
    }
  }

  .refresh-badge {
    @apply font-mono text-xs px-1.5 py-0.5
           bg-black/70 border leading-none flex items-center gap-1;
    &.badge-pending {
      @apply text-white/30 border-white/10;
    }
    &.badge-updating {
      @apply text-amber-400 border-amber-400/30;
    }
    &.badge-changed {
      @apply text-amber-400 border-amber-400/40;
      animation: pulse 1.5s infinite;
    }
    &.badge-unchanged {
      @apply text-emerald-400 border-emerald-400/30;
    }
    &.badge-error {
      @apply text-red-400 border-red-400/30;
    }
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
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
