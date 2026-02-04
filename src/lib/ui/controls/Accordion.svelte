<script lang="ts">
  export let title: string;
  export let expanded: boolean = false;
  
  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="accordion" class:expanded>
  <button 
    class="accordion-header" 
    on:click={toggle}
    aria-expanded={expanded}
    type="button"
  >
    <span class="accordion-icon">{expanded ? '−' : '+'}</span>
    <span class="accordion-title">{title}</span>
  </button>
  
  {#if expanded}
    <div class="accordion-body">
      <slot />
    </div>
  {/if}
</div>

<style>
  .accordion {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  
  .accordion-header {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 4px 6px;
    background: rgba(0, 0, 0, 0.2);
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background var(--transition-fast);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text);
  }
  
  .accordion-icon {
    font-size: 10px;
    opacity: 0.5;
    width: 10px;
    text-align: center;
  }
  
  .accordion-title {
    font-weight: 500;
  }
  
  .accordion-body {
    padding: 6px;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
