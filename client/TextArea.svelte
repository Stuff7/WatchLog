<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  let {
    value = $bindable(),
    placeholder,
    class: klass = "",
    ...props
  }: HTMLTextareaAttributes = $props();
</script>

<label class="field-label group">
  <textarea
    {...props}
    bind:value
    placeholder={placeholder || " "}
    class="peer order-2 block w-full border-0 p-0 text-sm leading-tight text-neutral-100
    placeholder-neutral-500 bg-transparent focus:ring-0 focus:outline-none resize-none font-mono {klass}"
  ></textarea>

  <span class="field-label-tag hidden peer-[:not(:placeholder-shown)]:flex">
    {placeholder}
  </span>

  <div
    class="field-border
  peer-[:not(:placeholder-shown)]:!border-neutral-400
  group-hover:!border-neutral-100
  group-focus-within:!border-amber-300"
  ></div>
</label>
