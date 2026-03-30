<script lang="ts">
  import { local } from "./storage.svelte.ts";
  import Collapsible from "./Collapsible.svelte";

  let open = $state(false);
  let step1_open = $state(false);
  let step2_open = $state(false);
  let step3_open = $state(false);

  $effect(() => {
    if (!local.dropbox_client_id || !local.dropbox_client_secret) {
      step1_open = true;
    } else if (!local.dropbox_refresh_token) {
      step2_open = true;
      step3_open = true;
    }
  });

  let auth_url = $derived(
    `https://www.dropbox.com/oauth2/authorize?client_id=${local.dropbox_client_id || "CLIENT_ID"}&response_type=code&token_access_type=offline`,
  );

  let curl_cmd = $derived(
    `curl -s https://api.dropbox.com/oauth2/token \\
  -d code=YOUR_CODE \\
  -d grant_type=authorization_code \\
  -u ${local.dropbox_client_id || "ID"}:${local.dropbox_client_secret || "SECRET"} \\
  | perl -ne 'print $1 if /"refresh_token":\\s*"([^"]+)"/'`,
  );
</script>

<Collapsible
  bind:open
  title="Setup Guide"
  class="bg-neutral-900 p-4 rounded-sm"
>
  <Collapsible
    title="1. Create Dropbox App"
    bind:open={step1_open}
    class="border-b border-neutral-800/50 pb-3"
  >
    <p class="text-sm text-neutral-400 leading-relaxed">
      Go to the <a
        href="https://www.dropbox.com/developers/apps/create"
        target="_blank"
        class="text-white underline">App Console</a
      >:
    </p>
    <ul class="list-disc ml-5 mt-2 text-sm text-neutral-400 space-y-1">
      <li>Choose <b>Scoped Access</b> + <b>App Folder</b>.</li>
      <li>
        Permissions: <code>files.content.write</code> and <code>read</code>.
      </li>
    </ul>
  </Collapsible>

  <Collapsible
    title="2. Get Authorization Code"
    bind:open={step2_open}
    class="border-b border-neutral-800/50 py-3"
  >
    <p class="text-sm text-neutral-400 mb-2">Authorize and copy the code:</p>
    <a
      href={auth_url}
      target="_blank"
      class="block p-3 bg-black rounded border border-neutral-800 text-blue-400 text-xs font-mono break-all hover:border-blue-900 transition-colors"
    >
      {auth_url}
    </a>
  </Collapsible>

  <Collapsible
    title="3. Generate Refresh Token"
    bind:open={step3_open}
    class="pt-3"
  >
    <p class="text-sm text-neutral-400 mb-2">
      Run in terminal (replace <code>YOUR_CODE</code>):
    </p>
    <code
      class="block bg-black p-4 rounded border border-neutral-800 text-amber-200 text-xs font-mono break-all leading-normal select-all"
    >
      {curl_cmd}
    </code>
  </Collapsible>
</Collapsible>
