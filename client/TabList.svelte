<script lang="ts" generics="T extends { id: string }">
  import { type Snippet } from "svelte";
  import DnD from "./DnD/Root.svelte";

  type Props = {
    tabs: T[];
    tab_content: Snippet<[T]>;
    unlock_y?: boolean;
    no_scroll?: boolean;
  };

  let {
    tabs = $bindable(),
    tab_content,
    unlock_y = false,
    no_scroll = false,
  }: Props = $props();
</script>

<DnD
  bind:items={tabs}
  direction="horizontal"
  gap={7}
  unlock_cross_axis={unlock_y}
  {no_scroll}
  container_class="tablist"
  item_class="tab"
  role="tablist"
  item_attrs={{ role: "tab" }}
>
  {#snippet item_content(tab)}
    {@render tab_content(tab)}
  {/snippet}
</DnD>
