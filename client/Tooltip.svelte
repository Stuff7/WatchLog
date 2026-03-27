<script lang="ts">
  import { type Snippet, untrack } from "svelte";
  import { scale } from "svelte/transition";
  import Portal from "./Portal.svelte";
  import { tooltips_layer } from "./utils";

  type ThisBind = { binding?: HTMLElement };

  type Props = {
    target: Snippet<[ThisBind]>;
    children: Snippet;
    gap?: number;
  };

  const { target, children, gap = 10 }: Props = $props();

  let element = $state<ThisBind>({ binding: undefined });
  let dropdown = $state(false);
  let left = $state(0);
  let top = $state(0);
  let visible = $state(false);

  $effect(() => {
    const el = element.binding;
    if (!el) return;

    return untrack(() => {
      const show = () => {
        dropdown = el.offsetTop < 50;
        left = el.offsetLeft + el.offsetWidth / 2;
        top = el.offsetTop;

        if (dropdown) top += el.offsetHeight + gap;
        else top = el.offsetTop - gap;
        visible = true;
      };

      const hide = () => (visible = false);

      el.addEventListener("pointerenter", show);
      el.addEventListener("pointerleave", hide);

      return () => {
        el.removeEventListener("pointerenter", show);
        el.removeEventListener("pointerleave", hide);
      };
    });
  });
</script>

{@render target(element)}

<Portal to={tooltips_layer}>
  {#if visible}
    <div
      class="absolute rounded-sm p-2 bg-zinc-900/70 -translate-x-1/2"
      class:-translate-y-full={!dropdown}
      style:left={`${left}px`}
      style:top={`${top}px`}
      transition:scale={{ duration: 100 }}
    >
      {@render children()}
    </div>
  {/if}
</Portal>
