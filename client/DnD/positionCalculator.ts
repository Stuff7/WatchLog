import type { ItemRect } from "./DragState.svelte";

export function calculateItemPositions(
  container: HTMLElement,
  dragged_index: number,
  is_vertical: boolean,
): ItemRect[] {
  const container_rect = container.getBoundingClientRect();

  return Array.from(container.children)
    .filter((_, i) => i !== dragged_index)
    .map((item) => {
      const rect = item.getBoundingClientRect();

      if (is_vertical) {
        const top = rect.top - container_rect.top;
        const bottom = rect.bottom - container_rect.top;
        return {
          top,
          bottom,
          width: 0,
          height: rect.height,
          center: (top + bottom) / 2,
        };
      } else {
        const left = rect.left - container_rect.left;
        const right = rect.right - container_rect.left;
        return {
          left,
          right,
          width: rect.width,
          height: 0,
          center: (left + right) / 2,
        };
      }
    });
}

export function findDropIndex(
  positions: ItemRect[],
  dragged_index: number,
  primary_edge: number,
  secondary_edge: number,
): number {
  if (positions.length === 0) return 0;

  for (let i = 0; i < positions.length; i++) {
    const edge = i < dragged_index ? primary_edge : secondary_edge;
    if (edge < positions[i].center) return i;
  }

  return positions.length;
}

export function calculateShiftDistance(
  container: HTMLElement,
  dragged_index: number,
  is_vertical: boolean,
  gap: number,
): number {
  if (dragged_index === -1) return 0;

  const rect = container.children[dragged_index].getBoundingClientRect();
  return (is_vertical ? rect.height : rect.width) + gap;
}
