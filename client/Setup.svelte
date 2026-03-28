<script lang="ts">
  import { onMount } from "svelte";
  import { initWorker, initDB, saveDB, query } from "./db";
  import Dialog from "./Dialog.svelte";
  import { credentials } from "./api.svelte.ts";
  import Input from "./Input.svelte";

  type Props = {
    open: boolean;
    is_db_connected: boolean;
  };
  let { open = $bindable(), is_db_connected = $bindable() }: Props = $props();

  let setup_error = $state("");
  let rows = $state<Record<string, unknown>[]>([]);
  let status = $state("idle");

  onMount(() => {
    initWorker();
    if (credentials.gh_token) connect();
  });

  async function connect() {
    setup_error = "";
    try {
      credentials.gist_id = await initDB(
        credentials.gh_token,
        credentials.gist_id || null,
      );
      localStorage.setItem("gh_token", credentials.gh_token);
      localStorage.setItem("credentials.gist_id", credentials.gist_id);
      localStorage.setItem("tmdb_key", credentials.tmdb_key);
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
    await saveDB(credentials.gh_token, credentials.gist_id);
  }
</script>

<Dialog bind:open>
  <div class="rounded-sm p-10 bg-neutral-900 flex flex-col gap-5 w-200">
    {#if !is_db_connected}
      <h1
        class="font-sans text-3xl font-extrabold tracking-tighter text-white leading-none"
      >
        Credentials
      </h1>

      <Input
        placeholder="GitHub credentials.gh_token"
        bind:value={credentials.gh_token}
      />
      <Input
        placeholder="Gist ID (blank = create new)"
        bind:value={credentials.gist_id}
      />
      <Input placeholder="TMDB Key" bind:value={credentials.tmdb_key} />

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

      <Input type="text" bind:value={q} placeholder="Query" />

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
