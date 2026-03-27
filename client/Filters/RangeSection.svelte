<script lang="ts">
  import type { Snippet } from "svelte";
  import Collapsible from "$/Collapsible.svelte";
  import RangeInput from "$/RangeInput.svelte";

  let {
    open,
    ontoggle,
    header,
    min = $bindable(),
    max = $bindable(),
    min_limit,
    max_limit,
    step,
    formatter,
    exclude_null = $bindable(false),
    exclude_label,
  }: {
    open: boolean;
    ontoggle: () => void;
    header: Snippet;
    min: number | null;
    max: number | null;
    min_limit: number;
    max_limit: number;
    step: number;
    formatter: (v: number) => string | number;
    exclude_null?: boolean;
    exclude_label?: string;
  } = $props();
</script>

<Collapsible {open} onclick={ontoggle}>
  {#snippet label()}
    <span class="rs-label">
      {@render header()}
    </span>
  {/snippet}
  {#snippet children()}
    {#if min !== null && max !== null}
      <RangeInput
        bind:min={min as number}
        bind:max={max as number}
        {min_limit}
        {max_limit}
        {step}
        {formatter}
      />
      {#if exclude_label}
        <label class="rs-check">
          <input type="checkbox" bind:checked={exclude_null} />
          <span>{exclude_label}</span>
        </label>
      {/if}
    {/if}
  {/snippet}
</Collapsible>

<style lang="postcss">
  .rs-label {
    @apply text-white/25 text-xs font-mono uppercase tracking-[0.12em] flex items-center gap-1.5;
  }

  .rs-check {
    @apply flex items-center gap-2 text-white/50 text-xs font-mono cursor-pointer;
    &:hover {
      @apply opacity-100;
    }
  }
</style>
