export type Position = { x: number; y: number };

export type ItemRect = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  center: number;
};

export class DragState {
  dragged_index = $state(-1);
  drop_index = $state(-1);
  drag_offset = $state<Position>({ x: 0, y: 0 });
  drag_position = $state<Position>({ x: 0, y: 0 });
  drop_position = $state<Position>({ x: 0, y: 0 });
  last_pointer = $state<Position>({ x: 0, y: 0 });
  initial_scroll = $state<Position>({ x: 0, y: 0 });
  container_rect?: DOMRect;

  get is_dragging() {
    return this.dragged_index !== -1;
  }

  reset() {
    this.dragged_index = -1;
    this.container_rect = undefined;
  }

  startDrag(
    index: number,
    client_x: number,
    client_y: number,
    container_rect: DOMRect,
    scroll_left: number,
    scroll_top: number,
  ) {
    this.dragged_index = index;
    this.drop_index = index;
    this.container_rect = container_rect;
    this.initial_scroll = { x: scroll_left, y: scroll_top };
    this.drag_offset = {
      x: client_x - container_rect.left,
      y: client_y - container_rect.top,
    };
    this.drag_position = { x: 0, y: 0 };
    this.last_pointer = { x: client_x, y: client_y };
  }

  updatePointer(client_x: number, client_y: number) {
    this.last_pointer = { x: client_x, y: client_y };
  }

  prepareForDrop() {
    this.drop_position = { ...this.drag_position };
  }
}
