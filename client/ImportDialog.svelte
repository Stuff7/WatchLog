<script lang="ts">
  import type { Profile } from "$/types.d.ts";
  import Dialog from "./Dialog.svelte";
  import { ImportState } from "./import.svelte.ts";

  type Props = {
    open: boolean;
    profile?: Profile;
    onClose: () => void;
    onError: (msg: string) => void;
  };

  let { open = $bindable(), profile, onClose, onError }: Props = $props();

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

<Dialog bind:open {onClose}>
  {#snippet header()}
    <span class="imp-title">
      {#if phase === "input"}Import Shows{/if}
      {#if phase === "running"}Importing… {importer.completed}/{importer.total}{/if}
      {#if phase === "conflicts"}Resolve Conflicts ({importer.conflict_count}){/if}
      {#if phase === "done"}Done{/if}
    </span>
  {/snippet}

  <div class="imp-body">
    {#if phase === "input"}
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

      <footer class="imp-footer">
        <button class="button bordered" onclick={close}>Cancel</button>
        <button
          class="button"
          onclick={startImport}
          disabled={!raw_input.trim() || !profile}
        >
          Import
        </button>
      </footer>
    {/if}

    {#if phase === "running"}
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
    {/if}

    {#if phase === "conflicts"}
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
                  <span class="imp-candidate-title">{candidate.name}</span>
                  <span class="imp-candidate-meta">
                    <span
                      class="imp-candidate-type"
                      class:film={candidate.media_type === "movie"}
                    >
                      {candidate.media_type === "movie" ? "Film" : "Series"}
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
          <button
            class="button compact danger bordered"
            onclick={() => conflict.resolve(null)}
          >
            Skip
          </button>
        </div>
      {/each}
    {/if}

    {#if phase === "done"}
      <div class="imp-summary">
        <span class="imp-summary-stat imp-summary-ok">
          ✓ {importer.success_count} imported
        </span>
        {#if importer.error_count > 0}
          <span class="imp-summary-stat imp-summary-err">
            ✕ {importer.error_count} failed
          </span>
        {/if}
        {#if importer.items.filter((i) => i.status === "skipped").length > 0}
          <span class="imp-summary-stat imp-summary-skip">
            – {importer.items.filter((i) => i.status === "skipped").length} skipped
          </span>
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
      <footer class="imp-footer">
        <button class="button success" onclick={close}>Done</button>
      </footer>
    {/if}
  </div>
</Dialog>

<style lang="postcss">
  .imp-title {
    @apply font-mono text-xs uppercase tracking-[0.15em] text-zinc-300;
  }

  .imp-body {
    @apply flex flex-col gap-3 p-4 w-[500px];
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
    @apply flex gap-2 justify-end shrink-0;
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
