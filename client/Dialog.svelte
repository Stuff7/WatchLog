<script lang="ts">
  import Portal from "./Portal.svelte";
  import { scale } from "svelte/transition";
  import { type Snippet } from "svelte";
  import { dialogs_layer } from "./utils.ts";

  type Props = {
    open?: boolean;
    onClose?: () => void;
    x?: number;
    y?: number;
    draggable?: boolean;
    center?: boolean;
    header?: Snippet;
    children?: Snippet;
  };

  let {
    open = $bindable(false),
    onClose = () => (open = false),
    x = $bindable(window.innerWidth / 2),
    y = $bindable(window.innerHeight / 2),
    draggable = true,
    center = true,
    header,
    children,
  }: Props = $props();

  let start_x = $state(x);
  let start_y = $state(y);
  let end_x = $state(x);
  let end_y = $state(y);
  let dragging = $state(false);

  function startDrag(ev: PointerEvent) {
    if (!draggable) return;

    if (
      !(
        ev.target instanceof HTMLButtonElement ||
        ev.target instanceof HTMLInputElement
      )
    ) {
      ev.preventDefault();
    }

    if (ev.button !== 0) return;

    dragging = true;

    start_x = ev.pageX;
    start_y = ev.pageY;

    drag(ev);
  }

  function drag(ev: PointerEvent) {
    if (!dragging) return;

    x = end_x + ev.pageX - start_x;
    y = end_y + ev.pageY - start_y;
  }

  function stopDrag() {
    dragging = false;
    end_x = x;
    end_y = y;
  }
</script>

<svelte:window
  onpointerdown={(ev) =>
    ev.button === 0 && ev.target === dialogs_layer && onClose()}
  onpointermove={drag}
  onpointerup={stopDrag}
/>

<Portal to={dialogs_layer}>
  {#if open}
    <div
      class="dialog"
      class:draggable
      class:center
      transition:scale={{ duration: 100 }}
      role="dialog"
      tabindex="0"
      onpointerdown={(ev) => ev.currentTarget.focus()}
      onkeydown={(ev) => ev.key === "Escape" && onClose?.()}
      style:--x={`${x}px`}
      style:--y={`${y}px`}
    >
      <header
        class="header"
        class:dragging
        role="dialog"
        tabindex="0"
        onpointerdown={startDrag}
      >
        {@render header?.()}
        <button class="icon button" onclick={onClose}></button>
      </header>
      <article class="content">
        {@render children?.()}
      </article>
    </div>
  {/if}
</Portal>

<style lang="postcss">
  .dialog {
    @apply text-neutral-100 bg-zinc-900 border border-neutral-800 rounded-md;
    @apply absolute overflow-hidden w-fit max-w-[77vw] flex flex-col;

    &:focus,
    &:has(:focus) {
      @apply z-10;
    }

    &.draggable {
      left: var(--x);
      top: var(--y);

      .header {
        @apply cursor-grab;

        &.dragging {
          @apply cursor-grabbing;
        }
      }
    }

    &.center {
      @apply origin-center -translate-x-1/2 -translate-y-1/2;

      &:not(.draggable) {
        @apply left-1/2 top-1/2;
      }
    }

    > .header {
      @apply pl-4 pr-2 py-1 font-bold flex items-center gap-2 justify-between;
    }

    > .content {
      @apply overflow-auto max-h-[70vh] transition-[padding] duration-300 outline-0 border-0;
    }

    :global(&.minimized) {
      --content-size: 0fr;

      > .content {
        @apply py-0;
      }
    }
  }
</style>
