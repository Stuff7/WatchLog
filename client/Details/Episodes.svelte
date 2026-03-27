<script lang="ts">
  import type { MediaDetails } from "$/types.d.ts";
  import { epLabel, formatDate } from "./utils.ts";
  import * as api from "$/api.ts";

  type Props = {
    details: MediaDetails;
    active_season: number;
    onSeasonChange: (n: number) => void;
    profile_id: string;
    media_id: string;
  };
  let { details, active_season, onSeasonChange, profile_id, media_id }: Props =
    $props();

  let progress = $state<Record<string, boolean>>({});
  let progress_loaded = $state(false);

  function epKey(season: number, episode: number) {
    return `${season}:${episode}`;
  }

  $effect(() => {
    if (progress_loaded) return;
    api.getProgress(profile_id, media_id).then((data) => {
      const map: Record<string, boolean> = {};
      for (const item of data)
        map[epKey(item.season_number, item.episode_number)] = item.watched;
      progress = map;
      progress_loaded = true;
    });
  });

  function toggleEpisode(ep: {
    id: number;
    season_number: number;
    episode_number: number;
    name: string;
    air_date?: string | null;
    runtime?: number | null;
    still?: string | null;
  }) {
    const key = epKey(ep.season_number, ep.episode_number);
    const next = !progress[key];
    progress[key] = next;

    api
      .updateEpisodeWatched(profile_id, ep.id, {
        media_id,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        name: ep.name,
        air_date: ep.air_date ?? null,
        runtime: ep.runtime ?? null,
        still: ep.still ?? null,
        watched: next,
      })
      .catch(() => {
        progress[key] = !next;
      });
  }

  let expanded_episode = $state<number | null>(null);
  const current_season = $derived(
    details.seasons.find((s) => s.season_number === active_season) ?? null,
  );

  const season_progress = $derived.by(() => {
    if (!current_season) return null;
    const total = current_season.episodes.length;
    if (total === 0) return null;
    const watched = current_season.episodes.filter(
      (ep) => progress[epKey(ep.season_number, ep.episode_number)],
    ).length;
    return { watched, total };
  });
</script>

<div class="season-bar" role="tablist" aria-label="Season">
  {#each details.seasons as s}
    <button
      class="season-btn"
      class:active={active_season === s.season_number}
      onclick={() => {
        onSeasonChange(s.season_number);
        expanded_episode = null;
      }}
      role="tab"
      aria-selected={active_season === s.season_number}
    >
      {s.name === `Season ${s.season_number}` ? `S${s.season_number}` : s.name}
      <span class="season-count">{s.episode_count}</span>
    </button>
  {/each}
</div>

{#if current_season?.overview}
  <p class="season-blurb">{current_season.overview}</p>
{/if}

{#if current_season}
  {#if season_progress}
    <div class="season-progress">
      <div class="season-progress-bar">
        <div
          class="season-progress-fill"
          style="width: {(season_progress.watched / season_progress.total) *
            100}%"
        ></div>
      </div>
      <span class="season-progress-label"
        >{season_progress.watched} / {season_progress.total}</span
      >
    </div>
  {/if}

  {#each current_season.episodes as ep}
    {@const key = epKey(ep.season_number, ep.episode_number)}
    <article
      class="ep"
      class:ep--open={expanded_episode === ep.id}
      class:ep--watched={progress[key]}
    >
      <div class="ep-row">
        <button
          class="ep-watch"
          class:watched={progress[key]}
          onclick={() => toggleEpisode(ep)}
          aria-label={progress[key] ? "Mark unwatched" : "Mark watched"}
          title={progress[key] ? "Mark unwatched" : "Mark watched"}
        >
          {#if progress[key]}
            <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
              <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </button>
        <button
          class="ep-expand-btn"
          onclick={() =>
            (expanded_episode = expanded_episode === ep.id ? null : ep.id)}
          aria-expanded={expanded_episode === ep.id}
        >
          <div class="ep-still">
            {#if ep.still}
              <img src={ep.still} alt="" loading="lazy" />
            {:else}
              <span class="ep-still-code"
                >{epLabel(ep.season_number, ep.episode_number)}</span
              >
            {/if}
          </div>
          <div class="ep-info">
            <div class="ep-top">
              <span class="ep-code"
                >{epLabel(ep.season_number, ep.episode_number)}</span
              >
              {#if ep.rating}<span class="ep-score"
                  >★ {ep.rating.toFixed(1)}</span
                >{/if}
            </div>
            <p class="ep-name">{ep.name}</p>
            <div class="ep-sub">
              {#if ep.air_date}<span>{formatDate(ep.air_date)}</span>{/if}
              {#if ep.runtime}<span class="sep">·</span><span
                  >{ep.runtime}m</span
                >{/if}
            </div>
          </div>
          <span class="ep-toggle" aria-hidden="true"
            >{expanded_episode === ep.id ? "−" : "+"}</span
          >
        </button>
      </div>
      {#if expanded_episode === ep.id}
        <div class="ep-expand">
          {#if ep.overview}<p class="ep-body">{ep.overview}</p>{/if}
          <div class="ep-creds">
            {#if ep.directors.length}<p>
                <b>Dir.</b>{ep.directors.join(", ")}
              </p>{/if}
            {#if ep.writers.length}<p>
                <b>Writ.</b>{ep.writers.join(", ")}
              </p>{/if}
            {#if ep.guest_stars.length}
              <p>
                <b>Guests</b>{ep.guest_stars
                  .slice(0, 5)
                  .map((g) => `${g.name} as ${g.character}`)
                  .join(", ")}
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </article>
  {/each}
{/if}

<style lang="postcss">
  .season-bar {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    background: var(--sur);
    border-bottom: 1px solid var(--b);
    padding: 0 clamp(14px, 3vw, 22px);
  }
  .season-bar::-webkit-scrollbar {
    display: none;
  }

  .season-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
    padding: 0 14px;
    height: 44px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition:
      color 0.14s,
      border-color 0.14s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .season-btn:hover {
    color: rgba(230, 230, 240, 0.6);
  }
  .season-btn.active {
    color: var(--acc);
    border-bottom-color: var(--acc);
  }
  .season-count {
    color: var(--faint);
    font-size: 0.56rem;
  }

  .season-blurb {
    margin: 0;
    font-size: 0.79rem;
    color: var(--muted);
    line-height: 1.6;
    padding: 12px clamp(16px, 4vw, 28px);
    border-bottom: 1px solid var(--b);
    background: rgba(255, 255, 255, 0.01);
  }

  .season-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px clamp(16px, 4vw, 28px);
    border-bottom: 1px solid var(--b);
  }
  .season-progress-bar {
    flex: 1;
    height: 2px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 2px;
    overflow: hidden;
  }
  .season-progress-fill {
    height: 100%;
    background: var(--grn);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .season-progress-label {
    font-family: var(--mono);
    font-size: 0.58rem;
    color: var(--faint);
    white-space: nowrap;
  }

  .ep {
    border-bottom: 1px solid var(--b);
  }
  .ep--open {
    background: rgba(255, 255, 255, 0.018);
  }
  .ep--watched {
    opacity: 0.5;
  }
  .ep--watched:hover {
    opacity: 0.75;
  }

  .ep-row {
    display: flex;
    align-items: center;
  }

  .ep-watch {
    flex-shrink: 0;
    width: 48px;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-right: 1px solid var(--b);
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .ep-watch:hover {
    background: rgba(74, 222, 128, 0.06);
  }
  .ep-watch::before {
    content: "";
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition:
      border-color 0.15s,
      background 0.15s;
    flex-shrink: 0;
  }
  .ep-watch:hover::before {
    border-color: var(--grn);
    background: rgba(74, 222, 128, 0.1);
  }
  .ep-watch.watched::before {
    display: none;
  }
  .ep-watch.watched {
    color: var(--grn);
    background: rgba(74, 222, 128, 0.06);
    border-right-color: rgba(74, 222, 128, 0.2);
  }
  .ep-watch svg {
    display: block;
    width: 16px;
    height: 16px;
  }

  .ep-expand-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: clamp(11px, 2.5vw, 17px);
    padding: 13px clamp(16px, 4vw, 28px) 13px 0;
    cursor: pointer;
    background: transparent;
    border: none;
    text-align: left;
    transition: background 0.11s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    min-height: 56px;
  }
  .ep-expand-btn:hover {
    background: rgba(255, 255, 255, 0.022);
  }

  .ep-still {
    flex-shrink: 0;
    width: clamp(84px, 19vw, 112px);
    aspect-ratio: 16/9;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid var(--b);
    background: var(--sur);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ep-still img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ep-still-code {
    font-family: var(--mono);
    font-size: 0.56rem;
    color: var(--faint);
  }

  .ep-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ep-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ep-code {
    font-family: var(--mono);
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    color: var(--faint);
  }
  .ep-score {
    font-family: var(--mono);
    font-size: 0.6rem;
    color: var(--acc2);
    flex-shrink: 0;
  }
  .ep-name {
    margin: 0;
    font-size: 0.84rem;
    font-weight: 500;
    color: var(--text);
    line-height: 1.3;
  }
  .ep-sub {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.69rem;
    color: var(--faint);
  }
  .sep {
    color: var(--b2);
  }
  .ep-toggle {
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 0.95rem;
    color: var(--faint);
    width: 22px;
    text-align: center;
  }

  .ep-expand {
    padding: 0 clamp(16px, 4vw, 28px) 14px;
    padding-left: calc(
      36px + clamp(84px, 19vw, 112px) + clamp(11px, 2.5vw, 17px)
    );
    display: flex;
    flex-direction: column;
    gap: 7px;
    animation: fadeDown 0.17s ease;
  }
  @keyframes fadeDown {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .ep-body {
    margin: 0;
    font-size: 0.79rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .ep-creds {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ep-creds p {
    margin: 0;
    font-size: 0.69rem;
    color: var(--muted);
  }
  .ep-creds b {
    font-family: var(--mono);
    font-size: 0.56rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
    margin-right: 7px;
    font-weight: 500;
  }
</style>
