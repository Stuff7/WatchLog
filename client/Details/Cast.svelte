<script lang="ts">
  import type { MediaDetails } from "$/types.d.ts";
  import { FALLBACK_PERSON } from "./utils.ts";

  type Props = { details: MediaDetails };
  let { details }: Props = $props();

  const CREW_JOBS = [
    "Director",
    "Screenplay",
    "Writer",
    "Creator",
    "Producer",
    "Executive Producer",
    "Director of Photography",
    "Original Music Composer",
  ];
  const key_crew = $derived(
    details.crew.filter((c) => CREW_JOBS.includes(c.job)).slice(0, 16),
  );
</script>

<div class="content">
  <div class="block">
    <h2 class="block-title">Cast</h2>
    <div class="cast-grid">
      {#each details.cast.slice(0, 24) as m}
        <div class="cast-card">
          <div class="cast-photo">
            <img
              src={m.profile_photo ?? FALLBACK_PERSON}
              alt={m.name}
              loading="lazy"
            />
          </div>
          <div class="cast-info">
            <span class="cast-name">{m.name}</span>
            <span class="cast-role">{m.character}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if key_crew.length}
    <div class="block">
      <h2 class="block-title">Key Crew</h2>
      <dl class="detail-grid">
        {#each key_crew as m}
          <div class="detail-row">
            <dt>{m.job}</dt>
            <dd>{m.name}</dd>
          </div>
        {/each}
      </dl>
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

  .cast-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
    gap: 7px;
  }
  @media (max-width: 360px) {
    .cast-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .cast-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 11px;
    border-radius: 6px;
    border: 1px solid var(--b);
    background: var(--sur);
    transition: border-color 0.13s;
    -webkit-tap-highlight-color: transparent;
  }
  .cast-card:hover {
    border-color: var(--b2);
  }
  .cast-photo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--sur2);
    border: 1px solid var(--b);
  }
  .cast-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .cast-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .cast-name {
    font-size: 0.76rem;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cast-role {
    font-size: 0.66rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
