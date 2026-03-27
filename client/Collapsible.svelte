<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    open,
    onclick,
    label,
    children,
  }: {
    open: boolean;
    onclick: () => void;
    label: Snippet;
    children: Snippet;
  } = $props();
</script>

<div class="collapsible">
  <button class="hd" {onclick}>
    <span class="lbl">{@render label()}</span>
    <i class="chev" class:open></i>
  </button>
  {#if open}
    <div class="body">
      {@render children()}
    </div>
  {/if}
</div>

<style lang="postcss">
  .collapsible {
    @apply flex flex-col gap-1.5 border-b border-white/[0.04] py-1.5;
    &:last-child {
      @apply border-b-0;
    }
  }

  .hd {
    @apply flex items-center justify-between w-full cursor-pointer select-none;
  }

  .lbl {
    @apply flex items-center gap-1.5;
  }

  .chev {
    @apply text-[0.6rem] text-white/20 transition-transform duration-200;
    display: inline-block;
    &.open {
      transform: rotate(180deg);
    }
  }

  .body {
    @apply flex flex-col gap-1.5;
  }
</style>
