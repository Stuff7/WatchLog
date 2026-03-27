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
    draggable = false,
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
  onpointerdown={(ev) => ev.target === dialogs_layer && onClose()}
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
        <button class="icon" onclick={onClose}>  </button>
      </header>
      <article class="content">
        {@render children?.()}
      </article>
    </div>
  {/if}
</Portal>

<style lang="postcss">
  .dialog {
    @apply relative font-mono text-base rounded-md shadow-[0px_0px_0px_0.4em_#d8d8d866] overflow-hidden
  bg-black/60 text-neutral-100 backdrop-blur-sm w-fit max-w-[77vw] grid transition-all
  grid-rows-[min-content_1fr] duration-300 transition-[grid-template-rows,transform,opacity];

    &:focus,
    &:has(:focus) {
      @apply z-10;
    }

    &.draggable:not(.center) {
      left: var(--x);
      top: var(--y);

      .header {
        @apply cursor-grab;

        &.dragging {
          @apply cursor-grabbing;
        }
      }
    }

    &.center:not(.draggable) {
      @apply left-1/2 top-1/2 origin-center -translate-1/2;
    }

    > .header {
      @apply p-2 font-bold grid grid-cols-[1fr_38px] shadow-sm items-center;

      &,
      & ~ .content {
        box-shadow: 0 0 0 1px #5556;
      }
    }

    > .content {
      @apply m-0 p-3 overflow-auto max-h-[70vh] transition-[padding] duration-300 outline-0 border-0;
    }

    :global(&.minimized) {
      --content-size: 0fr;

      > .content {
        @apply py-0;
      }
    }
  }
</style>
