<script lang="ts">
  import type { LayerDefinition, LayerParameter } from '$lib/core/types/layer';
  import type { LayerState } from '$lib/types';
  import { toggleLayer, updateLayerProperty, toggleRandomizerInclusion } from '$lib/stores/layers';
  import { themeDefinitions } from '$lib/stores/themes';
  import { Slider, Select, Toggle } from './ui';
  
  export let definition: LayerDefinition;
  export let state: LayerState;
  
  let expanded = false;
  
  function handleToggle() {
    toggleLayer(definition.id);
  }
  
  function toggleExpanded() {
    expanded = !expanded;
  }
  
  const themeOptions = themeDefinitions.map(t => ({
    value: t.id,
    label: t.label,
    preview: t.preview
  }));

  const getLabel = (prop: LayerParameter) => prop.ui?.shortLabel ?? prop.label;

  const getSliderStep = (prop: LayerParameter) => (
    prop.type === 'int' ? (prop.step ?? 1) : (prop.step ?? 0.01)
  );

  const getSelectOptions = (prop: LayerParameter) => (
    prop.id === 'theme' ? themeOptions : (prop.type === 'select' ? prop.options : [])
  );

  const getToggleValue = (value: number | boolean | undefined, fallback: boolean) => (
    typeof value === 'boolean' ? value : fallback
  );
</script>

<div class="layer-card" class:disabled={!state.enabled} class:expanded>
  <div class="layer-header">
    <button class="layer-toggle" on:click={handleToggle} type="button">
      <span class="indicator" class:active={state.enabled}></span>
      <span class="layer-name">{definition.label}</span>
    </button>
    
    <div class="layer-actions">
      {#if definition.randomizable !== false}
        <button 
          class="action-btn"
          class:included={state.includeInRandomizer}
          on:click={() => toggleRandomizerInclusion(definition.id)}
          title="Randomizer"
          type="button"
        >
          R
        </button>
      {/if}
      <button class="action-btn" on:click={toggleExpanded} type="button">
        {expanded ? '−' : '+'}
      </button>
    </div>
  </div>
  
  {#if expanded}
    <div class="layer-controls">
      {#each definition.properties as prop (prop.id)}
        {#if prop.type === 'float' || prop.type === 'int'}
          <Slider
            label={getLabel(prop)}
            value={state.properties[prop.id] ?? prop.default}
            min={prop.min}
            max={prop.max}
            step={getSliderStep(prop)}
            on:input={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
          />
        {:else if prop.type === 'select'}
          <Select
            label={getLabel(prop)}
            value={state.properties[prop.id] ?? prop.default}
            options={getSelectOptions(prop)}
            on:change={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
          />
        {:else if prop.type === 'boolean'}
          <Toggle
            label={getLabel(prop)}
            checked={getToggleValue(state.properties[prop.id], prop.default)}
            on:change={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
          />
        {:else}
          <div class="unsupported-prop" title={`Unsupported parameter type: ${prop.type}`}>
            {getLabel(prop)}: Unsupported
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .layer-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  
  .layer-card:hover {
    border-color: var(--color-border-hover);
  }
  
  .layer-card.disabled {
    opacity: 0.5;
  }
  
  .layer-card.expanded {
    border-color: var(--color-primary);
  }
  
  .layer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 6px;
  }
  
  .layer-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--color-text);
    cursor: pointer;
    padding: 0;
    font-size: 10px;
  }
  
  .indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-dim);
    transition: background var(--transition-fast);
  }
  
  .indicator.active {
    background: var(--color-success);
  }
  
  .layer-name {
    font-weight: 500;
    white-space: nowrap;
  }
  
  .layer-actions {
    display: flex;
    gap: 2px;
  }
  
  .action-btn {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-text-dim);
    font-size: 9px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }
  
  .action-btn.included {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .layer-controls {
    padding: 6px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .unsupported-prop {
    font-size: 9px;
    color: var(--color-warning);
    opacity: 0.8;
  }
</style>
