import { BaseSensor } from './BaseSensor';
import { cameraData, cameraSettings } from '$lib/stores/camera';
import type { CameraData, CameraSettings } from '$lib/stores/camera';

/**
 * Camera sensor for capturing video frames
 * Wraps camera capture functionality
 */
export class CameraSensor extends BaseSensor<CameraData, CameraSettings> {
  private video: HTMLVideoElement | null = null;
  private cameraStream: MediaStream | null = null;
  private cameraCanvas: OffscreenCanvas | null = null;
  private cameraCtx: OffscreenCanvasRenderingContext2D | null = null;
  private cameraActive = false;
  private cameraCaptureScheduled = false;
  private lastCameraFrameTime = 0;

  constructor() {
    super('camera', {
      width: 640,
      height: 360,
      fps: 24,
      enabled: false
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Camera initialization happens when enabled
    this.initialized = true;
  }

  async enable(): Promise<void> {
    await super.enable();
    
    if (this.cameraStream) return; // Already enabled
    
    try {
      const settings = this.getSettingsStore();
      let currentSettings: CameraSettings;
      settings.subscribe(s => currentSettings = s)();
      
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: currentSettings!.width },
          height: { ideal: currentSettings!.height }
        },
        audio: false
      });
      
      this.video = document.createElement('video');
      this.video.srcObject = this.cameraStream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true;
      await this.video.play();
      
      this.cameraCanvas = new OffscreenCanvas(currentSettings!.width, currentSettings!.height);
      this.cameraCtx = this.cameraCanvas.getContext('2d');
      
      this.cameraActive = true;
      this.lastCameraFrameTime = 0;
      this.scheduleCameraCapture();
      
      // Update settings store
      cameraSettings.update(s => ({ ...s, enabled: true }));
    } catch (e) {
      this.cameraActive = false;
      this.cameraStream = null;
      this.video = null;
      cameraSettings.update(s => ({ ...s, enabled: false }));
      throw e;
    }
  }

  disable(): void {
    super.disable();
    
    this.cameraActive = false;
    this.cameraCaptureScheduled = false;
    
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    
    this.cameraCanvas = null;
    this.cameraCtx = null;
    
    cameraSettings.update(s => ({ ...s, enabled: false }));
    cameraData.set(null);
  }

  async process(frame: any): Promise<CameraData | null> {
    if (!this.cameraActive || !this.video || !this.cameraCanvas || !this.cameraCtx || this.video.readyState < 2) {
      return null;
    }

    const now = performance.now();
    const settings = this.getSettingsStore();
    let currentSettings: CameraSettings;
    settings.subscribe(s => currentSettings = s)();
    
    if (now - this.lastCameraFrameTime < 1000 / currentSettings!.fps) {
      return null;
    }
    
    this.lastCameraFrameTime = now;
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    
    if (vw === 0 || vh === 0) {
      return null;
    }
    
    const scale = Math.max(currentSettings!.width / vw, currentSettings!.height / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (currentSettings!.width - dw) / 2;
    const dy = (currentSettings!.height - dh) / 2;
    
    this.cameraCtx.drawImage(this.video, 0, 0, vw, vh, dx, dy, dw, dh);
    
    const bitmap = await createImageBitmap(this.cameraCanvas);
    
    const cameraDataValue: CameraData = {
      frame: bitmap,
      timestamp: now,
      width: currentSettings!.width,
      height: currentSettings!.height
    };
    
    // Update camera store
    cameraData.set(cameraDataValue);
    
    return cameraDataValue;
  }

  dispose(): void {
    this.disable();
    super.dispose();
  }

  /**
   * Get the camera canvas for processing (e.g., gesture tracking)
   */
  getCameraCanvas(): OffscreenCanvas | null {
    return this.cameraCanvas;
  }

  /**
   * Get image data from camera canvas
   */
  getImageData(): ImageData | null {
    if (!this.cameraCanvas || !this.cameraCtx) return null;
    return this.cameraCtx.getImageData(0, 0, this.cameraCanvas.width, this.cameraCanvas.height);
  }

  private scheduleCameraCapture(): void {
    if (!this.cameraActive || this.cameraCaptureScheduled) return;
    this.cameraCaptureScheduled = true;
    
    if (this.video?.requestVideoFrameCallback) {
      this.video.requestVideoFrameCallback(() => {
        this.cameraCaptureScheduled = false;
        this.process(null);
        this.scheduleCameraCapture();
      });
    } else {
      requestAnimationFrame(() => {
        this.cameraCaptureScheduled = false;
        this.process(null);
        this.scheduleCameraCapture();
      });
    }
  }
}
