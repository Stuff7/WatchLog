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

  let circle_status_color = $derived.by(() => {
    if (local.error) return "bg-red-500 animate-pulse";
    if (local.saving_db || local.connecting_db)
      return "bg-amber-500 animate-pulse";
    return "bg-lime-500";
  });

  let status_title = $derived.by(() => {
    if (local.error) return local.error;
    if (local.connecting_db) return "Connecting to database";
    if (local.saving_db) return "Saving database";
    if (local.db_connected) return `Connected to ${local.dropbox_app_name}`;
    return "Database Status";
  });
</script>

<div class="flex items-center">
  <button
    class="button icon bordered relative {status_color}"
    onclick={() => (is_test_open = true)}
    aria-label={status_title}
    title={status_title}
  >
    
    {#if local.db_connected || local.connecting_db}
      <span
        class="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-zinc-950 {circle_status_color}"
      ></span>
    {/if}
  </button>
</div>

<DatabaseDialog bind:open={is_test_open} />
