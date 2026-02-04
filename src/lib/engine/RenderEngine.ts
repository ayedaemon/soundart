import RenderWorker from '$lib/workers/render.worker?worker';
import type { AudioMetrics, MouseMetrics } from '$lib/types';
import type { LayerConfig } from '$lib/core/types/layer';
import { WorkerBridge, type MainMessage } from '$lib/engine/WorkerBridge';
import type { GestureData } from '$lib/camera/types';
import { processedAudio } from '$lib/stores/audio';
import { processedMouse } from '$lib/stores/mouse';
import { processedGestures } from '$lib/stores/gestures';
import { layerUniforms } from '$lib/stores/layers';

type StatsHandler = (message: MainMessage) => void;

/**
 * Main-thread controller for the rendering system.
 * Manages the Web Worker, OffscreenCanvas, and state synchronization.
 * Auto-subscribes to processed stores and syncs to worker.
 */
export class RenderEngine {
  private bridge: WorkerBridge | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private statsHandler: StatsHandler | null = null;
  private initialized = false;
  private usingSharedBuffer = false;
  private resolutionScale = 1.0;
  private canvas: HTMLCanvasElement | null = null;
  private subscriptions: Array<() => void> = [];

  /**
   * Initialize the render engine and worker.
   * Transfers control of the canvas to the worker thread.
   */
  init(canvas: HTMLCanvasElement, audioBuffer: SharedArrayBuffer | null, resolutionScale: number = 1.0): void {
    if (this.initialized) return;

    this.canvas = canvas;
    this.resolutionScale = resolutionScale;

    // Transfer canvas control to worker for off-main-thread rendering
    const offscreen = canvas.transferControlToOffscreen();
    const worker = new RenderWorker();
    this.bridge = new WorkerBridge(worker);
    this.usingSharedBuffer = !!audioBuffer;

    // Calculate initial DPR, capped at 1.5 for performance
    const effectiveDpr = Math.min(window.devicePixelRatio || 1, 1.5) * resolutionScale;
    
    this.bridge.postMessage({
      type: 'INIT',
      canvas: offscreen,
      audioBuffer,
      dpr: effectiveDpr,
      useFallback: !audioBuffer
    }, [offscreen]);

    if (this.statsHandler) {
      this.bridge.onMessage(this.statsHandler);
    }

    // Monitor canvas size changes
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const effectiveDpr = Math.min(window.devicePixelRatio || 1, 1.5) * this.resolutionScale;
        this.bridge?.postMessage({
          type: 'RESIZE',
          width: entry.contentRect.width,
          height: entry.contentRect.height,
          dpr: effectiveDpr
        });
      }
    });

    this.resizeObserver.observe(canvas);
    this.initialized = true;
    
    // Auto-subscribe to all processed stores
    this.setupStoreSubscriptions();
  }
  
  /**
   * Setup automatic subscriptions to processed stores.
   * Automatically syncs store changes to the worker.
   */
  private setupStoreSubscriptions(): void {
    if (!this.bridge) return;
    
    // Audio store subscription
    this.subscriptions.push(
      processedAudio.subscribe(audio => {
        if (audio) {
          this.bridge?.postMessage({
            type: 'UPDATE_AUDIO',
            metrics: {
              beat: audio.beat,
              energy: audio.energy,
              treble: audio.treble,
              bass: audio.raw.bass,
              mids: audio.raw.mids,
              highs: audio.raw.highs,
              lows: audio.raw.lows
            }
          });
        }
      })
    );
    
    // Mouse store subscription
    this.subscriptions.push(
      processedMouse.subscribe(mouse => {
        if (mouse) {
          this.bridge?.postMessage({
            type: 'UPDATE_MOUSE',
            mouse: {
              x: mouse.x,
              y: mouse.y,
              down: mouse.down,
              clickX: mouse.clickX,
              clickY: mouse.clickY,
              velocityX: mouse.velocityX,
              velocityY: mouse.velocityY,
              speed: mouse.speed,
              inside: mouse.inside
            }
          });
        }
      })
    );
    
    // Gesture store subscription (disabled - camera UI removed, but subscription kept for potential future use)
    // processedGestures will always be null since camera is disabled
    this.subscriptions.push(
      processedGestures.subscribe(gestures => {
        if (gestures) {
          this.bridge?.postMessage({
            type: 'UPDATE_GESTURES',
            gestures: {
              faces: gestures.faces || [],
              hands: gestures.hands || []
            }
          });
        }
      })
    );
    
    // Layer uniforms subscription
    this.subscriptions.push(
      layerUniforms.subscribe(uniforms => {
        // Convert layerUniforms to LayerConfig[] format
        const layers: LayerConfig[] = [];
        // This will be handled by updateConfig, but we can also send directly
        // For now, we'll keep updateConfig separate for backward compatibility
      })
    );
  }

  /**
   * Update internal resolution scaling factor.
   * Triggers a resize event to the worker.
   */
  updateResolutionScale(scale: number): void {
    if (this.resolutionScale === scale) return;
    this.resolutionScale = scale;
    
    // Trigger a resize to apply the new resolution scale
    if (this.canvas && this.bridge) {
      const rect = this.canvas.getBoundingClientRect();
      const effectiveDpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      this.bridge.postMessage({
        type: 'RESIZE',
        width: rect.width,
        height: rect.height,
        dpr: effectiveDpr
      });
    }
  }

  updateQualityLevel(quality: number): void {
    this.bridge?.postMessage({ type: 'UPDATE_QUALITY', quality });
  }

  updateFeedbackEnabled(enabled: boolean): void {
    this.bridge?.postMessage({ type: 'UPDATE_FEEDBACK', enabled });
  }

  postCameraFrame(bitmap: ImageBitmap, gestures?: GestureData): void {
    if (this.bridge) {
      this.bridge.postMessage({ type: 'CAMERA_FRAME', bitmap, gestures }, [bitmap]);
    }
  }

  setAudioBuffer(audioBuffer: SharedArrayBuffer | null): void {
    if (!this.bridge || !audioBuffer || this.usingSharedBuffer) return;
    this.usingSharedBuffer = true;
    this.bridge.postMessage({ type: 'SET_AUDIO_BUFFER', audioBuffer });
  }

  /**
   * Update mouse (legacy method - now handled by store subscription)
   * Kept for backward compatibility
   */
  updateMouse(mouse: MouseMetrics): void {
    this.bridge?.postMessage({ type: 'UPDATE_MOUSE', mouse: {
      x: mouse.x,
      y: mouse.y,
      down: mouse.down,
      clickX: mouse.clickX,
      clickY: mouse.clickY,
      velocityX: mouse.velocityX,
      velocityY: mouse.velocityY,
      speed: mouse.speed,
      inside: mouse.inside
    } });
  }

  updateConfig(layers: LayerConfig[]): void {
    this.bridge?.postMessage({ type: 'UPDATE_CONFIG', layers });
  }

  /**
   * Update audio (legacy method - now handled by store subscription)
   * Kept for backward compatibility
   */
  updateAudio(metrics: AudioMetrics): void {
    this.bridge?.postMessage({ type: 'UPDATE_AUDIO', metrics });
  }

  onStats(handler: StatsHandler): void {
    this.statsHandler = handler;
    if (this.bridge) {
      this.bridge.onMessage(handler);
    }
  }

  usesSharedBuffer(): boolean {
    return this.usingSharedBuffer;
  }

  dispose(): void {
    // Unsubscribe from all stores
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.bridge) {
      this.bridge.terminate();
      this.bridge = null;
    }
    this.initialized = false;
    this.usingSharedBuffer = false;
  }
}

