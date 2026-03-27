<script lang="ts">
  import { clamp } from "$/utils";

  type Props = {
    min: number;
    max: number;
    min_limit?: number;
    max_limit?: number;
    step?: number;
    class?: string;
    formatter?: (value: number) => string | number;
  };

  let {
    min = $bindable(),
    max = $bindable(),
    min_limit = 0,
    max_limit = 100,
    step = 1,
    class: clazz = "",
    formatter,
  }: Props = $props();

  // Align to step grid so the native range input can always reach the upper edge.
  const aligned_max = $derived(
    min_limit + Math.ceil((max_limit - min_limit) / step) * step,
  );

  const min_percent = $derived(
    ((min - min_limit) * 100) / (aligned_max - min_limit),
  );
  const max_percent = $derived(
    ((max - min_limit) * 100) / (aligned_max - min_limit),
  );

  let min_focused = $state(true);
  let hover_value = $state<number | null>(null);
  let hover_x = $state(0);
  let hover_percent = $state(0);
  let track_el: HTMLDivElement;

  function valueFromP(p: number): number {
    const raw = p * (aligned_max - min_limit) + min_limit;
    return clamp(Math.round(raw / step) * step, min_limit, aligned_max);
  }

  function reposition(e: MouseEvent | TouchEvent) {
    if (!track_el) return;
    const rect = track_el.getBoundingClientRect();
    const client_x =
      typeof TouchEvent !== "undefined" && e instanceof TouchEvent
        ? (e.touches[0]?.clientX ?? 0)
        : (e as MouseEvent).clientX;
    const x = clamp(client_x - rect.left, 0, rect.width);
    const p = x / rect.width;
    hover_x = x;
    hover_percent = p * 100;
    hover_value = valueFromP(p);
    min_focused =
      Math.abs(p * 100 - min_percent) <= Math.abs(p * 100 - max_percent);
  }

  // iOS Safari doesn't fire input events during touch drag on range inputs.
  // Intercept touchmove on each knob, preventDefault to stop page scroll,
  // and drive the value manually from touch position.
  function onKnobTouchMove(e: TouchEvent, which: "min" | "max") {
    e.preventDefault();
    reposition(e);
    if (which === "min") min = clamp(hover_value ?? min, min_limit, max);
    else max = clamp(hover_value ?? max, min, aligned_max);
  }

  function updMin(e: Event & { currentTarget: HTMLInputElement }) {
    const v = Number(e.currentTarget.value);
    min = v <= max ? v : max;
  }

  function updMax(e: Event & { currentTarget: HTMLInputElement }) {
    const v = Number(e.currentTarget.value);
    max = v >= min ? v : min;
  }
</script>

<div
  class="range-input {clazz}"
  role="group"
  aria-label="Range slider"
  style:--min="{min_percent}%"
  style:--max="{100 - max_percent}%"
  bind:this={track_el}
  onmousemove={reposition}
  onpointerleave={() => (hover_value = null)}
>
  <div class="slider">
    <input
      type="range"
      class="knob"
      class:focused={min_focused}
      min={min_limit}
      max={aligned_max}
      {step}
      value={min}
      oninput={updMin}
      onfocus={() => (min_focused = true)}
      ontouchstart={reposition}
      ontouchmove={(e) => onKnobTouchMove(e, "min")}
      aria-label="Minimum value"
    />
    <input
      type="range"
      class="knob max"
      class:focused={!min_focused}
      min={min_limit}
      max={aligned_max}
      {step}
      value={max}
      oninput={updMax}
      onfocus={() => (min_focused = false)}
      ontouchstart={reposition}
      ontouchmove={(e) => onKnobTouchMove(e, "max")}
      aria-label="Maximum value"
    />
    <div class="track">
      <div class="fill"></div>
    </div>
  </div>

  {#if formatter && hover_value !== null}
    <output
      style:--x="{hover_x}px"
      class:left={hover_percent < 8}
      class:right={hover_percent > 92}
    >
      <strong>{formatter(hover_value)}</strong>
    </output>
  {/if}

  <div class="labels">
    <span>{formatter ? formatter(min) : min}</span>
    <span>{formatter ? formatter(max) : max}</span>
  </div>
</div>

<style lang="postcss">
  .range-input {
    @apply relative flex flex-col gap-1 w-full select-none;
    --min: 0%;
    --max: 0%;

    .slider {
      @apply relative w-full h-5 flex items-center;
    }

    .knob {
      @apply absolute inset-0 w-full h-full appearance-none bg-transparent outline-none cursor-pointer p-0 m-0;
      pointer-events: all;
      touch-action: none;

      &.focused {
        @apply z-10;
      }

      &::-webkit-slider-runnable-track {
        background: transparent;
        height: 0;
      }
      &::-moz-range-track {
        background: transparent;
        height: 0;
      }

      &::-webkit-slider-thumb {
        @apply appearance-none w-3.5 h-3.5 rounded-full opacity-0 cursor-pointer;
        translate: -50%;
      }
      &::-moz-range-thumb {
        @apply w-3.5 h-3.5 rounded-full opacity-0 cursor-pointer border-0;
        translate: -50%;
      }

      &.max::-webkit-slider-thumb {
        translate: 50%;
      }
      &.max::-moz-range-thumb {
        translate: 50%;
      }
    }

    .track {
      @apply absolute inset-x-0 h-1.5 rounded bg-white/10 pointer-events-none;

      .fill {
        @apply absolute inset-y-0 rounded pointer-events-none;
        background: linear-gradient(
          to right,
          theme("colors.amber.400 / 40%"),
          theme("colors.amber.400 / 80%")
        );
        left: var(--min);
        right: var(--max);

        &::before,
        &::after {
          content: "";
          @apply absolute w-3.5 h-3.5 rounded-full bg-amber-400 transition-[box-shadow] duration-200;
          top: 50%;
        }
        &::before {
          left: 0;
          transform: translate(-50%, -50%);
        }
        &::after {
          right: 0;
          transform: translate(50%, -50%);
        }
      }
    }

    &:hover .fill::before,
    &:hover .fill::after {
      box-shadow: 0 0 0 4px theme("colors.amber.400 / 20%");
    }

    output {
      @apply absolute bottom-full mb-3 text-xs font-mono text-amber-400/80
             -translate-x-1/2 whitespace-nowrap pointer-events-none
             opacity-0 transition-opacity duration-150;
      left: var(--x);
      &.left {
        @apply translate-x-0;
      }
      &.right {
        @apply -translate-x-full;
      }
    }

    &:hover output {
      @apply opacity-100;
    }

    .labels {
      @apply flex justify-between text-xs font-mono text-white/25;
    }
  }
</style>
