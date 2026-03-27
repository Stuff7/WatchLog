<script lang="ts">
  import type {
    Media,
    MediaDetails,
    WatchProviders,
    Video,
  } from "$/types.d.ts";
  import { FALLBACK_POSTER, formatDate, daysUntil, epLabel } from "./utils.ts";
  import ActionBar from "./ActionBar.svelte";

  type Props = {
    media: Media;
    details: MediaDetails;
    meta: [string, string | number][];
    trailer: Video | null;
    providers: WatchProviders["US"] | null;
    profile_id: string;
    in_list: boolean;
    onAdd: () => Promise<void>;
    onRemove: () => void;
    onToggleWatched: () => void;
  };
  let {
    media,
    details,
    meta,
    trailer,
    providers,
    profile_id,
    in_list,
    onAdd,
    onRemove,
    onToggleWatched,
  }: Props = $props();
</script>

<div class="content">
  <div class="top-row">
    <p class="overview-text">{media.overview}</p>
    <ActionBar {media} {in_list} {onAdd} {onRemove} {onToggleWatched} />
  </div>

  {#if media.next_episode}
    {@const days = daysUntil(media.next_episode.air_date)}
    <div class="next-ep">
      <div class="next-header">
        <span class="next-label">Next Episode</span>
        {#if days !== null && days >= 0}
          <span class="countdown">
            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`}
          </span>
        {/if}
      </div>
      <p class="next-name">{media.next_episode.name}</p>
      <p class="next-meta">
        {epLabel(media.next_episode.season, media.next_episode.episode)}
        {media.next_episode.air_date
          ? ` · ${formatDate(media.next_episode.air_date)}`
          : ""}
        {media.next_episode.runtime ? ` · ${media.next_episode.runtime}m` : ""}
      </p>
      {#if media.next_episode.overview}
        <p class="next-body">{media.next_episode.overview}</p>
      {/if}
    </div>
  {/if}

  {#if trailer}
    <div class="block">
      <h2 class="block-title">Trailer</h2>
      <a
        href="https://www.youtube.com/watch?v={trailer.key}"
        target="_blank"
        rel="noopener"
        class="trailer"
        aria-label="Play: {trailer.name}"
      >
        <img
          src="https://img.youtube.com/vi/{trailer.key}/maxresdefault.jpg"
          alt=""
          loading="lazy"
        />
        <div class="fog"></div>
        <div class="play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </div>
        <span class="trailer-label">{trailer.name}</span>
      </a>
    </div>
  {/if}

  <div class="block">
    <h2 class="block-title">Details</h2>
    <dl class="detail-grid">
      {#each meta as [k, v]}
        <div class="detail-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      {/each}
    </dl>
  </div>

  {#if providers}
    <div class="block">
      <h2 class="block-title">Watch (US)</h2>
      <div class="provider-list">
        {#each providers.flatrate ?? [] as p}
          <div class="provider">
            {#if p.logo}<img
                src={p.logo}
                alt={p.name}
                class="provider-logo"
              />{/if}
            <span>{p.name}</span><span class="badge">stream</span>
          </div>
        {/each}
        {#each (providers.rent ?? []).slice(0, 4) as p}
          <div class="provider provider--rent">
            <span>{p.name}</span><span class="badge">rent</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if details.recommendations.length}
    <div class="block recs-block">
      <h2 class="block-title">You Might Like</h2>
      <div class="recs-scroll">
        {#each details.recommendations.slice(0, 12) as r}
          <a
            class="rec-card"
            href="/{profile_id}/media/{r.tmdb_id}"
            aria-label={r.name}
          >
            <div class="rec-img">
              <img
                src={r.poster ?? FALLBACK_POSTER}
                alt={r.name}
                loading="lazy"
              />
            </div>
            <span class="rec-name">{r.name}</span>
            {#if r.rating}<span class="rec-score">★ {r.rating.toFixed(1)}</span
              >{/if}
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if details.keywords.length}
    <div class="block">
      <h2 class="block-title">Keywords</h2>
      <div class="tags">
        {#each details.keywords as kw}<span class="tag">{kw}</span>{/each}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .content {
    --pad: clamp(20px, 4vw, 40px);
    padding: var(--pad);
    display: flex;
    flex-direction: column;
    gap: 34px;
  }

  .top-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  .overview-text {
    margin: 0;
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.82;
    color: rgba(230, 230, 240, 0.78);
    max-width: 60ch;
  }

  .next-ep {
    border-left: 2px solid var(--grn);
    background: rgba(74, 222, 128, 0.04);
    padding: 13px 16px;
    border-radius: 0 6px 6px 0;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .next-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .next-label {
    font-family: var(--mono);
    font-size: 0.58rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--grn);
  }
  .countdown {
    font-family: var(--mono);
    font-size: 0.6rem;
    color: var(--grn);
    background: rgba(74, 222, 128, 0.1);
    padding: 2px 8px;
    border-radius: 100px;
  }
  .next-name {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
  }
  .next-meta {
    margin: 0;
    font-family: var(--mono);
    font-size: 0.66rem;
    color: var(--faint);
  }
  .next-body {
    margin: 0;
    font-size: 0.77rem;
    color: var(--muted);
    line-height: 1.55;
  }

  .trailer {
    position: relative;
    display: block;
    width: 100%;
    max-width: 390px;
    aspect-ratio: 16/9;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--b);
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
  }
  .trailer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0.5;
    transition:
      opacity 0.25s,
      transform 0.4s;
  }
  .trailer:hover img {
    opacity: 0.75;
    transform: scale(1.03);
  }
  .fog {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.72) 0%,
      transparent 55%
    );
  }
  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -65%);
    width: 52px;
    height: 52px;
    border-radius: 50%;
    padding-left: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.52);
    border: 1.5px solid rgba(255, 255, 255, 0.22);
    color: #fff;
    transition:
      background 0.18s,
      border-color 0.18s,
      transform 0.18s;
  }
  .trailer:hover .play-btn {
    background: rgba(184, 127, 255, 0.72);
    border-color: var(--acc);
    transform: translate(-50%, -65%) scale(1.1);
  }
  .trailer-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.72);
    padding: 8px 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .provider-list {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .provider {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.75rem;
    color: var(--muted);
    border: 1px solid var(--b);
    border-radius: 6px;
    padding: 7px 11px;
    background: var(--sur);
  }
  .provider--rent {
    background: transparent;
  }
  .provider-logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 3px;
  }
  .badge {
    font-family: var(--mono);
    font-size: 0.5rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 5px;
    border-radius: 2px;
  }

  .recs-block {
    margin-left: calc(-1 * var(--pad));
    margin-right: calc(-1 * var(--pad));
    padding-left: var(--pad);
  }
  .recs-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 2px var(--pad) 8px var(--pad);
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
  }
  .recs-scroll::-webkit-scrollbar {
    display: none;
  }
</style>
