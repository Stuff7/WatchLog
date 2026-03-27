<script lang="ts">
  import type { Media, MediaDetails } from "$/types.d.ts";

  type Props = { media: Media; details: MediaDetails };
  let { media, details }: Props = $props();

  const ext_links = $derived(
    (
      [
        [
          "IMDb",
          details.external_ids.imdb_id,
          details.external_ids.imdb_id
            ? `https://www.imdb.com/title/${details.external_ids.imdb_id}`
            : null,
        ],
        [
          "TVDB",
          String(details.external_ids.tvdb_id ?? ""),
          details.external_ids.tvdb_id
            ? `https://thetvdb.com/?id=${details.external_ids.tvdb_id}`
            : null,
        ],
        [
          "Wikidata",
          details.external_ids.wikidata_id,
          details.external_ids.wikidata_id
            ? `https://www.wikidata.org/wiki/${details.external_ids.wikidata_id}`
            : null,
        ],
        [
          "Twitter",
          details.external_ids.twitter_id,
          details.external_ids.twitter_id
            ? `https://twitter.com/${details.external_ids.twitter_id}`
            : null,
        ],
        [
          "Instagram",
          details.external_ids.instagram_id,
          details.external_ids.instagram_id
            ? `https://instagram.com/${details.external_ids.instagram_id}`
            : null,
        ],
      ] as [string, string | null, string | null][]
    ).filter((r): r is [string, string, string] => !!r[1] && !!r[2]),
  );
</script>

<div class="content">
  {#if details.content_ratings.length}
    <div class="block">
      <h2 class="block-title">Ratings by Country</h2>
      <div class="tags">
        {#each details.content_ratings.slice(0, 20) as r}
          <div class="rating-chip">
            <span class="rating-cc">{r.country}</span>
            <span class="rating-val">{r.rating}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if media.media_type === "movie" && details.collection}
    <div class="block">
      <h2 class="block-title">{details.collection.name}</h2>
      <div class="h-scroll">
        {#each details.collection.parts as p}
          <div class="rec-card">
            <div class="rec-img">
              <img src={p.poster} alt={p.name} loading="lazy" />
            </div>
            <span class="rec-name">{p.name}</span>
            <span class="rec-score">{p.premiered?.slice(0, 4) ?? "—"}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if media.media_type === "tv" && details.networks.length}
    <div class="block">
      <h2 class="block-title">Networks</h2>
      <div class="tags">
        {#each details.networks as n}
          <span class="tag">
            {#if n.logo}<img src={n.logo} alt={n.name} class="net-logo" />{/if}
            {n.name}<span class="net-cc">{n.origin_country}</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  {#if media.media_type === "movie" && details.production_companies?.length}
    <div class="block">
      <h2 class="block-title">Production</h2>
      <div class="tags">
        {#each details.production_companies as c}
          <span class="tag">{c.name}</span>
        {/each}
      </div>
    </div>
  {/if}

  <div class="block">
    <h2 class="block-title">External Links</h2>
    <div class="ext-links">
      {#each ext_links as [label, val, url]}
        <a href={url} target="_blank" rel="noopener" class="ext-link">
          <span class="ext-label">{label}</span>
          <span class="ext-arr">↗</span>
          <span class="ext-val">{val}</span>
        </a>
      {/each}
    </div>
  </div>

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
    padding: clamp(20px, 4vw, 40px);
    max-width: 820px;
    display: flex;
    flex-direction: column;
    gap: 34px;
  }

  .rating-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--b);
    border-radius: 5px;
    padding: 5px 9px;
  }
  .rating-cc {
    font-family: var(--mono);
    font-size: 0.54rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .rating-val {
    font-size: 0.74rem;
    font-weight: 500;
    color: rgba(230, 230, 240, 0.82);
  }

  .net-logo {
    height: 0.85rem;
    object-fit: contain;
    vertical-align: middle;
    margin-right: 0.3rem;
  }
  .net-cc {
    opacity: 0.35;
    margin-left: 0.25rem;
  }

  .ext-links {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--b);
    max-width: 360px;
  }
  .ext-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid var(--b);
    text-decoration: none;
    min-height: 44px;
    transition: opacity 0.14s;
    -webkit-tap-highlight-color: transparent;
  }
  .ext-link:hover {
    opacity: 0.68;
  }
  .ext-label {
    font-family: var(--mono);
    font-size: 0.58rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
    width: 64px;
    flex-shrink: 0;
  }
  .ext-arr {
    color: var(--faint);
    font-size: 0.72rem;
    flex-shrink: 0;
  }
  .ext-val {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--acc);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
</style>
