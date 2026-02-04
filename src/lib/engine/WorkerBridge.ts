import type { AudioMetrics } from '$lib/types';
import type { LayerConfig } from '$lib/core/types/layer';
import type { GestureData } from '$lib/camera/types';

export type WorkerMessage =
  | { type: 'INIT'; canvas: OffscreenCanvas; audioBuffer: SharedArrayBuffer | null; dpr: number; useFallback?: boolean }
  | { type: 'SET_AUDIO_BUFFER'; audioBuffer: SharedArrayBuffer }
  | { type: 'RESIZE'; width: number; height: number; dpr: number }
  | { type: 'UPDATE_CONFIG'; layers: LayerConfig[] }
  | { type: 'UPDATE_PARAMS'; mouse: { x: number; y: number; down: number; clickX: number; clickY: number; velocityX: number; velocityY: number; speed: number; inside?: number } }
  | { type: 'UPDATE_MOUSE'; mouse: { x: number; y: number; down: number; clickX: number; clickY: number; velocityX: number; velocityY: number; speed: number; inside?: number } }
  | { type: 'UPDATE_AUDIO'; metrics: AudioMetrics }
  | { type: 'UPDATE_QUALITY'; quality: number }
  | { type: 'UPDATE_FEEDBACK'; enabled: boolean }
  | { type: 'CAMERA_FRAME'; bitmap: ImageBitmap; gestures?: GestureData } // Disabled - camera UI removed
  | { type: 'UPDATE_GESTURES'; gestures: GestureData } // Disabled - camera UI removed, kept for potential future use
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

export type MainMessage = 
  | { type: 'STATS'; fps: number; frameTime: number };

export class WorkerBridge {
  private worker: Worker;

  constructor(worker: Worker) {
    this.worker = worker;
  }

  postMessage(message: WorkerMessage, transfer?: Transferable[]): void {
    if (transfer) {
      this.worker.postMessage(message, transfer);
    } else {
      this.worker.postMessage(message);
    }
  }

  onMessage(handler: (message: MainMessage) => void): void {
    this.worker.onmessage = (event: MessageEvent<MainMessage>) => {
      handler(event.data);
    };
  }

  terminate(): void {
    this.worker.terminate();
  }
}
