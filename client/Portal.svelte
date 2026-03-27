<script lang="ts">
  import { type Component, getAllContexts, mount, unmount } from "svelte";

  const { to: target = document.body, children } = $props();

  const context = getAllContexts();

  let instance!: Component;

  $effect(() => {
    instance = mount(children, { target, context });

    return () => {
      unmount(instance);
    };
  });
</script>
