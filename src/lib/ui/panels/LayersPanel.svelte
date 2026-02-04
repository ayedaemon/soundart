<script lang="ts">
  import { layerDefinitions } from '$lib/layers/registry';
  import type { LayerParameter } from '$lib/core/types/layer';
  import { layerStates, toggleLayer, updateLayerProperty, toggleRandomizerInclusion, toggleStrobeInclusion, setAllLayersEnabled, setAllIncludeInRandomizer, setAllIncludeInStrobe, getEnabledLayerCount } from '$lib/stores/layers';
  import { themeDefinitions } from '$lib/stores/themes';
  import { appSettings } from '$lib/stores/settings';
  import { randomizeLayerNow } from '$lib/stores/randomizer';
  import { Slider, Select, Toggle } from '$lib/ui/controls';
  
  export let visible: boolean = true;
  
  let expandedLayers = new Set<string>();
  let showHelp: boolean = false;
  
  $: layerList = layerDefinitions
    .map(def => ({ definition: def, state: $layerStates.get(def.id)! }))
    .filter(l => l.state);
  
  $: allLayersEnabled = layerList.some(l => l.state.enabled);
  $: allInRandomizer = layerList.length > 0 && layerList.every(l => l.state.includeInRandomizer);
  $: allInStrobe = layerList.length > 0 && layerList.every(l => l.state.includeInStrobe);
  $: enabledCount = getEnabledLayerCount($layerStates);
  $: maxLayers = $appSettings.maxActiveLayers;
  $: atLayerLimit = enabledCount >= maxLayers;
  
  function toggleAllLayers() {
    setAllLayersEnabled(!allLayersEnabled, maxLayers);
  }
  
  function handleToggleLayer(layerId: string) {
    toggleLayer(layerId, maxLayers);
  }
  
  const themeOptions = themeDefinitions.map(t => ({
    value: t.id,
    label: t.label,
    preview: t.preview
  }));

  const getShortLabel = (prop: LayerParameter) => prop.ui?.shortLabel ?? prop.label.slice(0, 4);

  const getTooltip = (prop: LayerParameter) => prop.ui?.tooltip ?? (
    prop.id === 'intensity' ? 'How visible/strong this effect is' :
    prop.id === 'zoom' ? 'Scale/size of the effect pattern' :
    prop.id === 'sensitivity' ? 'How much this layer reacts to audio' :
    prop.label
  );

  const getSliderStep = (prop: LayerParameter) => (
    prop.type === 'int' ? (prop.step ?? 1) : (prop.step ?? 0.01)
  );

  const getSelectOptions = (prop: LayerParameter) => (
    prop.id === 'theme' ? themeOptions : (prop.type === 'select' ? prop.options : [])
  );

  const getToggleValue = (value: number | boolean | undefined, fallback: boolean) => (
    typeof value === 'boolean' ? value : fallback
  );
  
  function handleToggleExpand(layerId: string) {
    if (expandedLayers.has(layerId)) {
      expandedLayers.delete(layerId);
    } else {
      expandedLayers.add(layerId);
    }
    expandedLayers = new Set(expandedLayers);
  }
</script>

{#if visible}
<div class="panel layers-panel">
  <div class="panel-header">
    <button 
      class="master-toggle" 
      class:active={allLayersEnabled}
      on:click={toggleAllLayers}
      title={allLayersEnabled ? "Turn off all layers" : "Turn on all layers"}
      type="button"
    >
      <span class="master-indicator"></span>
    </button>
    <span class="panel-title" title="Visual effect layers - toggle and customize each one">LAYERS</span>
    <span class="panel-count" class:at-limit={atLayerLimit} title="Active layers / max allowed">{enabledCount}/{maxLayers}</span>
    <button 
      class="help-btn"
      on:click={() => showHelp = !showHelp}
      title="What do these buttons mean?"
      type="button"
    >
      ?
    </button>
  </div>
  
  {#if showHelp}
  <div class="help-popup">
    <div class="help-header">
      <span>How It Works</span>
      <button class="help-close" on:click={() => showHelp = false} type="button">×</button>
    </div>
    <div class="help-content">
      <div class="help-section">
        <div class="help-title">Layer Controls</div>
        <div class="help-item">
          <span class="help-icon dot green"></span>
          <span>Turn layer on/off</span>
        </div>
        <div class="help-item">
          <span class="help-icon box">+</span>
          <span>Show more settings</span>
        </div>
      </div>
      
      <div class="help-section">
        <div class="help-title">Per-layer buttons</div>
        <div class="help-item">
          <span class="help-icon box">&#x2684;</span>
          <span>Randomize this layer's parameters now</span>
        </div>
        <div class="help-item">
          <span class="help-icon box purple">R</span>
          <span>Include in randomizer (auto parameter changes on beat)</span>
        </div>
        <div class="help-item">
          <span class="help-icon box pink">S</span>
          <span>Include in strobe (layer flashes on/off with beat)</span>
        </div>
      </div>
      
      <div class="help-section">
        <div class="help-title">Global</div>
        <div class="help-item">
          <span class="help-badge">All R</span>
          <span>Include or exclude all layers from randomizer</span>
        </div>
        <div class="help-item">
          <span class="help-badge pink">All S</span>
          <span>Include or exclude all layers from strobe</span>
        </div>
      </div>
    </div>
  </div>
  {/if}
  
  <div class="global-controls">
    <button
      class="global-btn"
      class:active={allInRandomizer}
      on:click={() => setAllIncludeInRandomizer(!allInRandomizer)}
      title={allInRandomizer ? "All layers in randomizer - click to exclude all" : "Include all layers in randomizer (auto parameter changes)"}
      type="button"
    >
      All R
    </button>
    <button
      class="global-btn strobe"
      class:active={allInStrobe}
      on:click={() => setAllIncludeInStrobe(!allInStrobe)}
      title={allInStrobe ? "All layers in strobe - click to exclude all" : "Include all layers in strobe (flash on/off with beat)"}
      type="button"
    >
      All S
    </button>
  </div>
  
  <div class="layer-list">
    {#each layerList as { definition, state } (definition.id)}
      <div class="layer-item" class:disabled={!state.enabled} class:expanded={expandedLayers.has(definition.id)}>
        <div class="layer-row">
          <button 
            class="layer-toggle" 
            on:click={() => handleToggleLayer(definition.id)} 
            type="button"
            title={!state.enabled && atLayerLimit ? `Layer limit reached (${maxLayers} max)` : "Turn this visual effect on or off"}
            disabled={!state.enabled && atLayerLimit}
          >
            <span class="indicator" class:active={state.enabled}></span>
          </button>
          
          <button 
            class="layer-name" 
            on:click={() => handleToggleExpand(definition.id)} 
            type="button"
            title="{definition.description} - click to adjust settings"
          >
            {definition.label}
          </button>
          
          <div class="layer-quick">
            {#if definition.randomizable !== false}
              <button 
                class="quick-btn randomize-btn"
                on:click={() => randomizeLayerNow(definition.id)}
                title="Randomize this layer's parameters now (theme, intensity, zoom, etc.)"
                type="button"
              >
                &#x2684;
              </button>
              <button 
                class="quick-btn random-btn"
                class:active={state.includeInRandomizer}
                on:click={() => toggleRandomizerInclusion(definition.id)}
                title={state.includeInRandomizer 
                  ? "Included in randomizer - click to exclude" 
                  : "Include in randomizer - parameters change automatically with beat"}
                type="button"
              >
                R
              </button>
              <button 
                class="quick-btn strobe-btn"
                class:active={state.includeInStrobe}
                on:click={() => toggleStrobeInclusion(definition.id)}
                title={state.includeInStrobe 
                  ? "Included in strobe - click to exclude" 
                  : "Include in strobe - layer can flash on/off with the beat"}
                type="button"
              >
                S
              </button>
            {/if}
            <button 
              class="quick-btn expand-btn"
              on:click={() => handleToggleExpand(definition.id)}
              type="button"
              title="Expand to see detailed controls for this layer"
            >
              {expandedLayers.has(definition.id) ? '−' : '+'}
            </button>
          </div>
        </div>
        
        {#if expandedLayers.has(definition.id)}
          <div class="layer-controls">
            {#each definition.properties as prop (prop.id)}
              {#if prop.type === 'float' || prop.type === 'int'}
                <div title={getTooltip(prop)}>
                  <Slider
                    label={getShortLabel(prop)}
                    value={state.properties[prop.id] ?? prop.default}
                    min={prop.min}
                    max={prop.max}
                    step={getSliderStep(prop)}
                    on:input={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
                  />
                </div>
              {:else if prop.type === 'select'}
                <div title={prop.ui?.tooltip ?? prop.label}>
                  <Select
                    label={getShortLabel(prop)}
                    value={state.properties[prop.id] ?? prop.default}
                    options={getSelectOptions(prop)}
                    on:change={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
                  />
                </div>
              {:else if prop.type === 'boolean'}
                <div title={prop.ui?.tooltip ?? prop.label}>
                  <Toggle
                    label={getShortLabel(prop)}
                    checked={getToggleValue(state.properties[prop.id], prop.default)}
                    on:change={(e) => updateLayerProperty(definition.id, prop.id, e.detail)}
                  />
                </div>
              {:else}
                <div class="unsupported-prop" title={`Unsupported parameter type: ${prop.type}`}>
                  {getShortLabel(prop)}: Unsupported
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
{/if}

<style>
  .panel {
    position: fixed;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-panel);
  }
  
  .layers-panel {
    top: 60px;
    right: 8px;
    width: 200px;
    max-height: calc(100vh - 130px);
    display: flex;
    flex-direction: column;
  }
  
  
  @media (max-width: 1023px) {
    .layers-panel {
      top: 50px;
      width: 180px;
      max-height: calc(100vh - 100px);
    }
  }
  
  
  @media (max-width: 767px) {
    .layers-panel {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 50vh;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      border-bottom: none;
    }
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .master-toggle {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .master-indicator {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-text-dim);
    border: 2px solid var(--color-border);
    transition: all var(--transition-fast);
  }
  
  .master-toggle:hover .master-indicator {
    border-color: var(--color-success);
  }
  
  .master-toggle.active .master-indicator {
    background: var(--color-success);
    border-color: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
  }
  
  .panel-title {
    flex: 1;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--color-accent);
  }
  
  .panel-count {
    font-size: 9px;
    color: var(--color-text-dim);
  }
  
  .panel-count.at-limit {
    color: var(--color-warning);
  }
  
  .help-btn {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: var(--color-text-dim);
    font-size: 9px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-left: 4px;
  }
  
  .help-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  
  .help-popup {
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin: 0 8px 8px;
    overflow: hidden;
  }
  
  .help-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: rgba(99, 102, 241, 0.2);
    border-bottom: 1px solid var(--color-border);
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text);
  }
  
  .help-close {
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .help-close:hover {
    color: var(--color-text);
  }
  
  .help-content {
    padding: 8px;
  }
  
  .help-section {
    margin-bottom: 10px;
  }
  
  .help-section:last-of-type {
    margin-bottom: 6px;
  }
  
  .help-title {
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-muted);
    margin-bottom: 4px;
  }
  
  .help-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    color: var(--color-text);
    margin-bottom: 3px;
  }
  
  .help-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .help-icon.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin: 0 4px;
  }
  
  .help-icon.dot.green {
    background: var(--color-success);
  }
  
  .help-icon.box {
    width: 16px;
    height: 14px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    font-size: 8px;
    color: var(--color-text-dim);
  }
  
  .help-icon.box.purple {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .help-icon.box.pink {
    background: rgba(236, 72, 153, 0.3);
    border-color: #ec4899;
    color: var(--color-text);
  }
  
  .help-badge {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(99, 102, 241, 0.3);
    border: 1px solid var(--color-primary);
    border-radius: 3px;
    font-size: 8px;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .help-badge.pink {
    background: rgba(236, 72, 153, 0.3);
    border-color: #ec4899;
  }
  
  .help-tip {
    font-size: 9px;
    color: var(--color-text-muted);
    font-style: italic;
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }
  
  .global-controls {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
  }
  
  .global-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .global-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }
  
  .global-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .global-btn.strobe.active {
    background: rgba(236, 72, 153, 0.3);
    border-color: #ec4899;
    animation: strobe-pulse 0.5s infinite;
  }
  
  @keyframes strobe-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .layer-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  
  .layer-item {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    margin-bottom: 2px;
    transition: all var(--transition-fast);
  }
  
  .layer-item:hover {
    border-color: var(--color-border);
  }
  
  .layer-item.disabled {
    opacity: 0.4;
  }
  
  .layer-item.expanded {
    border-color: var(--color-primary);
  }
  
  .layer-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
  }
  
  .layer-toggle {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
  }
  
  .layer-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  
  .indicator {
    display: block;
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
    flex: 1;
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 10px;
    text-align: left;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .layer-quick {
    display: flex;
    gap: 2px;
  }
  
  .quick-btn {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-text-dim);
    font-size: 8px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .quick-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }
  
  .quick-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .quick-btn.strobe-btn.active {
    background: rgba(236, 72, 153, 0.3);
    border-color: #ec4899;
  }
  
  
  .quick-btn.pending {
    background: rgba(255, 255, 255, 0.08);
    border-style: dashed;
    color: var(--color-text-muted);
  }
  
  .quick-btn.random-btn.pending {
    border-color: rgba(99, 102, 241, 0.5);
  }
  
  .quick-btn.strobe-btn.pending {
    border-color: rgba(236, 72, 153, 0.5);
  }
  
  .layer-controls {
    padding: 4px 6px;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .unsupported-prop {
    font-size: 9px;
    color: var(--color-warning);
    opacity: 0.8;
  }
  
  
  @media (max-width: 767px) {
    .panel-header {
      padding: 8px 12px;
    }
    
    .global-controls {
      padding: 8px 12px;
    }
    
    .global-btn {
      padding: 10px 12px;
      font-size: 11px;
      min-height: 38px;
    }
    
    .layer-list {
      padding: 6px;
    }
    
    .layer-row {
      padding: 6px 8px;
      gap: 8px;
    }
    
    .layer-toggle {
      padding: 4px;
    }
    
    .indicator {
      width: 8px;
      height: 8px;
    }
    
    .layer-name {
      font-size: 11px;
    }
    
    .quick-btn {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }
    
    .layer-controls {
      padding: 6px 10px;
      gap: 4px;
    }
    
    .help-btn {
      width: 22px;
      height: 22px;
      font-size: 11px;
    }
    
    .master-indicator {
      width: 12px;
      height: 12px;
    }
  }
</style>
