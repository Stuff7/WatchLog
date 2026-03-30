<script lang="ts">
  import { local } from "./storage.svelte.ts";
  import DatabaseDialog from "./DatabaseDialog.svelte";

  let is_test_open = $state(false);

  let status_color = $derived.by(() => {
    if (local.error) return "text-red-500 animate-pulse";
    if (local.db_connected)
      return "text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]";
    return "text-white/20";
  });
</script>

<div class="flex items-center">
  <button
    class="button icon bordered relative {status_color}"
    onclick={() => (is_test_open = true)}
    aria-label="Database Test"
    title={local.db_connected
      ? `Connected to ${local.dropbox_app_name}`
      : "Database Status"}
  >
    
    {#if local.db_connected}
      <span
        class="absolute -top-1 -right-1 w-2 h-2 bg-lime-500 rounded-full border border-zinc-950"
      ></span>
    {/if}
  </button>
</div>

<DatabaseDialog bind:open={is_test_open} />
