import { DragState } from "./DragState.svelte.ts";
import AutoScroller from "./AutoScroller.ts";
import {
  calculateItemPositions,
  findDropIndex,
  calculateShiftDistance,
} from "./positionCalculator.ts";
import { adjustDropPositionForReorder } from "./transformCalculator.ts";
import { easeTransition } from "$/utils.ts";

export class DragController<T extends { id: unknown }> {
  state = new DragState();
  scroller: AutoScroller;
  positions = $derived.by(() => {
    if (!this.container_element || !this.state.is_dragging) return [];
    return calculateItemPositions(
      this.container_element,
      this.state.dragged_index,
      this.is_vertical,
    );
  });

  private dragged_el?: HTMLElement;
  private container_element?: HTMLElement;
  private is_vertical = false;
  private gap = 0;
  private items: T[] = [];
  private drag_handle_id?: string;
  private max_scroll_x = 0;
  private max_scroll_y = 0;
  private max_viewport_scroll_x = 0;
  private max_viewport_scroll_y = 0;

  constructor(auto_scroll_speed: number, auto_scroll_threshold: number) {
    this.scroller = new AutoScroller(auto_scroll_speed, auto_scroll_threshold);
  }

  configure(
    container_element: HTMLElement,
    items: T[],
    is_vertical: boolean,
    gap: number,
    drag_handle_id?: string,
  ) {
    this.container_element = container_element;
    this.items = items;
    this.is_vertical = is_vertical;
    this.gap = gap;
    this.drag_handle_id = drag_handle_id;
  }

  shouldDrag(ev: Event): boolean {
    if (!this.drag_handle_id) return true;

    const target = ev.target as HTMLElement;
    const handle = target.closest(`[data-drag-handle=${this.drag_handle_id}]`);
    const current_target = ev.currentTarget as HTMLElement;
    return !!(handle && current_target.contains(handle));
  }

  getShiftDistance(): number {
    if (!this.state.is_dragging || !this.container_element) return 0;
    return calculateShiftDistance(
      this.container_element,
      this.state.dragged_index,
      this.is_vertical,
      this.gap,
    );
  }

  private handleAutoScroll = () => {
    if (
      !this.state.is_dragging ||
      !this.dragged_el ||
      !this.container_element
    ) {
      return;
    }

    const rect = this.dragged_el.getBoundingClientRect();
    const container_rect = this.container_element.getBoundingClientRect();

    this.scroller.scrollContainer(
      rect,
      this.container_element,
      container_rect,
      this.is_vertical,
      this.max_scroll_x,
      this.max_scroll_y,
    );
    this.scroller.scrollViewport(
      rect,
      this.is_vertical,
      this.max_viewport_scroll_x,
      this.max_viewport_scroll_y,
    );
  };

  private onContainerScroll = () => {
    this.updateDragPosition();
  };

  updateDragPosition() {
    if (
      !this.state.is_dragging ||
      !this.state.container_rect ||
      !this.container_element ||
      !this.dragged_el
    ) {
      return;
    }

    const current_rect = this.container_element.getBoundingClientRect();
    const scroll_delta_x =
      this.container_element.scrollLeft - this.state.initial_scroll.x;
    const scroll_delta_y =
      this.container_element.scrollTop - this.state.initial_scroll.y;

    this.state.drag_position.x =
      this.state.last_pointer.x -
      current_rect.left -
      this.state.drag_offset.x +
      scroll_delta_x;
    this.state.drag_position.y =
      this.state.last_pointer.y -
      current_rect.top -
      this.state.drag_offset.y +
      scroll_delta_y;

    const rect = this.dragged_el.getBoundingClientRect();

    const scroll_adjusted_positions = this.positions.map((p) =>
      this.is_vertical
        ? { ...p, center: p.center - scroll_delta_y }
        : { ...p, center: p.center - scroll_delta_x },
    );

    const new_index = this.is_vertical
      ? findDropIndex(
          scroll_adjusted_positions,
          this.state.dragged_index,
          rect.top - current_rect.top,
          rect.bottom - current_rect.top,
        )
      : findDropIndex(
          scroll_adjusted_positions,
          this.state.dragged_index,
          rect.left - current_rect.left,
          rect.right - current_rect.left,
        );

    const adjusted_index =
      new_index > this.state.dragged_index
        ? Math.min(this.items.length - 1, new_index)
        : Math.max(0, new_index);

    if (adjusted_index !== this.state.drop_index) {
      this.state.drop_index = adjusted_index;
    }
  }

  startDrag(ev: PointerEvent, index: number, element: HTMLElement) {
    if (!this.shouldDrag(ev) || !this.container_element) return false;

    this.dragged_el = element;
    const container_rect = this.container_element.getBoundingClientRect();

    this.max_scroll_x =
      this.container_element.scrollWidth - this.container_element.clientWidth;
    this.max_scroll_y =
      this.container_element.scrollHeight - this.container_element.clientHeight;

    this.max_viewport_scroll_x =
      document.documentElement.scrollWidth - innerWidth;
    this.max_viewport_scroll_y =
      document.documentElement.scrollHeight - innerHeight;

    this.state.startDrag(
      index,
      ev.clientX,
      ev.clientY,
      container_rect,
      this.container_element.scrollLeft,
      this.container_element.scrollTop,
    );

    this.container_element.addEventListener("scroll", this.onContainerScroll);
    this.scroller.start(this.handleAutoScroll);
    return true;
  }

  drag(ev: PointerEvent) {
    this.state.updatePointer(ev.clientX, ev.clientY);
    this.updateDragPosition();
  }

  endDrag(onReorder?: (from_index: number, to_index: number) => void): boolean {
    if (!this.state.is_dragging) return false;

    this.scroller.stop();
    this.container_element?.removeEventListener(
      "scroll",
      this.onContainerScroll,
    );
    this.state.prepareForDrop();

    const dragged_idx = this.state.dragged_index;
    const drop_idx = this.state.drop_index;
    let did_reorder = false;

    if (drop_idx !== -1 && dragged_idx !== drop_idx) {
      onReorder?.(dragged_idx, drop_idx);
      did_reorder = true;

      this.state.drop_position = adjustDropPositionForReorder(
        this.state.drop_position,
        this.positions,
        dragged_idx,
        drop_idx,
        this.gap,
        this.is_vertical,
      );
    }

    this.state.reset();

    if (this.is_vertical) {
      this.state.drop_position.y = Math.round(this.state.drop_position.y);
    } else {
      this.state.drop_position.x = Math.round(this.state.drop_position.x);
    }

    requestAnimationFrame(
      easeTransition(
        [this.state.drop_position.x, this.state.drop_position.y],
        [0, 0],
        100,
        ([x, y]) => (this.state.drop_position = { x, y }),
        () => (this.state.drop_index = -1),
      ),
    );

    return did_reorder;
  }
}
