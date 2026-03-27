<script lang="ts">
  import type { MediaDetails } from "$/types.d.ts";

  type Props = { details: MediaDetails };
  let { details }: Props = $props();
</script>

<div class="content">
  {#if details.videos.length}
    <div class="block">
      <h2 class="block-title">Videos</h2>
      <div class="h-scroll">
        {#each details.videos.slice(0, 14) as v}
          <a
            href="https://www.youtube.com/watch?v={v.key}"
            target="_blank"
            rel="noopener"
            class="vid-card"
          >
            <div class="vid-thumb">
              <img
                src="https://img.youtube.com/vi/{v.key}/hqdefault.jpg"
                alt=""
                loading="lazy"
              />
              <span class="vid-play">▶</span>
            </div>
            <span class="vid-name">{v.name}</span>
            <span class="vid-type">{v.type}</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if details.images.backdrops.length}
    <div class="block">
      <h2 class="block-title">Backdrops</h2>
      <div class="h-scroll">
        {#each details.images.backdrops.slice(0, 14) as img}
          <a
            href={img.file_path}
            target="_blank"
            rel="noopener"
            class="img-wide"
          >
            <img src={img.file_path} alt="" loading="lazy" />
          </a>
        {/each}
      </div>
    </div>
  {/if}

  {#if details.images.posters.length}
    <div class="block">
      <h2 class="block-title">Posters</h2>
      <div class="h-scroll">
        {#each details.images.posters.slice(0, 14) as img}
          <a
            href={img.file_path}
            target="_blank"
            rel="noopener"
            class="img-poster"
          >
            <img src={img.file_path} alt="" loading="lazy" />
          </a>
        {/each}
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

  .vid-card {
    flex-shrink: 0;
    width: 188px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    text-decoration: none;
    scroll-snap-align: start;
    -webkit-tap-highlight-color: transparent;
  }
  .vid-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--b);
    background: var(--sur);
    transition: border-color 0.14s;
  }
  .vid-card:hover .vid-thumb {
    border-color: var(--acc);
  }
  .vid-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.58;
    transition: opacity 0.2s;
    display: block;
  }
  .vid-card:hover .vid-thumb img {
    opacity: 0.82;
  }
  .vid-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.48);
    font-size: 1rem;
  }
  .vid-name {
    font-size: 0.68rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vid-type {
    font-family: var(--mono);
    font-size: 0.54rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .img-wide {
    flex-shrink: 0;
    display: block;
    width: 210px;
    aspect-ratio: 16/9;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--b);
    scroll-snap-align: start;
    transition: border-color 0.14s;
    -webkit-tap-highlight-color: transparent;
  }
  .img-poster {
    flex-shrink: 0;
    display: block;
    width: 90px;
    aspect-ratio: 2/3;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--b);
    scroll-snap-align: start;
    transition: border-color 0.14s;
    -webkit-tap-highlight-color: transparent;
  }
  .img-wide:hover,
  .img-poster:hover {
    border-color: var(--b2);
  }
  .img-wide img,
  .img-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
