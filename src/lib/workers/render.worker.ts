import { AUDIO_BUFFER_HEADER_SIZE, AUDIO_FEATURE_INDICES } from '$lib/core/types/audio';
import type { AudioMetrics } from '$lib/types';
import type { WorkerMessage, MainMessage } from '$lib/engine/WorkerBridge';
import { WorkerRenderer } from '$lib/engine/WorkerRenderer';
import type { GestureData } from '$lib/camera/types';

// Worker State
let canvas: OffscreenCanvas | null = null;
let gl: WebGLRenderingContext | null = null;
let audioFloatView: Float32Array | null = null;
let isRunning = false;
let dpr = 1;

// Renderer instance
let renderer: WorkerRenderer | null = null;

// Audio Metrics Cache
const audioMetrics: AudioMetrics = {
  energy: 0, treble: 0, bass: 0, mids: 0, highs: 0, lows: 0, beat: 0
};

/**
 * Handle messages from the main thread.
 */
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT':
      canvas = msg.canvas;
      if (msg.audioBuffer) {
        audioFloatView = new Float32Array(msg.audioBuffer);
      }
      dpr = msg.dpr;
      
      // Initialize WebGL context
      gl = canvas.getContext('webgl', {
        antialias: false,
        preserveDrawingBuffer: true,
        alpha: false // Optimization: we don't need transparency on the canvas itself
      }) as WebGLRenderingContext;

      if (!gl) {
        console.error('Worker: WebGL not supported');
        return;
      }

      // Initialize Renderer
      renderer = new WorkerRenderer(gl);
      const initialized = await renderer.init();
      if (!initialized) {
        console.error('Worker: Failed to initialize renderer');
        return;
      }

      isRunning = true;
      requestAnimationFrame(renderLoop);
      break;

    case 'RESIZE':
      if (canvas) {
        const width = msg.width * msg.dpr;
        const height = msg.height * msg.dpr;
        canvas.width = width;
        canvas.height = height;
        dpr = msg.dpr;
        renderer?.resize(width, height);
      }
      break;

    case 'UPDATE_CONFIG':
      renderer?.updateLayers(msg.layers);
      break;

    case 'UPDATE_PARAMS':
      renderer?.updateMouse(msg.mouse);
      break;
      
    case 'UPDATE_MOUSE':
      renderer?.updateMouse(msg.mouse);
      break;
      
    case 'SET_AUDIO_BUFFER':
      audioFloatView = new Float32Array(msg.audioBuffer);
      break;
      
    case 'UPDATE_AUDIO':
      if (msg.metrics) {
        audioMetrics.energy = msg.metrics.energy;
        audioMetrics.treble = msg.metrics.treble;
        audioMetrics.bass = msg.metrics.bass;
        audioMetrics.mids = msg.metrics.mids;
        audioMetrics.highs = msg.metrics.highs;
        audioMetrics.lows = msg.metrics.lows;
        audioMetrics.beat = msg.metrics.beat;
      }
      break;

    case 'UPDATE_QUALITY':
      renderer?.updateQualityLevel(msg.quality);
      break;
      
    case 'UPDATE_FEEDBACK':
      renderer?.updateFeedbackEnabled(msg.enabled);
      break;

    case 'CAMERA_FRAME':
      renderer?.updateCameraFrame(msg.bitmap);
      if (msg.gestures) {
        renderer?.updateGestures(msg.gestures);
      }
      break;

    case 'UPDATE_GESTURES':
      // Gesture updates disabled - camera UI removed, but handler kept for potential future use
      // msg.gestures will always be null/empty since camera is disabled
      renderer?.updateGestures(msg.gestures);
      break;

    case 'PAUSE':
      isRunning = false;
      break;
      
    case 'RESUME':
      if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(renderLoop);
      }
      break;
  }
};

/**
 * Read latest audio metrics from SharedArrayBuffer if available.
 * Zero-copy operation for maximum performance.
 */
function readAudioMetrics() {
  if (!audioFloatView) return;
  
  // Read from shared buffer (zero-copy)
  audioMetrics.energy = audioFloatView[AUDIO_FEATURE_INDICES.energy];
  audioMetrics.treble = audioFloatView[AUDIO_FEATURE_INDICES.treble];
  audioMetrics.bass = audioFloatView[AUDIO_FEATURE_INDICES.bass];
  audioMetrics.mids = audioFloatView[AUDIO_FEATURE_INDICES.mids];
  audioMetrics.highs = audioFloatView[AUDIO_FEATURE_INDICES.highs];
  audioMetrics.lows = audioFloatView[AUDIO_FEATURE_INDICES.lows];
  audioMetrics.beat = audioFloatView[AUDIO_FEATURE_INDICES.beat];
}

let lastTime = 0;
let frameCount = 0;
let lastStatsTime = 0;

/**
 * Main render loop running in the worker.
 */
function renderLoop(time: number) {
  if (!isRunning || !gl) return;

  // Read latest audio data
  readAudioMetrics();

  // Render frame
  renderer?.render(time / 1000, audioMetrics);

  // Stats reporting (1Hz)
  frameCount++;
  if (time - lastStatsTime >= 1000) {
    const fps = Math.round(frameCount * 1000 / (time - lastStatsTime));
    self.postMessage({ type: 'STATS', fps, frameTime: (time - lastTime) });
    lastStatsTime = time;
    frameCount = 0;
  }
  
  lastTime = time;
  requestAnimationFrame(renderLoop);
}
