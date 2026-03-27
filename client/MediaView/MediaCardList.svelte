<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import EpisodeInfo from "./EpisodeInfo.svelte";
  import { statusColor, stars } from "./media-utils.ts";

  type Props = {
    media: Media;
    href: string | null;
    selected: boolean;
    onRemove?: () => void;
    onSelect?: () => void;
  };

  let { media, href, selected, onRemove, onSelect }: Props = $props();

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

<article class="media-row" aria-label={media.name}>
  <div class="row-thumb">
    {#if onSelect}
      <button
        class="select-btn"
        class:selected
        onclick={onSelect}
        aria-label={selected ? "Deselect" : "Select"}
        aria-pressed={selected}
      >
        <span class="checkbox-box" aria-hidden="true">
          {#if selected}
            <i></i>
          {/if}
        </span>
      </button>
    {/if}
    <img src={media.poster} alt="" loading="lazy" />
  </div>

  <div class="row-title-col">
    <a {href} class="row-title">
      {media.name}
      {#if media.watched}
        <span class="watched" aria-label="Watched">✓</span>
      {/if}
    </a>
    <div class="row-sub">
      {#each genres.slice(0, 2) as g}
        <span class="genre-chip">{g}</span>
      {/each}
      {#if media.media_type === "tv" && media.number_of_seasons}
        <span class="row-counts"
          >{media.number_of_seasons}S · {media.number_of_episodes ??
            "?"}EP</span
        >
      {/if}
      {#if media.tagline}
        <span class="row-tagline">{media.tagline}</span>
      {/if}
    </div>
  </div>

  <div
    class="stars-row px-3"
    aria-label={`Rating: ${media.rating ?? "unrated"}`}
  >
    {@render starsRow()}
  </div>

  <div class="row-status">
    <span
      class="status-dot"
      style="background:{color};box-shadow:0 0 5px {color}60"
      aria-hidden="true"
    ></span>
    <span style="color:{color}">{media.status}</span>
  </div>

  <div class="row-ep">
    <EpisodeInfo {media} compact={true} />
  </div>

  <div class="row-actions-col">
    {#if href}
      <a {href} class="details-link" aria-label="View details for {media.name}"
        >Details →</a
      >
    {/if}
    {#if onRemove}
      <button
        class="remove-btn"
        aria-label="Remove {media.name}"
        onclick={onRemove}>Remove</button
      >
    {/if}
  </div>
</article>

<style lang="postcss">
  .media-row {
    @apply contents;
  }

  .row-thumb {
    @apply overflow-hidden bg-white/5 self-stretch shrink-0 flex;
    img {
      @apply w-full h-full object-cover object-top;
    }
  }

  .row-title-col {
    @apply flex flex-col justify-center gap-1 min-w-0 px-3 py-2;

    .row-title {
      @apply text-sm font-medium text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis
             tracking-tight no-underline hover:text-white transition-colors duration-150;
      &:focus-visible {
        @apply outline outline-2 outline-amber-400 outline-offset-2 rounded-sm;
      }
    }
    .row-sub {
      @apply flex items-center gap-1.5 overflow-hidden;
      flex-wrap: nowrap;
    }
    .row-counts {
      @apply font-mono text-white/35 text-xs;
    }
    .row-tagline {
      @apply italic text-white/25 text-xs whitespace-nowrap overflow-hidden text-ellipsis hidden xl:block;
    }
  }

  .watched {
    @apply font-mono text-xs text-emerald-400;
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

  .row-status {
    @apply flex items-center gap-1.5 shrink-0 px-3 py-2 font-mono uppercase text-white/40 text-xs tracking-[0.08em];
  }

  .status-dot {
    @apply w-1.5 h-1.5 rounded-full shrink-0;
  }

  .row-ep {
    @apply flex flex-col justify-center min-w-0 px-3 py-2 gap-0.5;
  }

  .row-actions-col {
    @apply flex flex-col items-stretch justify-center gap-px self-stretch shrink-0;
  }

  .details-link {
    @apply font-mono text-[0.65rem] text-white/40 no-underline tracking-widest uppercase
           px-3 flex-1 flex items-center justify-center border-b border-white/[0.06]
           transition-colors duration-150 whitespace-nowrap;
    &:hover {
      @apply text-amber-400 bg-amber-400/5;
    }
    &:focus-visible {
      @apply outline outline-2 outline-amber-400 outline-offset-[-2px];
    }
  }

  .remove-btn {
    @apply font-mono text-[0.65rem] tracking-widest uppercase cursor-pointer leading-none
           px-3 flex-1 flex items-center justify-center
           transition-all duration-150 text-white/20 bg-transparent border-none;
    &:hover {
      @apply text-red-400 bg-red-500/10;
    }
    &:focus-visible {
      @apply outline outline-2 outline-red-400 outline-offset-[-2px];
    }
  }

  .genre-chip {
    @apply font-mono text-white/35 text-[0.65rem] border border-white/10 bg-white/[0.04]
           px-1 py-0 tracking-wider shrink-0 whitespace-nowrap;
  }

  .select-btn {
    @apply w-8 self-stretch flex items-center justify-center shrink-0
           border-none bg-transparent cursor-pointer transition-colors duration-150;
    &:focus-visible {
      @apply outline outline-2 outline-amber-400 outline-offset-1;
    }
    .checkbox-box {
      @apply w-4 h-4 rounded border-2 border-white/20 flex items-center justify-center
             transition-all duration-150 text-zinc-900;
    }
    &.selected .checkbox-box {
      @apply bg-amber-400 border-amber-400;
    }
    &:hover:not(.selected) .checkbox-box {
      @apply border-white/50;
    }
  }
</style>
