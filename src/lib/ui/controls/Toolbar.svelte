<script lang="ts">
  import { micEnabled } from '$lib/stores/audio';
  import { appSettings, togglePowerSaver } from '$lib/stores/settings';
  
  export let onEnableMic: () => Promise<boolean>;
  
  let micLoading = false;
  
  async function handleMicClick() {
    if ($micEnabled) return;
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

<div class="toolbar">
  <button
    class="btn primary"
    class:active={$micEnabled}
    class:loading={micLoading}
    on:click={handleMicClick}
    disabled={micLoading}
  >
    <span class="indicator" class:on={$micEnabled}></span>
    {#if micLoading}...{:else if $micEnabled}MIC{:else}ENABLE MIC{/if}
  </button>
  
  <div class="btn-group">
    <button
      class="btn"
      class:active={$appSettings.fullscreen}
      on:click={handleFullscreenClick}
      title="Fullscreen"
    >
      FS
    </button>
    
    <button
      class="btn"
      class:active={$appSettings.powerSaverEnabled}
      on:click={togglePowerSaver}
      title="Power Saver"
    >
      PWR
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .btn-group {
    display: flex;
    gap: 2px;
  }
  
  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 6px;
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
  
  .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }
  
  .btn.primary {
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .btn.primary:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.3);
  }
  
  .btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
  
  .btn:disabled {
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
</style>
