<script lang="ts">
  let rows = $state<Record<string, unknown>[]>([]);
  let status = $state("idle");

  const worker = new Worker(new URL("./db.worker.js", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (e) => {
    rows = e.data;
    status = "done";
  };

  function run() {
    status = "running";
    worker.postMessage("SELECT * FROM test");
  }
</script>

<main>
  <div class="card">
    <h1>SQLite <span>test</span></h1>
    <p class="sub">
      Fires a query into an in-memory SQLite DB running in a Web Worker.
    </p>

    <button onclick={run} class:spinning={status === "running"}>
      {status === "running" ? "querying…" : "run query"}
    </button>

    {#if rows.length > 0}
      <div class="results">
        <div class="label">
          → {rows.length} row{rows.length !== 1 ? "s" : ""} returned
        </div>
        <table>
          <thead>
            <tr
              >{#each Object.keys(rows[0]) as col}<th>{col}</th>{/each}</tr
            >
          </thead>
          <tbody>
            {#each rows as row}
              <tr
                >{#each Object.values(row) as val}<td>{val}</td>{/each}</tr
              >
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #0a0a0a;
    color: #e8e8e8;
    font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
    min-height: 100vh;
    display: grid;
    place-items: center;
  }

  main {
    width: 100%;
    max-width: 640px;
    padding: 2rem;
  }

  .card {
    border: 1px solid #222;
    border-radius: 4px;
    padding: 2.5rem;
    background: #111;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  h1 {
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #fff;
    line-height: 1;
  }

  h1 span {
    color: #c8f135;
  }

  .sub {
    font-size: 0.75rem;
    color: #555;
    line-height: 1.6;
  }

  button {
    align-self: flex-start;
    background: #c8f135;
    color: #0a0a0a;
    border: none;
    padding: 0.6rem 1.4rem;
    font-family: ui-monospace, "Cascadia Code", "Fira Code", monospace;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 2px;
    transition:
      opacity 0.15s,
      transform 0.15s;
  }

  button:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  button:active {
    transform: translateY(0);
  }
  button.spinning {
    opacity: 0.5;
    cursor: wait;
  }

  .results {
    border-top: 1px solid #1e1e1e;
    padding-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .label {
    font-size: 0.7rem;
    color: #c8f135;
    letter-spacing: 0.05em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75rem;
  }

  th {
    text-align: left;
    color: #444;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid #1e1e1e;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.65rem;
  }

  td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #161616;
    color: #ccc;
  }

  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: #161616;
  }
</style>
