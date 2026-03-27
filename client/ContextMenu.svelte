<script lang="ts">
  import { scale } from "svelte/transition";
  import Portal from "./Portal.svelte";
  import { mouse } from "./state.svelte.ts";
  import { context_menu_layer } from "./utils.ts";
  import { untrack } from "svelte";

  type Option = {
    icon: string;
    label: string;
    action: () => void;
  };

  type Props = {
    open?: boolean;
    options: Option[];
    onClose?: () => void;
  };

  let {
    open = $bindable(false),
    options,
    onClose = () => (open = false),
  }: Props = $props();

  const x = $derived(open ? untrack(() => `${mouse.x + 10}px`) : "");
  const y = $derived(
    open ? untrack(() => `calc(100% - ${mouse.y - 10}px)`) : "",
  );
</script>

<svelte:window onclick={onClose} />

<Portal to={context_menu_layer}>
  {#if open}
    <menu
      class="absolute grid"
      style:left={x}
      style:bottom={y}
      transition:scale={{ duration: 100 }}
    >
      {#each options as option}
        <button
          class="flex gap-2 items-center sharp px-2"
          role="menuitem"
          onclick={() => {
            option.action();
            onClose?.();
          }}
        >
          <i>{option.icon}</i>
          {option.label}
        </button>
      {/each}
    </menu>
  {/if}
</Portal>
