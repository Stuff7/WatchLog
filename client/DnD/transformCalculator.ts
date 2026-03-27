import type { Position, ItemRect } from "./DragState.svelte";

export function calculateItemTransform(
  index: number,
  dragged_index: number,
  drop_index: number,
  drag_position: Position,
  drop_position: Position,
  shift_distance: number,
  is_vertical: boolean,
  unlock_cross_axis: boolean,
): string {
  // Item returning to position after drop
  if (dragged_index === -1 && drop_index === index) {
    const x = is_vertical && !unlock_cross_axis ? 0 : drop_position.x;
    const y = is_vertical
      ? drop_position.y
      : unlock_cross_axis
        ? drop_position.y
        : 0;
    return `left: ${x}px; top: ${y}px;`;
  }

  // Not dragging
  if (dragged_index === -1 || drop_index === -1) {
    return "";
  }

  // The item being dragged
  if (index === dragged_index) {
    const x = is_vertical && !unlock_cross_axis ? 0 : drag_position.x;
    const y = is_vertical
      ? drag_position.y
      : unlock_cross_axis
        ? drag_position.y
        : 0;
    return `left: ${x}px; top: ${y}px;`;
  }

  // Items shifting to make space
  if (drop_index > dragged_index && index > dragged_index && index <= drop_index) {
    const transform = is_vertical
      ? `translateY(-${shift_distance}px)`
      : `translateX(-${shift_distance}px)`;
    return `transform: ${transform};`;
  }

  if (drop_index < dragged_index && index < dragged_index && index >= drop_index) {
    const transform = is_vertical
      ? `translateY(${shift_distance}px)`
      : `translateX(${shift_distance}px)`;
    return `transform: ${transform};`;
  }

  return "";
}

export function getShiftClass(
  index: number,
  dragged_index: number,
  drop_index: number,
  is_vertical: boolean,
): string {
  if (dragged_index === -1 || drop_index === -1) return "";

  if (drop_index > dragged_index && index > dragged_index && index <= drop_index) {
    return is_vertical ? "shift-up" : "shift-left";
  }

  if (drop_index < dragged_index && index < dragged_index && index >= drop_index) {
    return is_vertical ? "shift-down" : "shift-right";
  }

  return "";
}

export function adjustDropPositionForReorder(
  drop_position: Position,
  positions: ItemRect[],
  dragged_index: number,
  drop_index: number,
  gap: number,
  is_vertical: boolean,
): Position {
  const result = { ...drop_position };

  if (drop_index < dragged_index) {
    for (let i = drop_index; i < dragged_index; i++) {
      if (is_vertical) {
        result.y += positions[i].height + gap;
      } else {
        result.x += positions[i].width + gap;
      }
    }
  } else {
    for (let i = dragged_index; i < drop_index; i++) {
      if (is_vertical) {
        result.y -= positions[i].height + gap;
      } else {
        result.x -= positions[i].width + gap;
      }
    }
  }

  return result;
}
