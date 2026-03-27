import type { EventHandler } from "svelte/elements";

export type SvelteEvent<
  E extends Event = Event,
  T extends EventTarget = HTMLElement,
> = Parameters<EventHandler<E, T>>[0];

export function generateShortId(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join("");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ease(t: number) {
  return (
    (1 - t) * (1 - t) * (1 - t) * 0 +
    3 * (1 - t) * (1 - t) * t * 0.25 +
    3 * (1 - t) * t * t * 0.25 +
    t * t * t * 1.0
  );
}

export function easeTransition(
  from: number[],
  to: number[],
  duration_ms: number,
  update: (x: number[]) => void,
  done?: () => void,
) {
  const transition = (start_time: number) => {
    const now = performance.now();
    const elapsed = now - start_time;
    let t = elapsed / duration_ms;
    if (t > 1) t = 1;

    const eased = ease(t);
    update(from.map((s, i) => s + (to[i] - s) * eased));

    if (t < 1) requestAnimationFrame(() => transition(start_time));
    else if (done) done();
  };

  return transition;
}

function findLayer(id: string) {
  const layer = document.body.querySelector(`[data-layer=${id}]`);
  if (!layer) throw `Layer "${id}" not found`;
  return layer;
}

export const dialogs_layer = findLayer("dialogs");
export const tooltips_layer = findLayer("tooltips");
export const context_menu_layer = findLayer("context-menu");
