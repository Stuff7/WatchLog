<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";

  interface Props<T> {
    items: T[];
    item_class?: string;
    item_content: Snippet<[T, number]>;
    filter?: (item: T) => boolean;
    onDrop?: (dropped: T, before: T | null, after: T | null) => void;
  }

  let {
    items = $bindable(),
    item_class = "",
    item_content,
    filter,
    onDrop,
  }: Props<T> = $props();

  let dragged_index = $state(-1);
  let drag_over_index = $state(-1);

  async function onDragStart(event: DragEvent, index: number) {
    dragged_index = index;
    event.dataTransfer!.effectAllowed = "move";
    event.dataTransfer!.setData("text/plain", "");
  }

  function onDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragged_index !== index) {
      drag_over_index = index;
    }
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
  }

  function onDragLeave(event: DragEvent, index: number) {
    const target = event.currentTarget as HTMLElement;
    if (!target.contains(event.relatedTarget as Node)) {
      if (drag_over_index === index) {
        drag_over_index = -1;
      }
    }
  }

  async function onDropHandler(event: DragEvent, drop_index: number) {
    event.preventDefault();
    if (dragged_index === -1 || dragged_index === drop_index) return;

    const reordered = [...items];
    const [moved] = reordered.splice(dragged_index, 1);
    reordered.splice(drop_index, 0, moved);
    items = reordered;

    if (onDrop) {
      const before = drop_index > 0 ? items[drop_index - 1] : null;
      const after =
        drop_index < items.length - 1 ? items[drop_index + 1] : null;
      onDrop(moved, before, after);
    }
  }

  function onDragEnd() {
    dragged_index = -1;
    drag_over_index = -1;
  }
</script>

{#each items as item, i (item.id)}
  {#if !filter || filter(item)}
    <div
      class="dnd-native {item_class}"
      class:dragging={i === dragged_index}
      class:drag-over={i === drag_over_index}
      draggable="true"
      role="button"
      tabindex="0"
      ondragstart={(e) => onDragStart(e, i)}
      ondragenter={(e) => onDragEnter(e, i)}
      ondragover={onDragOver}
      ondragleave={(e) => onDragLeave(e, i)}
      ondrop={(e) => onDropHandler(e, i)}
      ondragend={onDragEnd}
      in:fly
    >
      {@render item_content(item, i)}
    </div>
  {/if}
{/each}

<style lang="postcss">
  .dnd-native {
    @apply cursor-grab transition-all duration-300 ease-out relative;

    &.dragging {
      @apply cursor-grabbing rotate-1 scale-105 z-50 shadow-2xl border-2 border-indigo-500/50 opacity-80;
    }

    &.drag-over {
      @apply border-2 border-dashed border-indigo-500/80 scale-95;
    }
  }
</style>
