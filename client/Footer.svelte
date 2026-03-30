<script lang="ts">
  import { untrack } from "svelte";
  import ContextMenu from "$/ContextMenu.svelte";
  import Dialog from "$/Dialog.svelte";
  import TabList from "$/TabList.svelte";
  import type { Profile } from "$/types.d.ts";
  import { generateShortId } from "$/utils.ts";
  import { setPath } from "$/App.svelte";
  import * as api from "$/api.svelte.ts";

  type Props = { profiles: Profile[]; selected_profile?: Profile };
  let { profiles = $bindable(), selected_profile = $bindable() }: Props =
    $props();

  let renaming_profile = $state<Profile>();
  let managing_profile = $state<Profile>();
  let removing_profile = $state<Profile>();
  let creating_profile = $state<Profile>();
  let new_profile_id = $state(generateShortId());

  let error_message = $state<string | null>(null);

  let opened_profiles = $state(profiles);
  $effect(() => {
    const current = untrack(() => opened_profiles);
    opened_profiles = [
      ...current,
      ...profiles.filter((p) => !current.some((o) => o.id === p.id)),
    ].filter((p) => p.open);
  });

  let original_name = "";
  let show_closed = $state(false);

  const closed_profiles = $derived(profiles.filter((p) => !p.open));

  async function reopenProfile(profile: Profile) {
    profile.open = true;
    show_closed = false;
    setPath(`/${profile.id}`);

    try {
      await api.updateProfile(profile.id, { open: true });
    } catch {
      profile.open = false;
      error_message = `Failed to reopen profile "${profile.name}".`;
    }
  }

  async function createProfile() {
    if (!creating_profile) return;
    const profile = creating_profile;

    profiles.push(profile);
    setPath(`/${profile.id}`);
    creating_profile = undefined;
    new_profile_id = generateShortId();

    try {
      await api.createProfile(profile.id, profile.name, profile.open);
    } catch {
      const idx = profiles.findIndex((p) => p.id === profile.id);
      if (idx !== -1) profiles.splice(idx, 1);
      setPath(selected_profile ? `/${selected_profile.id}` : "/");
      error_message = `Failed to create profile "${profile.name}".`;
    }
  }

  async function deleteProfile() {
    if (!removing_profile) return;
    const profile = removing_profile;
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx === -1) return;

    const was_selected = selected_profile?.id === profile.id;

    profiles.splice(idx, 1);
    removing_profile = undefined;
    if (was_selected) {
      const next = profiles[Math.min(idx, profiles.length - 1)];
      setPath(next ? `/${next.id}` : "/");
    }

    try {
      await api.deleteProfile(profile.id);
    } catch {
      profiles.splice(idx, 0, profile);
      error_message = `Failed to delete profile "${profile.name}".`;
    }
  }

  async function closeProfile(profile: Profile) {
    profile.open = false;
    if (profile === selected_profile) {
      const next = opened_profiles.find((p) => p !== selected_profile);
      setPath(next ? `/${next.id}` : "/");
    }

    try {
      await api.updateProfile(profile.id, { open: false });
    } catch {
      profile.open = true;
      error_message = `Failed to close profile "${profile.name}".`;
    }
  }

  async function cloneProfile(profile: Profile) {
    const new_id = generateShortId();
    const clone: Profile = JSON.parse(JSON.stringify(profile));
    clone.id = new_id;
    clone.name += " Clone";

    profiles.push(clone);
    setPath(`/${clone.id}`);

    try {
      await api.cloneProfile(profile.id, new_id, clone.name);
    } catch {
      const idx = profiles.findIndex((p) => p.id === new_id);
      if (idx !== -1) profiles.splice(idx, 1);
      setPath(`/${profile.id}`);
      error_message = `Failed to clone profile "${profile.name}".`;
    }
  }

  async function commitRename(profile: Profile) {
    renaming_profile = undefined;

    try {
      await api.updateProfile(profile.id, { name: profile.name });
    } catch {
      profile.name = original_name;
      error_message = `Failed to rename profile.`;
    }
  }

  function focusInput(elem: HTMLInputElement) {
    elem.focus();
    elem.select();
  }

  function dismissClosed(ev: MouseEvent) {
    if (!(ev.target as Element).closest(".sl-reopen-wrap")) show_closed = false;
  }
</script>

<svelte:window onclick={dismissClosed} />

<footer class="sl-footer">
  <button
    class="sl-new-tab plain no-color"
    onclick={() => {
      creating_profile = {
        id: new_profile_id,
        name: "Untitled",
        open: true,
        list: [],
      };
    }}
    aria-label="New profile">+</button
  >

  {#if closed_profiles.length > 0}
    <div class="sl-reopen-wrap">
      <button
        class="sl-new-tab plain no-color"
        onclick={() => (show_closed = !show_closed)}
        aria-label="Reopen closed profile"
        title="Reopen closed profile">↗</button
      >
      {#if show_closed}
        <div class="sl-closed-menu" role="menu">
          {#each closed_profiles as profile}
            <button
              class="sl-closed-item plain no-color"
              role="menuitem"
              onclick={() => reopenProfile(profile)}>{profile.name}</button
            >
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <TabList bind:tabs={opened_profiles}>
    {#snippet tab_content(profile)}
      <a
        class="sl-tab-link"
        class:active={profile === selected_profile}
        href={`/${profile.id}`}
        draggable="false"
        ondblclick={() => {
          renaming_profile = profile;
          original_name = renaming_profile.name;
        }}
        oncontextmenu={(ev) => {
          managing_profile = profile;
          ev.preventDefault();
        }}
      >
        <span class="sl-tab-name">{profile.name}</span>
        {#if profile === selected_profile}
          <span class="sl-tab-count">{profile.list.length}</span>
        {/if}
      </a>

      {#if renaming_profile === profile}
        <input
          class="sl-rename-input plain"
          bind:value={renaming_profile.name}
          oninput={(ev) => {
            ev.currentTarget.size = Math.max(1, renaming_profile!.name.length);
          }}
          onblur={() => commitRename(profile)}
          onkeydown={(ev) => {
            if (ev.key === "Escape") {
              renaming_profile!.name = original_name;
              renaming_profile = undefined;
            } else if (ev.key === "Enter") {
              commitRename(profile);
            }
          }}
          {@attach focusInput}
        />
      {/if}

      <ContextMenu
        open={managing_profile === profile}
        onClose={() => (managing_profile = undefined)}
        options={[
          {
            icon: "",
            label: "Delete",
            action: () => (removing_profile = profile),
          },
          { icon: "", label: "Clone", action: () => cloneProfile(profile) },
        ]}
      />

      <button
        class="sl-tab-close plain no-color icon"
        aria-label="Close"
        onclick={() => closeProfile(profile)}
      >
      </button>
    {/snippet}
  </TabList>

  <Dialog
    open={!!removing_profile}
    onClose={() => (removing_profile = undefined)}
  >
    {#snippet header()}Delete {removing_profile!.name}{/snippet}
    <div class="flex flex-wrap gap-2">
      <p class="basis-full">
        Are you sure you want to delete <strong>{removing_profile!.name}</strong
        >?
      </p>
      <button class="grow" onclick={deleteProfile}>Yes</button>
      <button class="grow" onclick={() => (removing_profile = undefined)}
        >No</button
      >
    </div>
  </Dialog>

  <Dialog
    open={!!creating_profile}
    onClose={() => (creating_profile = undefined)}
  >
    {#snippet header()}New Profile{/snippet}
    <div class="flex flex-wrap gap-2">
      <p class="basis-full flex gap-2">
        Name:
        <input
          class="grow"
          bind:value={creating_profile!.name}
          onkeydown={(ev) => ev.key === "Enter" && createProfile()}
          {@attach focusInput}
        />
      </p>
      <button class="grow" onclick={createProfile}>Create</button>
      <button class="grow" onclick={() => (creating_profile = undefined)}
        >Cancel</button
      >
    </div>
  </Dialog>

  <Dialog open={!!error_message} onClose={() => (error_message = null)}>
    {#snippet header()}Something went wrong{/snippet}
    <div class="flex flex-wrap gap-2">
      <p class="basis-full text-red-400 font-mono text-sm">{error_message}</p>
      <button class="grow" onclick={() => (error_message = null)}>OK</button>
    </div>
  </Dialog>
</footer>

<style lang="postcss">
  .sl-footer {
    @apply flex items-stretch border-t border-white/[0.07] relative z-20 shrink-0 px-2 gap-1 min-h-11;
    background: rgb(5 5 8 / 0.92);
    backdrop-filter: blur(20px);
  }
  .sl-footer::before {
    @apply absolute inset-x-0 bottom-0 pointer-events-none h-px;
    content: "";
    background: var(--grad-amber-foot);
  }

  .sl-new-tab {
    @apply flex items-center justify-center shrink-0 w-8 cursor-pointer border-none bg-transparent p-0 self-center text-white/25 text-base;
  }
  .sl-new-tab:hover {
    @apply text-amber-400;
  }

  .sl-tab-link {
    @apply flex items-center gap-1.5 no-underline text-zinc-50 whitespace-nowrap overflow-hidden
         text-ellipsis relative text-xs max-w-36 h-full min-h-11
         px-3;
    border-bottom: 2px solid transparent;
  }
  .sl-tab-link:hover {
    @apply text-zinc-50;
  }
  .sl-tab-link.active {
    @apply border-b-amber-400;
  }

  .sl-tab-name {
    @apply overflow-hidden text-ellipsis whitespace-nowrap max-w-28;
  }
  .sl-tab-count {
    @apply font-mono shrink-0 rounded-sm text-xs px-1 text-amber-400/50 bg-amber-400/10 border border-amber-400/20;
  }

  .sl-tab-close {
    @apply text-xs leading-none cursor-pointer bg-transparent border-none font-mono text-white/20 self-center shrink-0 transition-colors duration-100 p-1;
  }
  .sl-tab-close:hover {
    @apply text-white/60;
  }

  .sl-rename-input {
    @apply absolute top-1/2 -translate-y-1/2 outline-none z-10 text-zinc-100 text-xs
         min-w-16 max-w-32 left-3 border border-amber-400/40 bg-zinc-900;
    padding: 2px 6px;
  }
  .sl-reopen-wrap {
    @apply relative self-center;
  }

  .sl-closed-menu {
    @apply absolute bottom-full left-0 mb-1 flex flex-col min-w-32 max-w-48
           border border-white/10 bg-zinc-900 shadow-xl z-50;
  }

  .sl-closed-item {
    @apply text-left text-xs text-zinc-300 px-3 py-2 cursor-pointer truncate
           border-none bg-transparent w-full;
  }
  .sl-closed-item:hover {
    @apply bg-white/5 text-amber-300;
  }
</style>
