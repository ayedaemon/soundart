<script lang="ts">
  import { appSettings, applyDevicePreset } from '$lib/stores/settings';
  import { performanceStats } from '$lib/stores/performance';
  import { DEVICE_PRESETS, type DevicePreset } from '$lib/types';
  import { profilingState, startProfiling, stopProfiling } from '$lib/stores/profiling';
  import { layerDefinitions } from '$lib/layers/registry';
  
  export let visible: boolean = true;
  
  let showControls = false;
  let showProfiling = false;
  
  $: preset = $appSettings.devicePreset;
  $: presetConfig = DEVICE_PRESETS[preset];
  $: targetFps = $appSettings.targetFps;
  $: resScale = Math.round($appSettings.resolutionScale * 100);
  $: maxLayers = $appSettings.maxActiveLayers;
  $: isEcoMode = preset === 'mobile' || preset === 'laptop';
  $: isAutoMode = preset === 'auto';
  $: isDesktopMode = preset === 'desktop';
  
  // Get preset color based on type
  function getPresetColor(p: DevicePreset): string {
    switch (p) {
      case 'auto': return 'var(--color-primary)';
      case 'desktop': return 'var(--color-primary)';
      case 'laptop': return 'var(--color-warning)';
      case 'mobile': return 'var(--color-success)';
      default: return 'var(--color-primary)';
    }
  }
  
  $: presetColor = getPresetColor(preset);
  
  $: fpsColor = $performanceStats.fps >= targetFps * 0.9 
    ? 'var(--color-success)' 
    : $performanceStats.fps >= targetFps * 0.5 
      ? 'var(--color-warning, #f59e0b)' 
      : 'var(--color-error, #ef4444)';
  
  
  $: resSavings = Math.round((1 - $appSettings.resolutionScale) * 100);
  $: fpsSavings = Math.round((1 - targetFps / 60) * 100);
  $: totalSavings = Math.round((1 - (targetFps / 60) * $appSettings.resolutionScale) * 100);
  
  $: isProfiling = $profilingState.isActive;
  $: profilingProgress = $profilingState.progress;
  $: currentLayerIndex = $profilingState.currentLayerIndex;
  $: profilingResults = $profilingState.results;
  $: currentLayerName = currentLayerIndex >= 0 
    ? layerDefinitions[currentLayerIndex]?.label || 'Unknown'
    : '';
  $: progressPercent = Math.round(profilingProgress * 100);
  
  const presets: DevicePreset[] = ['auto', 'desktop', 'laptop', 'mobile'];
  
  function handleStartProfiling() {
    startProfiling();
  }
  
  function handleStopProfiling() {
    stopProfiling();
  }
</script>

{#if visible}
<div class="panel perf-panel" class:eco-mode={isEcoMode} data-preset={preset}>
  <div class="panel-header">
    <span class="panel-title">PERFORMANCE</span>
    <div class="header-actions">
      <button 
        class="toggle-controls" 
        on:click={() => showProfiling = !showProfiling}
        title="Show layer profiling"
        class:active={showProfiling}
      >
        📊
      </button>
      <button 
        class="toggle-controls" 
        on:click={() => showControls = !showControls}
        title="Show performance controls"
      >
        {showControls ? '−' : '+'}
      </button>
    </div>
  </div>
  
  
  <div class="stats-grid">
    <div class="stat">
      <span class="label">FPS</span>
      <span class="value" style="color: {fpsColor}">{$performanceStats.fps}</span>
      <span class="target">/ {targetFps}</span>
    </div>
    
    <div class="stat">
      <span class="label">Frame</span>
      <span class="value">{$performanceStats.frameTime.toFixed(1)}</span>
      <span class="unit">ms</span>
    </div>
    
    {#if isEcoMode && totalSavings > 0}
    <div class="stat savings">
      <span class="label">Saved</span>
      <span class="value success">~{totalSavings}%</span>
    </div>
    {/if}
  </div>
  
  {#if showControls}
  <div class="divider"></div>
  
  
  <div class="controls-grid">
    <div class="preset-section">
      <span class="section-label">Device Preset</span>
      <div class="presets">
        {#each presets as p}
          {@const config = DEVICE_PRESETS[p]}
          <button 
            class="preset-btn" 
            class:active={preset === p}
            data-preset={p}
            on:click={() => applyDevicePreset(p)}
            title="{config.label}: {config.targetFps}fps, {Math.round(config.resolutionScale * 100)}% res, max {config.maxActiveLayers} layers, quality {Math.round(config.qualityLevel * 100)}%, FFT {config.audioFftSize}, sensitivity {config.audioSensitivity.toFixed(1)}x"
          >
            <span class="preset-icon">{config.icon}</span>
            <span class="preset-name">{config.label}</span>
          </button>
        {/each}
      </div>
    </div>
    
    
    <div class="settings-summary">
      <div class="setting-row">
        <span class="setting-label">FPS Limit</span>
        <span class="setting-value">{targetFps}</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Resolution</span>
        <span class="setting-value">{resScale}%</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">Max Layers</span>
        <span class="setting-value">{maxLayers}</span>
      </div>
    </div>
  </div>
  {/if}
  
  {#if showProfiling}
  <div class="divider"></div>
  
  <div class="profiling-section">
    <span class="section-label">Layer Profiling</span>
    
    {#if isProfiling}
      <div class="profiling-active">
        <div class="profiling-status">
          <span class="status-label">Profiling:</span>
          <span class="status-value">{currentLayerName}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercent}%"></div>
        </div>
        <div class="progress-text">{progressPercent}%</div>
        <button 
          class="profiling-btn stop"
          on:click={handleStopProfiling}
        >
          Stop
        </button>
      </div>
    {:else if profilingResults.length > 0}
      <div class="profiling-results">
        <div class="results-header">
          <span>GPU Cost Ranking</span>
          <button 
            class="profiling-btn small"
            on:click={handleStartProfiling}
          >
            Re-run
          </button>
        </div>
        <div class="results-list">
          {#each profilingResults.slice(0, 5) as result, i}
            <div class="result-item">
              <span class="result-rank">#{i + 1}</span>
              <span class="result-name">{result.layerName}</span>
              <span class="result-cost" style="color: {i === 0 ? 'var(--color-error)' : i < 3 ? 'var(--color-warning)' : 'var(--color-text-dim)'}">
                {result.relativeCost.toFixed(1)}x
              </span>
            </div>
          {/each}
          {#if profilingResults.length > 5}
            <div class="result-more">+{profilingResults.length - 5} more</div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="profiling-idle">
        <p class="profiling-hint">Profile each layer to measure GPU cost</p>
        <button 
          class="profiling-btn start"
          on:click={handleStartProfiling}
        >
          Start Profiling
        </button>
      </div>
    {/if}
  </div>
  {/if}
  
  <div class="panel-footer">
    <span class="hint">
      {#if isEcoMode}
        {presetConfig.icon} {presetConfig.label} mode ({totalSavings}% lighter)
      {:else}
        🖥️ Full quality mode
      {/if}
    </span>
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
  
  .perf-panel {
    bottom: 8px;
    right: 8px;
    min-width: 140px;
    padding: 6px 8px;
  }
  
  .perf-panel.eco-mode {
    border-color: var(--color-success, #10b981);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
  }
  
  .perf-panel[data-preset="laptop"] {
    border-color: var(--color-warning, #f59e0b);
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
  }
  
  .perf-panel[data-preset="mobile"] {
    border-color: var(--color-success, #10b981);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
  }
  
  .perf-panel[data-preset="auto"],
  .perf-panel[data-preset="desktop"] {
    border-color: var(--color-primary, #6366f1);
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
  }
  
  .header-actions {
    display: flex;
    gap: 4px;
  }
  
  .panel-title {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--color-accent);
  }
  
  .toggle-controls {
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
  
  .toggle-controls:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
  }
  
  .toggle-controls.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
  }
  
  .stats-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .stat {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  
  .stat .label {
    font-size: 9px;
    color: var(--color-text-muted);
    min-width: 36px;
  }
  
  .stat .value {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
  
  .stat .value.success {
    color: var(--color-success, #22c55e);
  }
  
  .stat .target,
  .stat .unit {
    font-size: 9px;
    color: var(--color-text-dim);
  }
  
  .stat.savings {
    padding-top: 4px;
    border-top: 1px solid var(--color-border);
    margin-top: 2px;
  }
  
  .divider {
    height: 1px;
    background: var(--color-border);
    margin: 6px 0;
  }
  
  .controls-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .preset-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .section-label {
    font-size: 9px;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }
  
  .presets {
    display: flex;
    gap: 4px;
  }
  
  .preset-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text-dim);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .preset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }
  
  .preset-btn.active[data-preset="auto"],
  .preset-btn.active[data-preset="desktop"] {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .preset-btn.active[data-preset="laptop"] {
    background: rgba(245, 158, 11, 0.2);
    border-color: var(--color-warning);
    color: var(--color-text);
  }
  
  .preset-btn.active[data-preset="mobile"] {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--color-success);
    color: var(--color-text);
  }
  
  .preset-icon {
    font-size: 14px;
    line-height: 1;
  }
  
  .preset-name {
    font-size: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .settings-summary {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    margin-top: 4px;
  }
  
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .setting-label {
    font-size: 8px;
    color: var(--color-text-muted);
  }
  
  .setting-value {
    font-size: 9px;
    font-weight: 600;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
  
  .panel-footer {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid var(--color-border);
  }
  
  .hint {
    font-size: 8px;
    color: var(--color-text-dim);
  }
  
  .eco-mode .hint {
    color: var(--color-success);
  }
  
  .profiling-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 4px;
  }
  
  .profiling-active {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .profiling-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
  }
  
  .status-label {
    color: var(--color-text-muted);
  }
  
  .status-value {
    color: var(--color-primary);
    font-weight: 600;
  }
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.1s linear;
  }
  
  .progress-text {
    font-size: 8px;
    color: var(--color-text-dim);
    text-align: right;
  }
  
  .profiling-btn {
    padding: 4px 8px;
    font-size: 9px;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .profiling-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--color-border-hover);
  }
  
  .profiling-btn.start {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--color-success);
    color: var(--color-success);
  }
  
  .profiling-btn.start:hover {
    background: rgba(16, 185, 129, 0.3);
  }
  
  .profiling-btn.stop {
    background: rgba(239, 68, 68, 0.2);
    border-color: var(--color-error);
    color: var(--color-error);
  }
  
  .profiling-btn.stop:hover {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .profiling-btn.small {
    padding: 2px 6px;
    font-size: 8px;
  }
  
  .profiling-idle {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .profiling-hint {
    font-size: 8px;
    color: var(--color-text-dim);
    margin: 0;
  }
  
  .profiling-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: var(--color-text-muted);
  }
  
  .results-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 8px;
    padding: 2px 0;
  }
  
  .result-rank {
    color: var(--color-text-dim);
    font-weight: 600;
    min-width: 16px;
  }
  
  .result-name {
    flex: 1;
    color: var(--color-text);
  }
  
  .result-cost {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  
  .result-more {
    font-size: 7px;
    color: var(--color-text-dim);
    text-align: center;
    padding-top: 2px;
  }
  
  @media (max-width: 1023px) {
    .perf-panel {
      display: none;
    }
  }
</style>
