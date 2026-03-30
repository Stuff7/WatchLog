<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLDetailsAttributes } from "svelte/elements";

  type Props = {
    title: string;
    open?: boolean;
    children: Snippet;
  } & HTMLDetailsAttributes;

  let { title, open = $bindable(false), children, ...attrs }: Props = $props();
</script>

<details {...attrs} bind:open>
  <summary
    class="flex justify-between items-center cursor-pointer list-none hover:text-amber-400 transition-colors"
  >
    <span
      class="text-sm font-bold transition-colors {open
        ? 'text-amber-500'
        : 'text-neutral-300'}"
    >
      {title}
    </span>
    <span
      class="text-xs opacity-50 transition-transform {open ? 'rotate-180' : ''}"
    >
      ↓
    </span>
  </summary>
  <div class="mt-3 pl-2">
    {@render children()}
  </div>
</details>
