<script lang="ts">
  import type { Media } from "$/types.d.ts";
  import type { DiffEntry } from "./media-utils.ts";

  type RefreshStatus =
    | "idle"
    | "pending"
    | "updating"
    | "changed"
    | "unchanged"
    | "error";
  type RefreshResult = {
    media: Media;
    status: RefreshStatus;
    diff: DiffEntry[];
  };

  type Props = {
    results: RefreshResult[];
    onDismiss: () => void;
    onNavigate: (tmdb_id: number) => void;
  };

  let { results, onDismiss, onNavigate }: Props = $props();

  const changed = $derived(
    results.filter((r) => r.status === "changed").length,
  );
  const unchanged = $derived(
    results.filter((r) => r.status === "unchanged").length,
  );
  const failed = $derived(results.filter((r) => r.status === "error").length);
  const notable = $derived(
    results.filter((r) => r.status === "changed" || r.status === "error"),
  );
</script>

<div class="summary">
  <div class="summary-header">
    <span class="summary-title">Refresh complete</span>
    <div class="summary-stats">
      <span class="stat changed">{changed} changed</span>
      <span class="stat">{unchanged} unchanged</span>
      {#if failed > 0}<span class="stat error">{failed} failed</span>{/if}
    </div>
    <button class="close-btn" onclick={onDismiss}>✕</button>
  </div>

  <div class="summary-list">
    {#each notable as result}
      <div class="summary-item">
        <button
          class="item-name"
          onclick={() => onNavigate(result.media.tmdb_id)}
        >
          {result.media.name}
        </button>
        {#if result.status === "error"}
          <span class="diff-error">fetch failed</span>
        {:else}
          <div class="diffs">
            {#each result.diff as d}
              <div class="diff-row" title="{d.from} → {d.to}">
                <span class="diff-field">{d.field}</span>
                <span class="diff-from">{d.from}</span>
                <span class="diff-arrow">→</span>
                <span class="diff-to">{d.to}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .summary {
    @apply absolute bottom-0 left-0 right-0 z-50 border-t border-white/[0.08]
           bg-zinc-950/95 flex flex-col max-h-64;
    backdrop-filter: blur(20px);
  }

  .summary-header {
    @apply flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] shrink-0;
  }

  .summary-title {
    @apply font-mono text-xs uppercase tracking-widest text-white/50;
  }
  .summary-stats {
    @apply flex items-center gap-3 flex-1;
  }

  .stat {
    @apply font-mono text-xs text-white/30;
    &.changed {
      @apply text-amber-400;
    }
    &.error {
      @apply text-red-400;
    }
  }

  .close-btn {
    @apply font-mono text-xs text-white/20 hover:text-white/60 bg-transparent border-none cursor-pointer;
  }

  .summary-list {
    @apply overflow-y-auto flex flex-col;
  }

  .summary-item {
    @apply px-4 py-2.5 border-b border-white/[0.04] flex flex-col gap-1.5;
  }

  .item-name {
    @apply font-mono text-xs text-amber-400 bg-transparent border-none cursor-pointer
           text-left hover:text-amber-200 transition-colors p-0;
  }

  .diffs {
    @apply flex flex-col gap-0.5;
  }
  .diff-row {
    @apply flex items-baseline gap-2 font-mono text-xs;
  }
  .diff-field {
    @apply text-white/30 shrink-0 w-32 truncate;
  }
  .diff-from {
    @apply text-red-400/70 truncate max-w-48;
  }
  .diff-arrow {
    @apply text-white/20 shrink-0;
  }
  .diff-to {
    @apply text-emerald-400/80 truncate max-w-48;
  }
  .diff-error {
    @apply font-mono text-xs text-red-400;
  }
</style>
