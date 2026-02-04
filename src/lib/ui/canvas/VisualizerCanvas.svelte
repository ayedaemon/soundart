<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AudioEngine } from '$lib/engine/AudioEngine';
  import { RenderEngine } from '$lib/engine/RenderEngine';
  import type { MainMessage } from '$lib/engine/WorkerBridge';
  import { audioMetrics, micEnabled, autoEnvelope, audioSettings } from '$lib/stores/audio';
  import { layerUniforms } from '$lib/stores/layers';
  import { appSettings } from '$lib/stores/settings';
  import { deviceCapabilities } from '$lib/stores/device';
  import { DEVICE_PRESETS } from '$lib/types';
  import { get } from 'svelte/store';
  import { updateRandomizer } from '$lib/stores/randomizer';
  import { 
    processedMouse, 
    updateMousePosition, 
    setMouseDown, 
    setMouseUp, 
    setMouseLeave 
  } from '$lib/stores/mouse';
  import { performanceStats } from '$lib/stores/performance';
  import { layerDefinitions } from '$lib/layers/registry';
  import type { LayerConfig } from '$lib/core/types/layer';
  import { layerStates } from '$lib/stores/layers';
  import { featureRegistry } from '$lib/features/FeatureRegistry';
  import { layerProfiler } from '$lib/utils/layerProfiler';
  import { updateProfilingProgress } from '$lib/stores/profiling';
  
  let canvas: HTMLCanvasElement;
  let renderEngine: RenderEngine | null = null;
  let audioEngine: AudioEngine | null = null;
  let animationId: number;
  let lastRenderTime = 0;
  let lastMouseTime = 0;
  let lastFaviconUpdate = 0;
  
  
  const FPS_UPDATE_INTERVAL = 500; 
  let frameCount = 0;
  let totalFrames = 0;
  let lastFpsUpdate = 0;
  let audioDeltaAccumulator = 0;
  
  const FAVICON_UPDATE_INTERVAL = 5000;
  const FAVICON_SIZE = 32;
  
  let faviconCanvas: HTMLCanvasElement | null = null;
  let faviconCtx: CanvasRenderingContext2D | null = null;
  let faviconLink: HTMLLinkElement | null = null;

  // Camera functionality removed - no UI access to camera features
  
  function initFavicon(): void {
    
    faviconCanvas = document.createElement('canvas');
    faviconCanvas.width = FAVICON_SIZE;
    faviconCanvas.height = FAVICON_SIZE;
    faviconCtx = faviconCanvas.getContext('2d');
    
    
    faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }
  }
  
  function updateFavicon(now: number): void {
    if (!faviconCanvas || !faviconCtx || !faviconLink || !canvas) return;
    
    
    if (now - lastFaviconUpdate < FAVICON_UPDATE_INTERVAL) return;
    lastFaviconUpdate = now;
    
    
    const size = Math.min(canvas.width, canvas.height);
    const sx = (canvas.width - size) / 2;
    const sy = (canvas.height - size) / 2;
    
    
    faviconCtx.drawImage(
      canvas,
      sx, sy, size, size,  
      0, 0, FAVICON_SIZE, FAVICON_SIZE  
    );
    
    
    try {
      faviconLink.href = faviconCanvas.toDataURL('image/png');
    } catch (e) {
      
    }
  }
  
  export async function enableMicrophone(): Promise<boolean> {
    if (!audioEngine) {
      audioEngine = new AudioEngine();
    }

    // Get FFT size from preset config
    let fftSize = 2048;
    if ($appSettings.devicePreset === 'auto') {
      const caps = get(deviceCapabilities);
      const detectedPreset = caps.detectedPreset;
      fftSize = DEVICE_PRESETS[detectedPreset].audioFftSize;
    } else {
      fftSize = DEVICE_PRESETS[$appSettings.devicePreset].audioFftSize;
    }
    
    const success = await audioEngine.enable(fftSize);
    micEnabled.set(success);
    if (success) {
      renderEngine?.setAudioBuffer(audioEngine.getSharedBuffer());
    }
    return success;
  }
  
  export function disableMicrophone(): void {
    if (audioEngine) {
      audioEngine.disable();
      audioEngine = null;
    }
    micEnabled.set(false);
  }
  
  function animate(now: number): void {
    // Calculate frame interval based on user's target FPS setting
    const frameInterval = 1000 / $appSettings.targetFps;
    // Throttle when target FPS is below 60 (eco mode)
    const isThrottled = $appSettings.targetFps < 60;
    
    // Eco mode - use setTimeout for true throttling (reduced CPU wake-ups)
    // Regular mode - use requestAnimationFrame for smooth rendering
    if (isThrottled) {
      const elapsed = now - lastRenderTime;
      if (elapsed < frameInterval) {
        // Schedule next frame after the remaining interval
        // This truly reduces CPU wake-ups unlike skipping rAF frames
        animationId = window.setTimeout(
          () => requestAnimationFrame(animate),
          frameInterval - elapsed
        ) as unknown as number;
        return;
      }
    }
    
    // Schedule next frame at end (after work) for better performance
    // In eco mode, this schedules the next frame based on target FPS
    // In regular mode, this uses requestAnimationFrame for vsync
    if (isThrottled) {
      animationId = window.setTimeout(
        () => requestAnimationFrame(animate),
        frameInterval
      ) as unknown as number;
    } else {
      animationId = requestAnimationFrame(animate);
    }
    
    // Calculate deltaTime from last rendered frame for accurate timing
    const deltaTime = (now - lastRenderTime) / 1000;
    lastRenderTime = now;
    
    audioDeltaAccumulator += deltaTime;
    totalFrames++;
    
    // Update audio - always process audio even in eco mode
    // This ensures beats aren't missed
    if (audioEngine?.isEnabled()) {
      const isDesktop = $appSettings.devicePreset === 'desktop' || $appSettings.devicePreset === 'auto';
      const throttleInterval = isDesktop ? 1 : 2;
      
      if (totalFrames % throttleInterval === 0) {
        const currentDelta = audioDeltaAccumulator;
        const metrics = audioEngine.update(currentDelta);
        audioDeltaAccumulator = 0;
        
        audioMetrics.set(metrics);

        // Send metrics to worker when SharedArrayBuffer isn't available
        if (renderEngine && !renderEngine.usesSharedBuffer()) {
          renderEngine.updateAudio(metrics);
        }

        // Update auto envelope
        const beatGate = $audioSettings.beatGate;
        const beatHit = metrics.beat > beatGate;
        
        autoEnvelope.update(env => {
          if ($audioSettings.autoEnabled) {
            if (beatHit) {
              return 1;
            }
            const decayRate = 0.5 + $audioSettings.autoDecay * 3.5;
            // Use the accumulated delta time for decay
            return Math.max(0, env - currentDelta * decayRate);
          }
          return 0;
        });
        
        // Update randomizer
        updateRandomizer(metrics.beat);
      }
    }
    
    // Update features (currently no features enabled - camera UI removed)
    // Kept for potential future features
    featureRegistry.updateAll(deltaTime);
    
    // Sync state with worker
    // Note: Most updates are now handled by RenderEngine's auto-subscriptions
    // Only layer config needs to be sent explicitly
    if (renderEngine) {
      const layers: LayerConfig[] = layerDefinitions.map(def => {
        const state = $layerStates.get(def.id);
        return {
          id: def.id,
          enabled: state?.enabled ?? true,
          uniforms: $layerUniforms // This contains all flattened uniforms
        };
      });

      renderEngine.updateConfig(layers);
    }
    
    // Update dynamic favicon (already throttled internally)
    updateFavicon(now);
    
    // Update layer profiler if active
    if (layerProfiler.isCurrentlyProfiling()) {
      layerProfiler.recordFrame();
      updateProfilingProgress();
    }
  }
  
  // Camera functionality disabled - camera UI removed

  // Watch for resolution scale changes and update renderer
  $: if (renderEngine && $appSettings.resolutionScale) {
    renderEngine.updateResolutionScale($appSettings.resolutionScale);
  }

  // Watch for preset changes and update quality level
  $: if (renderEngine && $appSettings.devicePreset) {
    let quality = 1.0;
    if ($appSettings.devicePreset === 'auto') {
      const caps = get(deviceCapabilities);
      const detected = caps.detectedPreset;
      quality = DEVICE_PRESETS[detected].qualityLevel;
    } else {
      quality = DEVICE_PRESETS[$appSettings.devicePreset].qualityLevel;
    }
    renderEngine.updateQualityLevel(quality);
  }

  // Watch for feedback changes
  $: if (renderEngine) {
    renderEngine.updateFeedbackEnabled($appSettings.feedbackEnabled);
  }
  
  onMount(() => {
    if (canvas) {
      renderEngine = new RenderEngine();
      renderEngine.onStats((msg: MainMessage) => {
        if (msg.type === 'STATS') {
          // Update performance stats from worker
          performanceStats.update(s => ({
            ...s,
            fps: msg.fps,
            frameTime: msg.frameTime
          }));
        }
      });
      const sharedBuffer = audioEngine?.getSharedBuffer() ?? null;
      renderEngine.init(canvas, sharedBuffer, $appSettings.resolutionScale);
    }

    const now = performance.now();
    lastRenderTime = now;
    lastFpsUpdate = now;
    initFavicon();
    animationId = requestAnimationFrame(animate);
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      clearTimeout(animationId);
    }
    if (renderEngine) {
      renderEngine.dispose();
      renderEngine = null;
    }
    if (audioEngine) {
      audioEngine.disable();
      audioEngine = null;
    }
  });
  
  // Handle canvas click to toggle control panels visibility
  function handleCanvasClick() {
    appSettings.update(s => ({ ...s, panelsVisible: !s.panelsVisible }));
  }
  
  // Handle double-tap for fullscreen
  let lastTap = 0;
  function handleCanvasTouchEnd(event: TouchEvent) {
    const now = Date.now();
    if (now - lastTap < 300) {
      toggleFullscreen();
    }
    lastTap = now;
  }
  
  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: true }));
    } else {
      await document.exitFullscreen();
      appSettings.update(s => ({ ...s, fullscreen: false }));
    }
  }
  
  // Mouse event handlers
  function handleMouseMove(event: MouseEvent) {
    if (!canvas) return;
    const now = performance.now();
    const deltaTime = now - lastMouseTime;
    lastMouseTime = now;
    const rect = canvas.getBoundingClientRect();
    updateMousePosition(event.clientX, event.clientY, rect, deltaTime);
  }
  
  function handleMouseDown(event: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMouseDown(event.clientX, event.clientY, rect);
  }
  
  function handleMouseUp() {
    setMouseUp();
  }
  
  function handleMouseLeave() {
    setMouseLeave();
  }
</script>

<canvas
  bind:this={canvas}
  class="visualizer-canvas"
  on:click={handleCanvasClick}
  on:touchend={handleCanvasTouchEnd}
  on:mousemove={handleMouseMove}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseLeave}
  aria-label="Audio reactive canvas"
></canvas>

<style>
  .visualizer-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: var(--z-canvas);
    background: var(--color-bg);
  }
</style>
