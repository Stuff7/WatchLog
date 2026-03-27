<script lang="ts" generics="T extends { id: unknown }">
  import { type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { fly } from "svelte/transition";
  import { nonPassiveEvent } from "$/actions.ts";
  import { calculateItemTransform, getShiftClass } from "./transformCalculator";
  import { DragController } from "./DragController.svelte";

  type Props = {
    items: T[];
    item_content: Snippet<[T, number]>;
    filter?: (item: T) => boolean;
    direction?: "horizontal" | "vertical";
    gap?: number;
    unlock_cross_axis?: boolean;
    no_scroll?: boolean;
    container_class?: string;
    item_class?: string;
    item_attrs?: HTMLAttributes<HTMLDivElement>;
    onDrop?: (dropped: T, before: T | null, after: T | null) => void;
    drag_handle_id?: string;
    auto_scroll_speed?: number;
    auto_scroll_threshold?: number;
  } & HTMLAttributes<HTMLDivElement>;

  let {
    items = $bindable(),
    item_content,
    filter,
    direction = "horizontal",
    gap = 0,
    unlock_cross_axis = false,
    no_scroll = false,
    container_class = "",
    item_class = "",
    item_attrs,
    onDrop,
    drag_handle_id,
    auto_scroll_speed = 10,
    auto_scroll_threshold = 50,
    ...props
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const controller = new DragController<T>(
    auto_scroll_speed,
    auto_scroll_threshold,
  );
  let container_element: HTMLElement;

  const is_vertical = $derived(direction === "vertical");
  const { state } = controller;

  $effect(() => {
    if (container_element) {
      controller.configure(
        container_element,
        items,
        is_vertical,
        gap,
        drag_handle_id,
      );
    }
  });

  const shift_distance = $derived(controller.getShiftDistance());
  let drag_moved = false;

  function startDrag(ev: PointerEvent, index: number) {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    drag_moved = false;
    const did_start = controller.startDrag(
      ev,
      index,
      ev.currentTarget as HTMLElement,
    );
    if (did_start) ev.preventDefault();
  }

  function handleReorder(from_index: number, to_index: number) {
    const reordered = [...items];
    const [moved] = reordered.splice(from_index, 1);
    reordered.splice(to_index, 0, moved);
    items = reordered;

    if (onDrop) {
      const before = to_index > 0 ? items[to_index - 1] : null;
      const after = to_index < items.length - 1 ? items[to_index + 1] : null;
      onDrop(moved, before, after);
    }
  }

  function getItemTransform(i: number): string {
    return calculateItemTransform(
      i,
      state.dragged_index,
      state.drop_index,
      state.drag_position,
      state.drop_position,
      shift_distance,
      is_vertical,
      unlock_cross_axis,
    );
  }

  function getItemShiftClass(i: number): string {
    return getShiftClass(i, state.dragged_index, state.drop_index, is_vertical);
  }
</script>

<svelte:window
  onpointermove={(e) => {
    if (controller.state.is_dragging) {
      drag_moved = true;
      controller.drag(e);
    }
  }}
  onpointerup={() => controller.endDrag(handleReorder)}
  onscrollcapture={() => controller.updateDragPosition()}
  onclickcapture={(e) => {
    if (drag_moved) {
      e.preventDefault();
      e.stopPropagation();
      drag_moved = false;
    }
  }}
/>

<svelte:body
  {@attach nonPassiveEvent("touchmove", (ev) => {
    if (controller.state.is_dragging && controller.shouldDrag(ev))
      ev.preventDefault();
  })}
/>

<div
  {...props}
  class="drag-n-drop {container_class}"
  class:horizontal={!is_vertical}
  class:vertical={is_vertical}
  class:overflow-x-auto={!no_scroll && !is_vertical}
  class:overflow-y-auto={!no_scroll && is_vertical}
  bind:this={container_element}
  style:gap="{gap}px"
>
  {#each items as item, i (item.id)}
    <div
      class="dnd-item {item_class} {getItemShiftClass(i)}"
      class:dragging={i === state.dragged_index}
      class:animate={state.is_dragging}
      class:has-handle={drag_handle_id != null}
      class:hidden!={filter ? !filter(item) : false}
      style={getItemTransform(i)}
      onpointerdown={(e) => startDrag(e, i)}
      in:fly
      {...item_attrs}
    >
      {@render item_content(item, i)}
    </div>
  {/each}
</div>

<style lang="postcss">
  .drag-n-drop {
    @apply flex relative grow;

    &.horizontal {
      @apply flex-row hidden-scrollbar;
    }

    &.vertical {
      @apply flex-col hidden-scrollbar;
    }

    .dnd-item {
      @apply relative;
      left: 0;
      top: 0;

      &:not(.has-handle) {
        @apply cursor-grab;

        &.dragging {
          @apply z-20 cursor-grabbing shadow-lg;
        }
      }

      :global(&.dragging [data-drag-handle]) {
        @apply z-20 cursor-grabbing shadow-lg;
      }

      :global([data-drag-handle]) {
        @apply cursor-grab;
      }

      &.animate {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  }
</style>
