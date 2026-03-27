<script lang="ts">
  import type { Media } from "$/types.d.ts";

  type Props = {
    media: Media;
    in_list: boolean;
    onAdd: () => Promise<void>;
    onRemove: () => void;
    onToggleWatched: () => void;
  };
  let { media, in_list, onAdd, onRemove, onToggleWatched }: Props = $props();

  let adding = $state(false);
  const watched = $derived(media.watched ?? false);

  async function handleAdd() {
    if (adding || in_list) return;
    adding = true;
    try {
      await onAdd();
    } finally {
      adding = false;
    }
  }
</script>

<div class="action-btns">
  <button
    class="add-btn"
    class:in-list={in_list}
    onclick={handleAdd}
    disabled={in_list || adding}
    aria-label={in_list ? "Already in list" : "Add to list"}
  >
    {#if adding}
      <span class="spinner"></span>
    {:else if in_list}
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
        <path
          d="M3 8l3.5 3.5L13 4.5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      In list
    {:else}
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
        <path
          d="M8 3v10M3 8h10"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
      Add to list
    {/if}
  </button>

  {#if in_list}
    <button class="remove-btn" onclick={onRemove} aria-label="Remove from list">
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
        <path
          d="M3 3l10 10M13 3L3 13"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
      Remove
    </button>

    {#if media.media_type === "movie"}
      <button
        class="watched-btn"
        class:is-watched={watched}
        onclick={onToggleWatched}
        aria-label={watched ? "Mark unwatched" : "Mark watched"}
      >
        <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
          <path
            d="M3 8l3.5 3.5L13 4.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {watched ? "Watched" : "Mark watched"}
      </button>
    {/if}
  {/if}
</div>

<style lang="postcss">
  .action-btns {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  .add-btn,
  .remove-btn,
  .watched-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 0.15s,
      border-color 0.15s,
      color 0.15s,
      opacity 0.15s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .add-btn {
    border: 1px solid rgba(184, 127, 255, 0.4);
    color: var(--acc);
    background: rgba(184, 127, 255, 0.08);
  }
  .add-btn:hover:not(:disabled) {
    background: rgba(184, 127, 255, 0.16);
    border-color: var(--acc);
  }
  .add-btn:active:not(:disabled) {
    opacity: 0.7;
  }
  .add-btn.in-list {
    color: var(--grn);
    border-color: rgba(74, 222, 128, 0.3);
    background: rgba(74, 222, 128, 0.07);
    cursor: default;
  }
  .add-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .remove-btn {
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: #f87171;
    background: rgba(248, 113, 113, 0.07);
  }
  .remove-btn:hover {
    background: rgba(248, 113, 113, 0.14);
    border-color: rgba(248, 113, 113, 0.55);
  }
  .remove-btn:active {
    opacity: 0.7;
  }

  .watched-btn {
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--faint);
    background: rgba(255, 255, 255, 0.04);
  }
  .watched-btn:hover {
    border-color: var(--grn);
    color: var(--grn);
    background: rgba(74, 222, 128, 0.07);
  }
  .watched-btn.is-watched {
    color: var(--grn);
    border-color: rgba(74, 222, 128, 0.3);
    background: rgba(74, 222, 128, 0.07);
  }
  .watched-btn.is-watched:hover {
    background: rgba(74, 222, 128, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--faint);
  }

  .spinner {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.5px solid rgba(184, 127, 255, 0.3);
    border-top-color: var(--acc);
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
