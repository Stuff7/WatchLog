<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import { formatRuntime, FALLBACK_POSTER } from "./utils.ts";

  type Props = {
    media: Media;
    us_rating: string | null;
    onclose: () => void;
    scrolled: boolean;
  };
  let { media, us_rating, onclose, scrolled }: Props = $props();
</script>

<!-- STICKY CHROME -->
<div class="chrome" class:scrolled>
  <button class="back-btn" onclick={onclose} aria-label="Go back">
    <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
      <path
        d="M11 3.5L5.5 9L11 14.5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <span class="chrome-title">{media.name}</span>
  {#if media.rating}
    <span class="chrome-score">★ {media.rating.toFixed(1)}</span>
  {/if}
</div>

<!-- HERO -->
<div class="hero">
  {#if media.backdrop}
    <img src={media.backdrop} alt="" class="hero-img" />
  {/if}
  <div class="hero-fog"></div>

  <div class="hero-body">
    <div class="poster">
      <img src={media.poster ?? FALLBACK_POSTER} alt={media.name} />
      <div class="poster-shine"></div>
    </div>

    <div class="hero-text">
      <div class="chips-row">
        {#if us_rating}<span class="chip chip--dim">{us_rating}</span>{/if}
        <span class="chip chip--accent"
          >{media.media_type === "movie" ? "Film" : "Series"}</span
        >
        {#each (media.genres ?? []).slice(0, 2) as g}
          <span class="chip chip--ghost">{g}</span>
        {/each}
      </div>

      <h1 class="title">{media.name}</h1>
      {#if media.tagline}<p class="tagline">{media.tagline}</p>{/if}

      <div class="stats-row">
        {#if media.rating}
          <div class="stat">
            <span class="stat-val stat-val--gold"
              >★ {media.rating.toFixed(1)}</span
            >
            {#if media.vote_count}<span class="stat-sub"
                >{(media.vote_count / 1000).toFixed(0)}k</span
              >{/if}
          </div>
        {/if}
        <div class="stat">
          <span class="stat-val">
            {media.premiered?.slice(0, 4) ?? "—"}{media.ended &&
            media.status === "Ended"
              ? `–${media.ended.slice(0, 4)}`
              : ""}
          </span>
          <span class="stat-sub">year</span>
        </div>
        <div class="stat">
          <span class="stat-val">{formatRuntime(media.runtime)}</span>
          <span class="stat-sub">runtime</span>
        </div>
        {#if media.media_type === "tv" && media.number_of_seasons}
          <div class="stat">
            <span class="stat-val">{media.number_of_seasons}</span>
            <span class="stat-sub">seasons</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  /*
   * The chrome is now position: sticky so it participates in normal flow
   * and is always visible inside whatever scrolling container wraps this.
   * On scroll, it gains the frosted-glass background.
   */
  .chrome {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: env(safe-area-inset-top, 0);
    padding-left: 14px;
    padding-right: 16px;
    height: calc(50px + env(safe-area-inset-top, 0px));
    /* transparent by default — blends into hero backdrop */
    background: transparent;
    transition:
      background 0.22s,
      backdrop-filter 0.22s,
      border-color 0.22s;
    border-bottom: 1px solid transparent;
  }
  .chrome.scrolled {
    background: rgba(11, 11, 17, 0.9);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom-color: rgba(255, 255, 255, 0.07);
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(11, 11, 17, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.13);
    color: inherit;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background 0.14s,
      border-color 0.14s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    position: relative;
  }
  .back-btn::before {
    content: "";
    position: absolute;
    inset: -8px;
  }
  .back-btn:hover {
    background: rgba(184, 127, 255, 0.15);
    border-color: var(--acc);
  }
  .back-btn:active {
    opacity: 0.65;
  }

  .chrome-title {
    flex: 1;
    font-family: var(--serif);
    font-style: italic;
    font-size: 1rem;
    color: inherit;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(5px);
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
  .chrome.scrolled .chrome-title {
    opacity: 1;
    transform: none;
  }

  .chrome-score {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--acc2);
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
  }
  .chrome.scrolled .chrome-score {
    opacity: 1;
  }

  /*
   * Hero no longer needs top padding to compensate for the absolute chrome —
   * the sticky chrome is now in flow above it.
   */
  .hero {
    position: relative;
    min-height: clamp(200px, 44vw, 360px);
    overflow: hidden;
    background: #08080f;
    /* pull the hero up so it sits flush under the sticky chrome */
    margin-top: calc(-1 * (50px + env(safe-area-inset-top, 0px)));
  }
  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    filter: saturate(0.6) brightness(0.38);
  }
  .hero-fog {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom,
        rgba(11, 11, 17, 0) 15%,
        var(--bg) 100%
      ),
      linear-gradient(to right, rgba(11, 11, 17, 0.75) 0%, transparent 60%);
  }
  .hero-body {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-end;
    gap: clamp(14px, 3vw, 28px);
    padding: clamp(60px, 12vw, 100px) clamp(18px, 4.5vw, 44px) 12px;
  }

  .poster {
    position: relative;
    flex-shrink: 0;
    width: clamp(72px, 12vw, 124px);
    aspect-ratio: 2/3;
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.85),
      0 0 0 1px rgba(184, 127, 255, 0.12);
  }
  .poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .poster-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%
    );
    pointer-events: none;
  }

  .hero-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    font-family: var(--mono);
    font-size: 0.58rem;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 3px;
    line-height: 1;
  }
  .chip--dim {
    border: 1px solid rgba(255, 255, 255, 0.13);
    color: var(--muted);
  }
  .chip--accent {
    border: 1px solid rgba(184, 127, 255, 0.35);
    color: var(--acc);
    background: rgba(184, 127, 255, 0.07);
  }
  .chip--ghost {
    border: 1px solid rgba(255, 255, 255, 0.07);
    color: var(--faint);
  }

  .title {
    margin: 0;
    font-family: var(--serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(1.7rem, 5.5vw, 3.2rem);
    line-height: 1.04;
    letter-spacing: -0.01em;
    color: #fff;
    text-shadow: 0 2px 28px rgba(0, 0, 0, 0.6);
  }
  .tagline {
    margin: 0;
    font-size: 0.78rem;
    color: var(--muted);
    font-style: italic;
  }

  .stats-row {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    margin-top: 2px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .stat-val {
    font-family: var(--mono);
    font-size: 0.82rem;
    font-weight: 500;
    color: inherit;
    line-height: 1;
  }
  .stat-val--gold {
    color: var(--acc2);
  }
  .stat-sub {
    font-family: var(--mono);
    font-size: 0.54rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--faint);
  }
</style>
