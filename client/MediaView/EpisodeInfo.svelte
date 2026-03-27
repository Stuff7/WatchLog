<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import {
    epLabel,
    formatDate,
    daysUntil,
    daysUntilLabel,
  } from "./media-utils.ts";

  type Props = { media: Media; compact: boolean };
  let { media, compact }: Props = $props();
</script>

{#if compact}
  <!-- List row layout -->
  {#if media.media_type === "tv"}
    {#if media.next_episode}
      {@const days = daysUntilLabel(media.next_episode.air_date)}
      <div class="ep-group">
        <div class="ep-line">
          <span class="ep-label next">Next</span>
          <span class="ep-line-code">{epLabel(media.next_episode)}</span>
          {#if days}
            <span class="ep-countdown">{days}</span>
          {:else if media.next_episode.air_date}
            <span class="ep-date"
              >{formatDate(media.next_episode.air_date)}</span
            >
          {/if}
        </div>
        <div class="ep-line-title">{media.next_episode.name}</div>
      </div>
    {:else}
      <div class="ep-group empty">
        <div class="ep-line">
          <span class="ep-label next">Next</span>
          <span class="ep-line-code">—</span>
        </div>
      </div>
    {/if}
    {#if media.last_episode}
      <div class="ep-group muted">
        <div class="ep-line">
          <span class="ep-label">Last</span>
          <span class="ep-line-code">{epLabel(media.last_episode)}</span>
          <span class="ep-date">{formatDate(media.last_episode.air_date)}</span>
        </div>
        <div class="ep-line-title">{media.last_episode.name}</div>
      </div>
    {:else}
      <div class="ep-group empty muted">
        <div class="ep-line">
          <span class="ep-label">Last</span>
          <span class="ep-line-code">—</span>
        </div>
      </div>
    {/if}
  {:else if media.release_date}
    {@const days = daysUntil(media.release_date)}
    <div class="ep-line">
      <span class="ep-label"
        >{days !== null && days > 0 ? "Out" : "Released"}</span
      >
      <span
        class:ep-countdown={days !== null && days > 0}
        class:ep-date={!(days !== null && days > 0)}
      >
        {days !== null && days > 0
          ? daysUntilLabel(media.release_date)
          : formatDate(media.release_date)}
      </span>
      {#if media.runtime}<span class="ep-date">{media.runtime}m</span>{/if}
    </div>
  {/if}
{:else}
  <!-- Grid card layout -->
  {#if media.media_type === "tv"}
    {#if media.next_episode}
      {@const days = daysUntilLabel(media.next_episode.air_date)}
      <div class="ep-block next">
        <div class="ep-header">
          <span class="ep-label next">Next</span>
          {#if days}
            <span class="ep-countdown">{days}</span>
          {:else if media.next_episode.air_date}
            <span class="ep-date"
              >{formatDate(media.next_episode.air_date)}</span
            >
          {/if}
        </div>
        <p class="ep-name">{media.next_episode.name}</p>
        <p class="ep-code">
          {epLabel(media.next_episode)}{media.next_episode.runtime
            ? ` · ${media.next_episode.runtime}m`
            : ""}
        </p>
      </div>
    {:else}
      <div class="ep-block next empty">
        <div class="ep-header"><span class="ep-label next">Next</span></div>
        <p class="ep-name">—</p>
        <p class="ep-code">No upcoming episode</p>
      </div>
    {/if}
    {#if media.last_episode}
      <div class="ep-block last">
        <div class="ep-header">
          <span class="ep-label">Last</span>
          <span class="ep-date">{formatDate(media.last_episode.air_date)}</span>
        </div>
        <p class="ep-name muted">{media.last_episode.name}</p>
        <p class="ep-code">
          {epLabel(media.last_episode)}{media.last_episode.runtime
            ? ` · ${media.last_episode.runtime}m`
            : ""}
        </p>
      </div>
    {:else}
      <div class="ep-block last empty">
        <div class="ep-header"><span class="ep-label">Last</span></div>
        <p class="ep-name muted">—</p>
        <p class="ep-code">No episode data</p>
      </div>
    {/if}
  {:else if media.release_date}
    {@const days = daysUntil(media.release_date)}
    <div class="ep-block release">
      <div class="ep-header">
        <span class="ep-label">Released</span>
        {#if days !== null && days > 0}
          <span class="ep-countdown">{daysUntilLabel(media.release_date)}</span>
        {:else}
          <span class="ep-date">{formatDate(media.release_date)}</span>
        {/if}
      </div>
      {#if media.runtime}<p class="ep-code">{media.runtime}m runtime</p>{/if}
    </div>
  {/if}
{/if}

<style lang="postcss">
  /* -- Grid blocks ----------------------------------------------------------- */
  .ep-block {
    @apply flex flex-col gap-0.5 py-1.5;
    &.next {
      @apply border-b border-white/[0.06] pb-2 mb-1;
    }
    &.last {
      @apply opacity-55;
    }
    &.empty {
      @apply opacity-25;
    }

    .ep-header {
      @apply flex items-center justify-between;
    }
    .ep-name {
      @apply text-xs font-medium text-zinc-300 m-0 whitespace-nowrap overflow-hidden text-ellipsis;
      &.muted {
        @apply text-white/35 font-normal;
      }
    }
    .ep-code {
      @apply font-mono text-white/35 text-xs;
    }
  }

  /* -- List lines ------------------------------------------------------------ */
  .ep-group {
    @apply flex flex-col mb-2 last:mb-0;
    &.muted {
      @apply opacity-55;
    }
    &.empty {
      @apply opacity-25;
    }
  }

  .ep-line {
    @apply font-mono text-xs;
    display: grid;
    grid-template-columns: 2.75rem 4rem 1fr;
    align-items: center;
    gap: 0.25rem;

    .ep-line-code {
      @apply text-white/55 whitespace-nowrap;
    }
  }

  .ep-line-title {
    @apply text-xs text-white/40 whitespace-nowrap overflow-hidden text-ellipsis;
    padding-left: calc(2.75rem + 0.25rem);
    line-height: 1.5;
  }

  /* -- Shared ---------------------------------------------------------------- */
  .ep-label {
    @apply font-mono text-white/30 text-xs uppercase tracking-wider;
    &.next {
      @apply text-emerald-400/70;
    }
  }

  .ep-countdown {
    @apply font-mono text-xs text-amber-400 text-right whitespace-nowrap;
  }
  .ep-date {
    @apply font-mono text-xs text-white/35 text-right whitespace-nowrap;
  }
</style>
