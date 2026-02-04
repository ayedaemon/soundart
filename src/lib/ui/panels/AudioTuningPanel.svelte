<script lang="ts">
  import { audioSettings } from '$lib/stores/audio';
  import { Slider, Toggle, Select } from '$lib/ui/controls';
  
  export let visible: boolean = true;
  
  let showAdvanced = false;
  
  const formatPercent = (v: number) => `${Math.round(v * 100)}%`;
</script>

{#if visible}
<div class="panel tuning-panel">
  <div class="panel-header">
    <span class="panel-title" title="Adjust how visuals respond to audio">TUNING</span>
    <button 
      class="toggle-advanced" 
      on:click={() => showAdvanced = !showAdvanced}
      title="Show more advanced audio controls"
    >
      {showAdvanced ? '−' : '+'}
    </button>
  </div>
  
  <div class="tuning-grid">
    <div title="Overall sensitivity - how much visuals react to sound">
      <Slider label="Sens" bind:value={$audioSettings.sensitivity} min={0} max={2} formatValue={formatPercent} />
    </div>
    <div title="Beat boost - make beat reactions stronger or weaker">
      <Slider label="Beat" bind:value={$audioSettings.beatBoost} min={0} max={2} formatValue={formatPercent} />
    </div>
    <div title="Beat gate - ignore quiet sounds, only react to loud beats">
      <Slider label="Gate" bind:value={$audioSettings.beatGate} min={0} max={1} formatValue={formatPercent} />
    </div>
    
    {#if showAdvanced}
      <div class="divider"></div>
      <div title="Boost high frequency response (cymbals, hi-hats)">
        <Slider label="Hi+" bind:value={$audioSettings.highsBoost} min={0} max={2} formatValue={formatPercent} />
      </div>
      <div title="Boost mid frequency response (vocals, guitars)">
        <Slider label="Mid+" bind:value={$audioSettings.midsBoost} min={0} max={2} formatValue={formatPercent} />
      </div>
      <div title="Boost low frequency response (bass, kick drums)">
        <Slider label="Low+" bind:value={$audioSettings.lowsBoost} min={0} max={2} formatValue={formatPercent} />
      </div>
      <div title="Boost treble (bright, high-pitched sounds)">
        <Slider label="Trbl" bind:value={$audioSettings.trebleBoost} min={0} max={2} formatValue={formatPercent} />
      </div>
      <div title="Boost bass (deep, low-pitched sounds)">
        <Slider label="Bass" bind:value={$audioSettings.bassBoost} min={0} max={2} formatValue={formatPercent} />
      </div>
      <div title="Minimum motion - keep some movement even in silence">
        <Slider label="Min" bind:value={$audioSettings.minMotion} min={0} max={0.1} step={0.005} formatValue={formatPercent} />
      </div>
      
      <div class="divider"></div>
      <div title="Automatically adjust settings based on audio levels">
        <Toggle label="Auto Suggest" bind:checked={$audioSettings.autoEnabled} />
      </div>
      {#if $audioSettings.autoEnabled}
        <div title="How strongly auto-adjust affects the visuals">
          <Slider label="Str" bind:value={$audioSettings.autoStrength} min={0} max={1} formatValue={formatPercent} />
        </div>
        <div title="How quickly auto-adjustments fade back to normal">
          <Slider label="Dec" bind:value={$audioSettings.autoDecay} min={0} max={1} formatValue={formatPercent} />
        </div>
        <div title="Which audio metric to use for auto-adjustment">
          <Select
            label="Tgt"
            bind:value={$audioSettings.autoTarget}
            options={[
              { value: 'all', label: 'All' },
              { value: 'energy', label: 'Energy' },
              { value: 'treble', label: 'Treble' },
              { value: 'beat', label: 'Beat' }
            ]}
          />
        </div>
      {/if}
    {/if}
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
  
  .tuning-panel {
    bottom: 8px;
    left: 176px;
    width: 180px;
    padding: 6px 8px;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .panel-title {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--color-accent);
  }
  
  .toggle-advanced {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-text-dim);
    font-size: 10px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .toggle-advanced:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }
  
  .tuning-grid {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  
  .divider {
    height: 1px;
    background: var(--color-border);
    margin: 4px 0;
  }
  
  /* Hide on screens smaller than 1024px (low priority panel) */
  @media (max-width: 1023px) {
    .tuning-panel {
      display: none;
    }
  }
</style>
