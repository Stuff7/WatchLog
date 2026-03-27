export default class AutoScroller {
  private interval_id: number | null = null;

  constructor(
    private speed: number,
    private threshold: number,
  ) {}

  start(handler: () => void) {
    if (this.interval_id !== null) return;

    const rafHandler = () => {
      if (this.interval_id !== null) {
        handler();
        this.interval_id = requestAnimationFrame(rafHandler);
      }
    };

    this.interval_id = requestAnimationFrame(rafHandler);
  }

  stop() {
    if (this.interval_id !== null) {
      cancelAnimationFrame(this.interval_id);
      this.interval_id = null;
    }
  }

  scrollContainer(
    dragged_rect: DOMRect,
    container: HTMLElement,
    container_rect: DOMRect,
    is_vertical: boolean,
    max_scroll_x: number,
    max_scroll_y: number,
  ) {
    if (is_vertical) {
      this.scrollVertical(dragged_rect, container, container_rect, max_scroll_y);
    } else {
      this.scrollHorizontal(dragged_rect, container, container_rect, max_scroll_x);
    }
  }

  scrollViewport(
    dragged_rect: DOMRect,
    is_vertical: boolean,
    max_scroll_x: number,
    max_scroll_y: number,
  ) {
    if (is_vertical) {
      this.scrollViewportVertical(dragged_rect, max_scroll_y);
    } else {
      this.scrollViewportHorizontal(dragged_rect, max_scroll_x);
    }
  }

  private scrollVertical(
    rect: DOMRect,
    container: HTMLElement,
    bounds: DOMRect,
    max_scroll: number,
  ) {
    const distance_from_top = rect.top - bounds.top;
    const distance_from_bottom = bounds.bottom - rect.bottom;

    if (distance_from_top < this.threshold && container.scrollTop > 0) {
      container.scrollTop = Math.max(0, container.scrollTop - this.speed);
    } else if (
      distance_from_bottom < this.threshold &&
      container.scrollTop < max_scroll
    ) {
      container.scrollTop = Math.min(
        max_scroll,
        container.scrollTop + this.speed,
      );
    }
  }

  private scrollHorizontal(
    rect: DOMRect,
    container: HTMLElement,
    bounds: DOMRect,
    max_scroll: number,
  ) {
    const distance_from_left = rect.left - bounds.left;
    const distance_from_right = bounds.right - rect.right;

    if (distance_from_left < this.threshold && container.scrollLeft > 0) {
      container.scrollLeft = Math.max(0, container.scrollLeft - this.speed);
    } else if (
      distance_from_right < this.threshold &&
      container.scrollLeft < max_scroll
    ) {
      container.scrollLeft = Math.min(
        max_scroll,
        container.scrollLeft + this.speed,
      );
    }
  }

  private scrollViewportVertical(rect: DOMRect, max_scroll: number) {
    const scroll_y = window.scrollY || document.documentElement.scrollTop;
    const distance_from_top = rect.top;
    const distance_from_bottom = window.innerHeight - rect.bottom;

    if (distance_from_top < this.threshold && scroll_y > 0) {
      const new_scroll_y = Math.max(0, scroll_y - this.speed);
      window.scrollTo(window.scrollX, new_scroll_y);
    } else if (distance_from_bottom < this.threshold && scroll_y < max_scroll) {
      const new_scroll_y = Math.min(max_scroll, scroll_y + this.speed);
      window.scrollTo(window.scrollX, new_scroll_y);
    }
  }

  private scrollViewportHorizontal(rect: DOMRect, max_scroll: number) {
    const scroll_x = window.scrollX || document.documentElement.scrollLeft;
    const distance_from_left = rect.left;
    const distance_from_right = window.innerWidth - rect.right;

    if (distance_from_left < this.threshold && scroll_x > 0) {
      const new_scroll_x = Math.max(0, scroll_x - this.speed);
      window.scrollTo(new_scroll_x, window.scrollY);
    } else if (distance_from_right < this.threshold && scroll_x < max_scroll) {
      const new_scroll_x = Math.min(max_scroll, scroll_x + this.speed);
      window.scrollTo(new_scroll_x, window.scrollY);
    }
  }
}
