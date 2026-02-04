<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let label: string;
  export let value: number | string;
  export let options: { value: number | string; label: string; preview?: string }[] = [];
  export let compact: boolean = true;
  
  const dispatch = createEventDispatcher<{ change: number | string }>();
  
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = isNaN(Number(target.value)) ? target.value : Number(target.value);
    dispatch('change', value);
  }
</script>

<div class="select-wrapper" class:compact>
  <span class="select-label">{label}</span>
  <div class="select-container">
    {#if options.find(o => o.value === value)?.preview}
      <span 
        class="select-preview" 
        style="background: {options.find(o => o.value === value)?.preview}"
      ></span>
    {/if}
    <select {value} on:change={handleChange} aria-label={label}>
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .select-wrapper.compact {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  
  .select-label {
    font-size: 10px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }
  
  .compact .select-label {
    min-width: 40px;
  }
  
  .select-container {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  
  .select-preview {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  
  select {
    flex: 1;
    min-width: 0;
  }
</style>
