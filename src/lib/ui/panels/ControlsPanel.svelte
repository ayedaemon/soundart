<script lang="ts">
  import { micEnabled } from '$lib/stores/audio';
  import { appSettings, cycleRandomizerMode, cycleStrobeMode, cycleDevicePreset } from '$lib/stores/settings';
  import type { DevicePreset } from '$lib/types';
  import { DEVICE_PRESETS } from '$lib/types';
  
  export let onEnableMic: () => Promise<boolean>;
  export let onDisableMic: () => void;
  export let onShowInfo: () => void;
  export let visible: boolean = true;
  
  let micLoading = false;
  
  
  $: presetConfig = DEVICE_PRESETS[$appSettings.devicePreset];
  $: preset = $appSettings.devicePreset;
  $: isAutoMode = preset === 'auto';
  $: isDesktopMode = preset === 'desktop';
  $: isLaptopMode = preset === 'laptop';
  $: isMobileMode = preset === 'mobile';
  $: displayLabel = presetConfig.label.toUpperCase();
  $: displayIcon = presetConfig.icon;
  
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

  async function handleMicClick() {
    if ($micEnabled) {
      
      onDisableMic();
      return;
    }
    
    micLoading = true;
    await onEnableMic();
    micLoading = false;
  }
  
  async function handleFullscreenClick() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: true }));
    } else {
      await document.exitFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: false }));
    }
  }
</script>

{#if visible}
<div class="panel controls-panel">
  <div class="panel-header">
    <span class="panel-title">CONTROLS</span>
  </div>
  
  <div class="controls-grid">
    <button
      class="ctrl-btn mic"
      class:active={$micEnabled}
      class:loading={micLoading}
      on:click={handleMicClick}
      disabled={micLoading}
      title="Enable microphone to let visuals react to music and sounds around you"
    >
      <span class="indicator" class:on={$micEnabled}></span>
      <span class="label">{#if micLoading}...{:else if $micEnabled}MIC ON{:else}MIC OFF{/if}</span>
    </button>
    
    <button
      class="ctrl-btn"
      class:active={$appSettings.fullscreen}
      on:click={handleFullscreenClick}
      title="Enter or exit fullscreen mode for an immersive experience"
    >
      <span class="label">FULLSCR</span>
    </button>
    
    <button
      class="ctrl-btn"
      on:click={cycleRandomizerMode}
      title="Randomizer preset: Flow / Chaos / Subtle"
    >
      <span class="label">RND: {$appSettings.randomizerMode.toUpperCase()}</span>
    </button>

    <button
      class="ctrl-btn"
      on:click={cycleStrobeMode}
      title="Strobe preset: Flash / Pulse / Drift"
    >
      <span class="label">STR: {$appSettings.strobeMode.toUpperCase()}</span>
    </button>
    
    <button
      class="ctrl-btn device-preset"
      class:active={isAutoMode}
      class:desktop={isDesktopMode}
      class:laptop={isLaptopMode}
      class:mobile={isMobileMode}
      data-preset={preset}
      on:click={cycleDevicePreset}
      title="Device preset: {presetConfig.label} ({presetConfig.targetFps}fps, {Math.round(presetConfig.resolutionScale * 100)}% res, max {presetConfig.maxActiveLayers} layers, quality {Math.round(presetConfig.qualityLevel * 100)}%)"
    >
      <span class="label">{displayIcon} {displayLabel}</span>
    </button>
    
    <button
      class="ctrl-btn"
      on:click={onShowInfo}
      title="Show help and information (press ?)"
    >
      <span class="label">HELP</span>
    </button>
  </div>
  
  <div class="panel-footer" title="Keyboard shortcuts for quick access">
    <kbd>↑↓</kbd> zoom <kbd>←→</kbd> speed <kbd>M</kbd> mic <kbd>F</kbd> full <kbd>P</kbd> preset <kbd>H</kbd> panels <kbd>?</kbd> help
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
  
  .controls-panel {
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 8px;
    max-width: calc(100vw - 16px);
  }
  
  .panel-header {
    display: flex;
    justify-content: center;
    margin-bottom: 6px;
  }
  
  .panel-title {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--color-accent);
  }
  
  .controls-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
  
  .ctrl-btn {
    display: flex;
    align-items: center;
    gap: 4px;
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
    min-height: 32px;
  }
  
  .ctrl-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }
  
  .ctrl-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .ctrl-btn.device-preset.active,
  .ctrl-btn.device-preset.desktop {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .ctrl-btn.device-preset.laptop {
    background: rgba(245, 158, 11, 0.3);
    border-color: var(--color-warning);
    color: var(--color-text);
  }
  
  .ctrl-btn.device-preset.mobile {
    background: rgba(16, 185, 129, 0.3);
    border-color: var(--color-success);
    color: var(--color-text);
  }
  
  .ctrl-btn.mic {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--color-primary);
  }
  
  .ctrl-btn:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  
  .indicator {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-text-dim);
  }
  
  .indicator.on {
    background: var(--color-success);
    box-shadow: 0 0 4px var(--color-success);
  }
  
  .loading {
    animation: pulse 0.8s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  .panel-footer {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--color-border);
    font-size: 8px;
    color: var(--color-text-dim);
    text-align: center;
  }
  
  .panel-footer kbd {
    display: inline-block;
    padding: 1px 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    font-size: 8px;
    margin-right: 2px;
  }
  
  
  @media (max-width: 767px) {
    .controls-panel {
      top: 4px;
      padding: 4px 6px;
    }
    
    .ctrl-btn {
      padding: 6px 10px;
      min-height: 34px;
      font-size: 10px;
    }
    
    .panel-footer {
      display: none;
    }
  }
  
  
  @media (max-width: 480px) {
    .controls-panel {
      left: 4px;
      right: 4px;
      transform: none;
      width: auto;
    }
    
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    
    .ctrl-btn {
      justify-content: center;
      padding: 8px 4px;
      min-height: 38px;
    }
    
    .panel-header {
      display: none;
    }
  }
</style>
