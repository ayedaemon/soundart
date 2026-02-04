<script lang="ts">
  import type { AudioMetrics, TransformType } from '$lib/types';
  import { Slider, Select, Toggle } from '$lib/ui/controls';
  
  export let layerId: string;
  export let propertyId: string;
  export let source: keyof AudioMetrics = 'beat';
  export let sensitivity: number = 1.0;
  export let transform: TransformType = 'linear';
  export let enabled: boolean = true;
  
  const audioSources: { value: keyof AudioMetrics; label: string }[] = [
    { value: 'beat', label: 'Beat' },
    { value: 'energy', label: 'Energy' },
    { value: 'treble', label: 'Treble' },
    { value: 'bass', label: 'Bass' },
    { value: 'mids', label: 'Mids' },
    { value: 'highs', label: 'Highs' },
    { value: 'lows', label: 'Lows' }
  ];
  
  const transformTypes: { value: TransformType; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'exponential', label: 'Exponential' },
    { value: 'envelope', label: 'Envelope' },
    { value: 'threshold', label: 'Threshold' },
    { value: 'gate', label: 'Gate' },
    { value: 'compress', label: 'Compress' },
    { value: 'quantize', label: 'Quantize' }
  ];
</script>

<div class="mapping-editor">
  <div class="mapping-header">
    <span class="mapping-label">Audio Mapping</span>
    <Toggle label="" bind:checked={enabled} />
  </div>
  
  {#if enabled}
    <div class="mapping-controls">
      <Select
        label="Source"
        bind:value={source}
        options={audioSources}
      />
      
      <Slider
        label="Sensitivity"
        bind:value={sensitivity}
        min={0}
        max={2}
        step={0.01}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
      
      <Select
        label="Transform"
        bind:value={transform}
        options={transformTypes}
      />
    </div>
  {/if}
</div>

<style>
  .mapping-editor {
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
  }
  
  .mapping-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  
  .mapping-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
  }
  
  .mapping-controls {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
</style>
