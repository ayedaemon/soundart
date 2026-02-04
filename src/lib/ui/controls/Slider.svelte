<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let label: string;
  export let value: number;
  export let min: number = 0;
  export let max: number = 1;
  export let step: number = 0.01;
  export let showValue: boolean = true;
  export let formatValue: (v: number) => string = (v) => v.toFixed(2);
  export let compact: boolean = true;
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher<{ input: number }>();
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = parseFloat(target.value);
    dispatch('input', value);
  }
</script>

<div class="slider" class:compact>
  <div class="slider-header">
    <span class="slider-label">{label}</span>
    {#if showValue}
      <span class="slider-value">{formatValue(value)}</span>
    {/if}
  </div>
  <input
    type="range"
    {min}
    {max}
    {step}
    {value}
    {disabled}
    on:input={handleInput}
    aria-label={label}
  />
</div>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .slider.compact {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  
  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    min-width: 0;
  }
  
  .compact .slider-header {
    flex-shrink: 0;
    min-width: 70px;
  }
  
  .slider-label {
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .slider-value {
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    font-size: 9px;
    opacity: 0.8;
    margin-left: 4px;
  }
  
  input[type="range"] {
    flex: 1;
    min-width: 0;
  }
</style>
