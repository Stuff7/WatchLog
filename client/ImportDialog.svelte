<script lang="ts">
  import type { Profile } from "$/types.d.ts";
  import Portal from "./Portal.svelte";
  import { scale } from "svelte/transition";
  import { dialogs_layer } from "./utils.ts";
  import { ImportState } from "./import.svelte.ts";

  type Props = {
    open: boolean;
    profile?: Profile;
    onClose: () => void;
    onError: (msg: string) => void;
  };

  let { open, profile, onClose, onError }: Props = $props();

  const importer = new ImportState();

  let raw_input = $state("");
  let parse_error = $state<string | null>(null);
  let phase = $state<"input" | "running" | "conflicts" | "done">("input");

  function parseNames(raw: string): string[] | null {
    try {
      const parsed = JSON.parse(raw.trim());
      if (
        !Array.isArray(parsed) ||
        !parsed.every((x) => typeof x === "string")
      ) {
        parse_error = "Expected a JSON array of strings.";
        return null;
      }
      const names = parsed.map((s) => s.trim()).filter(Boolean);
      if (names.length === 0) {
        parse_error = "Array is empty.";
        return null;
      }
      parse_error = null;
      return names;
    } catch {
      parse_error = "Invalid JSON.";
      return null;
    }
  }

  async function startImport() {
    if (!profile) return;
    const names = parseNames(raw_input);
    if (!names) return;

    phase = "running";
    await importer.run(names, profile, onError);
    phase = importer.resolving ? "conflicts" : "done";
  }

  $effect(() => {
    if (phase === "conflicts" && importer.done) {
      phase = "done";
    }
  });

  function close() {
    importer.reset();
    raw_input = "";
    parse_error = null;
    phase = "input";
    onClose();
  }

  const STATUS_ICON: Record<string, string> = {
    pending: "·",
    searching: "⟳",
    importing: "⟳",
    done: "✓",
    conflict: "?",
    error: "✕",
    skipped: "–",
  };

  const STATUS_CLASS: Record<string, string> = {
    pending: "st-pending",
    searching: "st-active",
    importing: "st-active",
    done: "st-done",
    conflict: "st-conflict",
    error: "st-error",
    skipped: "st-skipped",
  };
</script>

<Portal to={dialogs_layer}>
  {#if open}
    <div
      class="imp-backdrop"
      transition:scale={{ duration: 100 }}
      role="dialog"
      aria-modal="true"
      aria-label="Import shows"
    >
      <div class="imp-panel">
        <header class="imp-header">
          <span class="imp-title">
            {#if phase === "input"}Import Shows{/if}
            {#if phase === "running"}Importing… {importer.completed}/{importer.total}{/if}
            {#if phase === "conflicts"}Resolve Conflicts ({importer.conflict_count}){/if}
            {#if phase === "done"}Done{/if}
          </span>
          <button
            class="imp-close plain no-color"
            onclick={close}
            aria-label="Close">✕</button
          >
        </header>

        <!-- ── Input phase ─────────────────────────────────────────────── -->
        {#if phase === "input"}
          <div class="imp-body">
            <p class="imp-hint">Paste a JSON array of show names.</p>
            <textarea
              class="imp-textarea"
              placeholder={'["Breaking Bad", "The Wire", "Severance"]'}
              bind:value={raw_input}
              rows={6}
              spellcheck="false"
            ></textarea>
            {#if parse_error}
              <p class="imp-error">{parse_error}</p>
            {/if}
          </div>
          <footer class="imp-footer">
            <button class="imp-btn-ghost" onclick={close}>Cancel</button>
            <button
              class="imp-btn-primary"
              onclick={startImport}
              disabled={!raw_input.trim() || !profile}
            >
              Import
            </button>
          </footer>
        {/if}

        <!-- ── Running phase ───────────────────────────────────────────── -->
        {#if phase === "running"}
          <div class="imp-body">
            <div class="imp-progress-bar">
              <div
                class="imp-progress-fill"
                style:width="{importer.total > 0
                  ? (importer.completed / importer.total) * 100
                  : 0}%"
              ></div>
            </div>
            <ul class="imp-list">
              {#each importer.items as item}
                <li class="imp-row {STATUS_CLASS[item.status]}">
                  <span
                    class="imp-icon"
                    class:spin={item.status === "searching" ||
                      item.status === "importing"}
                  >
                    {STATUS_ICON[item.status]}
                  </span>
                  <span class="imp-name">{item.name}</span>
                  {#if item.error}
                    <span class="imp-row-error">{item.error}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- ── Conflicts phase ─────────────────────────────────────────── -->
        {#if phase === "conflicts"}
          <div class="imp-body">
            <p class="imp-hint">
              Multiple matches found. Pick the right one or skip.
            </p>
            {#each importer.conflicts as conflict (conflict.name)}
              <div class="imp-conflict">
                <p class="imp-conflict-name">"{conflict.name}"</p>
                <ul class="imp-candidates">
                  {#each conflict.candidates as candidate}
                    <button
                      class="imp-candidate"
                      onclick={() => conflict.resolve(candidate)}
                    >
                      <div class="imp-candidate-thumb">
                        {#if candidate.poster}
                          <img src={candidate.poster} alt="" loading="lazy" />
                        {/if}
                      </div>
                      <div class="imp-candidate-info">
                        <span class="imp-candidate-title">{candidate.name}</span
                        >
                        <span class="imp-candidate-meta">
                          <span
                            class="imp-candidate-type"
                            class:film={candidate.media_type === "movie"}
                          >
                            {candidate.media_type === "movie"
                              ? "Film"
                              : "Series"}
                          </span>
                          {#if candidate.premiered}
                            · {candidate.premiered.slice(0, 4)}
                          {/if}
                          {#if candidate.rating}
                            · ★ {candidate.rating.toFixed(1)}
                          {/if}
                        </span>
                      </div>
                    </button>
                  {/each}
                </ul>
                <button class="imp-skip" onclick={() => conflict.resolve(null)}
                  >Skip</button
                >
              </div>
            {/each}
          </div>
        {/if}

        <!-- ── Done phase ──────────────────────────────────────────────── -->
        {#if phase === "done"}
          <div class="imp-body">
            <div class="imp-summary">
              <span class="imp-summary-stat imp-summary-ok"
                >✓ {importer.success_count} imported</span
              >
              {#if importer.error_count > 0}
                <span class="imp-summary-stat imp-summary-err"
                  >✕ {importer.error_count} failed</span
                >
              {/if}
              {#if importer.items.filter((i) => i.status === "skipped").length > 0}
                <span class="imp-summary-stat imp-summary-skip"
                  >– {importer.items.filter((i) => i.status === "skipped")
                    .length} skipped</span
                >
              {/if}
            </div>
            <ul class="imp-list">
              {#each importer.items as item}
                <li class="imp-row {STATUS_CLASS[item.status]}">
                  <span class="imp-icon">{STATUS_ICON[item.status]}</span>
                  <span class="imp-name">{item.name}</span>
                  {#if item.error}
                    <span class="imp-row-error">{item.error}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
          <footer class="imp-footer">
            <button class="imp-btn-primary" onclick={close}>Done</button>
          </footer>
        {/if}
      </div>
    </div>
  {/if}
</Portal>

<style lang="postcss">
  .imp-backdrop {
    @apply absolute inset-0 flex items-center justify-center;
    background: rgba(0, 0, 0, 0.5);
  }

  .imp-panel {
    @apply flex flex-col w-full max-w-lg max-h-[80vh] bg-zinc-900 border border-white/10
           shadow-2xl overflow-hidden;
  }

  .imp-header {
    @apply flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0;
  }

  .imp-title {
    @apply font-mono text-xs uppercase tracking-[0.15em] text-zinc-300;
  }

  .imp-close {
    @apply text-white/30 hover:text-white/70 text-xs transition-colors cursor-pointer;
  }

  .imp-body {
    @apply flex flex-col gap-3 p-4 overflow-y-auto flex-1;
  }

  .imp-hint {
    @apply text-white/40 text-xs font-mono;
  }

  .imp-textarea {
    @apply w-full bg-black/30 border border-white/10 text-zinc-100 text-xs font-mono
           p-3 resize-none outline-none;
    &:focus {
      @apply border-amber-400/40;
    }
    &::placeholder {
      @apply text-white/20;
    }
  }

  .imp-error {
    @apply text-red-400 text-xs font-mono;
  }

  .imp-footer {
    @apply flex gap-2 justify-end px-4 py-3 border-t border-white/[0.07] shrink-0;
  }

  .imp-btn-primary {
    @apply bg-amber-400 text-zinc-900 text-xs font-mono font-semibold uppercase
           tracking-[0.1em] px-4 py-1.5 transition-opacity;
    &:hover {
      @apply opacity-90;
    }
    &:disabled {
      @apply opacity-40 cursor-not-allowed;
    }
  }

  .imp-btn-ghost {
    @apply text-white/40 hover:text-white/70 text-xs font-mono uppercase tracking-[0.1em]
           transition-colors px-4 py-1.5;
  }

  /* Progress bar */
  .imp-progress-bar {
    @apply h-0.5 w-full bg-white/10 shrink-0;
  }
  .imp-progress-fill {
    @apply h-full bg-amber-400 transition-all duration-300;
  }

  /* Item list */
  .imp-list {
    @apply flex flex-col gap-0.5;
  }

  .imp-row {
    @apply flex items-center gap-2 text-xs font-mono py-1;
  }

  .imp-icon {
    @apply shrink-0 w-4 text-center;
    &.spin {
      display: inline-block;
      animation: imp-spin 1s linear infinite;
    }
  }

  .imp-name {
    @apply flex-1 truncate;
  }

  .imp-row-error {
    @apply text-red-400/70 text-xs shrink-0 truncate max-w-32;
  }

  .st-pending {
    @apply text-white/20;
  }
  .st-active {
    @apply text-amber-400;
  }
  .st-done {
    @apply text-green-400/80;
  }
  .st-conflict {
    @apply text-sky-400;
  }
  .st-error {
    @apply text-red-400;
  }
  .st-skipped {
    @apply text-white/30;
  }

  /* Conflicts */
  .imp-conflict {
    @apply flex flex-col gap-2 border-b border-white/[0.07] pb-4 last:border-0;
  }

  .imp-conflict-name {
    @apply text-xs font-mono text-white/60;
  }

  .imp-candidates {
    @apply flex flex-col gap-1;
  }

  .imp-candidate {
    @apply flex items-center gap-3 w-full border border-white/5 bg-black/20
           cursor-pointer text-left transition-colors px-3 py-2;
    &:hover {
      @apply bg-white/5 border-amber-400/20;
    }
  }

  .imp-candidate-thumb {
    @apply w-7 shrink-0 bg-white/5 overflow-hidden;
    height: 38px;
    img {
      @apply w-full h-full object-cover;
    }
  }

  .imp-candidate-info {
    @apply flex flex-col gap-0.5 flex-1 min-w-0;
  }

  .imp-candidate-title {
    @apply text-xs text-zinc-100 truncate;
  }

  .imp-candidate-meta {
    @apply text-xs font-mono text-white/35;
  }

  .imp-candidate-type {
    @apply text-amber-400;
    &.film {
      @apply text-sky-400;
    }
  }

  .imp-skip {
    @apply self-start text-xs font-mono text-white/25 hover:text-white/60
           transition-colors uppercase tracking-[0.1em];
  }

  /* Summary */
  .imp-summary {
    @apply flex gap-4;
  }

  .imp-summary-stat {
    @apply text-xs font-mono;
  }

  .imp-summary-ok {
    @apply text-green-400/80;
  }
  .imp-summary-err {
    @apply text-red-400;
  }
  .imp-summary-skip {
    @apply text-white/30;
  }

  @keyframes imp-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
