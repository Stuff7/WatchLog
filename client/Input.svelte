<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    value = $bindable(),
    placeholder,
    class: klass = "",
    ...props
  }: HTMLInputAttributes = $props();
</script>

<label
  class="group relative flex w-full flex-row-reverse items-center justify-end gap-2 rounded-md px-3 py-1.5 transition-all cursor-text"
>
  <input
    {...props}
    bind:value
    placeholder={placeholder || " "}
    class="peer order-2 block w-full border-0 p-0 text-sm leading-tight text-neutral-100
    placeholder-neutral-500 bg-transparent focus:ring-0 focus:outline-none appearance-none truncate font-mono {klass}"
  />

  <span
    class="hidden peer-[:not(:placeholder-shown)]:flex items-center shrink-0 text-xs
    font-bold uppercase tracking-wider text-amber-300 select-none leading-none"
  >
    {placeholder}
  </span>

  <div
    class="absolute inset-0 rounded-md border border-neutral-800 transition-colors pointer-events-none
    peer-[:not(:placeholder-shown)]:border-neutral-400
    group-hover:border-neutral-100
    group-focus-within:!border-amber-300"
  ></div>
</label>

<style>
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
