<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import VisualizerCanvas from '$lib/ui/canvas/VisualizerCanvas.svelte';
  import ControlsPanel from '$lib/ui/panels/ControlsPanel.svelte';
  import LayersPanel from '$lib/ui/panels/LayersPanel.svelte';
  import AudioLevelsPanel from '$lib/ui/panels/AudioLevelsPanel.svelte';
  import AudioTuningPanel from '$lib/ui/panels/AudioTuningPanel.svelte';
  import PerformancePanel from '$lib/ui/panels/PerformancePanel.svelte';
  import InfoPanel from '$lib/ui/panels/InfoPanel.svelte';
  import { micEnabled } from '$lib/stores/audio';
  import { appSettings, togglePanels, adjustGlobalZoom, adjustGlobalSpeed, cycleRandomizerMode, cycleStrobeMode, cycleDevicePreset, applyDevicePreset } from '$lib/stores/settings';
  import { DEVICE_PRESETS } from '$lib/types';
  import { get } from 'svelte/store';
  import { detectDeviceCapabilities, deviceCapabilities } from '$lib/stores/device';

  let visualizerCanvas: VisualizerCanvas;
  let infoVisible = false;
  let cursorHidden = false;
  let cursorTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const INFO_STORAGE_KEY = 'soundart-seen-info';
  const CURSOR_HIDE_DELAY = 3000; 
  
  async function handleEnableMic(): Promise<boolean> {
    if (visualizerCanvas) {
      return await visualizerCanvas.enableMicrophone();
    }
    return false;
  }
  
  function handleDisableMic(): void {
    if (visualizerCanvas) {
      visualizerCanvas.disableMicrophone();
    }
  }
  
  async function toggleMic(): Promise<void> {
    if ($micEnabled) {
      handleDisableMic();
    } else {
      await handleEnableMic();
    }
  }
  
  function showInfo() {
    infoVisible = true;
  }
  
  function hideInfo() {
    infoVisible = false;
    
    if (browser) {
      localStorage.setItem(INFO_STORAGE_KEY, 'true');
    }
  }
  
  function toggleInfo() {
    if (infoVisible) {
      hideInfo();
    } else {
      showInfo();
    }
  }
  
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (event.key) {
      
      case 'ArrowUp':
        event.preventDefault();
        if (!infoVisible) adjustGlobalZoom(0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!infoVisible) adjustGlobalZoom(-0.1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (!infoVisible) adjustGlobalSpeed(0.1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (!infoVisible) adjustGlobalSpeed(-0.1);
        break;
      
      case 'm':
      case 'M':
        if (!infoVisible) toggleMic();
        break;
      
      case 'f':
      case 'F':
        if (!infoVisible) handleFullscreenToggle();
        break;
      
      case 'h':
      case 'H':
        togglePanels();
        break;
      case '?':
        toggleInfo();
        break;
      
      case 'r':
      case 'R':
        if (!infoVisible) cycleRandomizerMode();
        break;
      
      case 's':
      case 'S':
        if (!infoVisible) cycleStrobeMode();
        break;
      
      case 'p':
      case 'P':
        if (!infoVisible) cycleDevicePreset();
        break;
    }
  }
  
  async function handleFullscreenToggle() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: true }));
    } else {
      await document.exitFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: false }));
    }
  }
  
  function handleFullscreenChange() {
    appSettings.update(s => ({ ...s, fullscreen: !!document.fullscreenElement }));
  }
  
  
  function resetCursorTimeout() {
    
    if (cursorHidden) {
      cursorHidden = false;
    }
    
    
    if (cursorTimeout) {
      clearTimeout(cursorTimeout);
    }
    
    
    cursorTimeout = setTimeout(() => {
      cursorHidden = true;
    }, CURSOR_HIDE_DELAY);
  }
  
  function handleMouseMove() {
    resetCursorTimeout();
  }
  
  
  // Auto mode: automatically apply detected preset settings when device capabilities change
  $: if ($appSettings.devicePreset === 'auto' && $deviceCapabilities.detectedPreset) {
    const caps = get(deviceCapabilities);
    const detectedPreset = caps.detectedPreset;
    const config = DEVICE_PRESETS[detectedPreset];
    
    // Only update if settings don't match (avoid infinite loops)
    const current = get(appSettings);
    if (current.targetFps !== config.targetFps || 
        current.resolutionScale !== config.resolutionScale ||
        current.maxActiveLayers !== config.maxActiveLayers ||
        current.feedbackEnabled !== config.feedbackEnabled) {
      applyDevicePreset('auto');
    }
  }

  onMount(() => {
    detectDeviceCapabilities();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    
    resetCursorTimeout();
    
    
    if (browser && !localStorage.getItem(INFO_STORAGE_KEY)) {
      
      setTimeout(() => {
        infoVisible = true;
      }, 800);
    }
    
    
    const micDelay = localStorage.getItem(INFO_STORAGE_KEY) ? 500 : 1500;
    setTimeout(() => {
      handleEnableMic();
    }, micDelay);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (cursorTimeout) {
        clearTimeout(cursorTimeout);
      }
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove} />

<main class="app" class:cursor-hidden={cursorHidden}>
  <VisualizerCanvas bind:this={visualizerCanvas} />
  
  
  <ControlsPanel onEnableMic={handleEnableMic} onDisableMic={handleDisableMic} onShowInfo={showInfo} visible={$appSettings.panelsVisible} />
  <LayersPanel visible={$appSettings.panelsVisible} />
  <AudioLevelsPanel visible={$appSettings.panelsVisible} />
  <AudioTuningPanel visible={$appSettings.panelsVisible} />
  <PerformancePanel visible={$appSettings.panelsVisible} />
  
  <InfoPanel visible={infoVisible} onClose={hideInfo} />
</main>

<style>
  .app {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .app.cursor-hidden {
    cursor: none;
  }
  
  
  .app.cursor-hidden :global(*) {
    cursor: none !important;
  }
</style>
