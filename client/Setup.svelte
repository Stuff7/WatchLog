<script lang="ts">
  import { onMount } from "svelte";
  import { initWorker, initDB, saveDB, query } from "./db";
  import Dialog from "./Dialog.svelte";
  import { tmdb_key } from "./tmdb.svelte";

  type Props = {
    open: boolean;
    is_db_connected: boolean;
  };
  let { open = $bindable(), is_db_connected = $bindable() }: Props = $props();

  // -- Persistent creds ------------------------------------------------------
  let token = $state(localStorage.getItem("gh_token") ?? "");
  let gist_id = $state(localStorage.getItem("gist_id") ?? "");

  // -- UI state --------------------------------------------------------------
  let setup_error = $state("");
  let rows = $state<Record<string, unknown>[]>([]);
  let status = $state("idle");

  onMount(() => {
    initWorker();
    if (token) connect();
  });

  async function connect() {
    setup_error = "";
    try {
      gist_id = await initDB(token, gist_id || null);
      localStorage.setItem("gh_token", token);
      localStorage.setItem("gist_id", gist_id);
      localStorage.setItem("tmdb_key", tmdb_key.value);
      is_db_connected = true;
    } catch (e: any) {
      is_db_connected = false;
      setup_error = e.message;
    }
  }

  let q = $state("");
  async function run() {
    status = "running";
    rows = await query(q);
    status = "done";
    await saveDB(token, gist_id);
  }
</script>

<Dialog bind:open>
  <div
    class="border border-neutral-800 rounded-sm p-10 bg-neutral-900 flex flex-col gap-5 w-200"
  >
    {#if !is_db_connected}
      <h1
        class="font-sans text-3xl font-extrabold tracking-tighter text-white leading-none"
      >
        connect <span class="text-amber-400">db</span>
      </h1>

      <input
        class="input-field"
        placeholder="GitHub token"
        bind:value={token}
        type="password"
      />
      <input
        class="input-field"
        placeholder="Gist ID (blank = create new)"
        bind:value={gist_id}
      />
      <input
        class="input-field"
        placeholder="TMDB Key"
        bind:value={tmdb_key.value}
      />

      <button class="button" onclick={connect}> Connect </button>

      {#if setup_error}
        <p class="text-xs leading-relaxed text-red-500">
          {setup_error}
        </p>
      {/if}
    {:else}
      <h1
        class="font-sans text-3xl font-extrabold tracking-tighter text-white leading-none"
      >
        SQLite <span class="text-amber-400">test</span>
      </h1>
      <p class="text-xs text-neutral-500 leading-relaxed">
        Fires a query into an in-memory SQLite DB running in a Web Worker.
      </p>

      <input
        class="input-field"
        type="text"
        bind:value={q}
        placeholder="Query"
      />

      <button class="button" onclick={run} disabled={status === "running"}>
        {status === "running" ? "querying…" : "run query"}
      </button>

      {#if rows.length > 0}
        <div class="border-t border-neutral-800 pt-5 flex flex-col gap-3">
          <div
            class="text-sm text-amber-400 tracking-widest uppercase font-bold"
          >
            → {rows.length} row{rows.length !== 1 ? "s" : ""} returned
          </div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="border-b border-neutral-800">
                  {#each Object.keys(rows[0]) as col}
                    <th
                      class="text-left text-neutral-600 p-2 font-normal uppercase tracking-widest text-xs"
                    >
                      {col}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each rows as row}
                  <tr
                    class="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/50 transition-colors"
                  >
                    {#each Object.values(row) as val}
                      <td class="p-2 text-neutral-400">{val}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</Dialog>
