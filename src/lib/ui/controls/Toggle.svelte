<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let checked: boolean = false;
  export let disabled: boolean = false;
  export let compact: boolean = true;

  const dispatch = createEventDispatcher<{ change: boolean }>();
  
  function handleClick() {
    if (!disabled) {
      checked = !checked;
      dispatch('change', checked);
    }
  }
</script>

<button
  class="toggle"
  class:checked
  class:disabled
  class:compact
  on:click={handleClick}
  aria-pressed={checked}
  {disabled}
  type="button"
>
  <span class="toggle-indicator"></span>
  <span class="toggle-label">{label}</span>
</button>

<style>
  .toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 10px;
  }
  
  .toggle:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-border-hover);
  }
  
  .toggle.checked {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .toggle.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  .toggle-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-dim);
    transition: background var(--transition-fast);
  }
  
  .toggle.checked .toggle-indicator {
    background: var(--color-success);
  }
  
  .toggle-label {
    white-space: nowrap;
  }
</style>
