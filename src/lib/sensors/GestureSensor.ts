import { BaseSensor } from './BaseSensor';
import { GestureTracker } from '$lib/camera/GestureTracker';
import type { GestureData } from '$lib/camera/types';
import { gestureData } from '$lib/stores/gestures';

export interface GestureSensorData extends GestureData {
  timestamp: number;
}

export interface GestureSensorSettings {
  enabled: boolean;
  minConfidence: number;
  smoothing: number;
}

const defaultSettings: GestureSensorSettings = {
  enabled: false,
  minConfidence: 0.6,
  smoothing: 0.7
};

/**
 * Gesture sensor wrapping GestureTracker
 * Provides hand and face gesture data through the sensor interface
 */
export class GestureSensor extends BaseSensor<GestureSensorData, GestureSensorSettings> {
  private gestureTracker: GestureTracker | null = null;
  private imageWidth = 640;
  private imageHeight = 360;

  constructor() {
    super('gesture', defaultSettings);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.gestureTracker = new GestureTracker();
    this.gestureTracker.setImageSize(this.imageWidth, this.imageHeight);
    await this.gestureTracker.initialize();
    this.initialized = true;
  }

  async enable(): Promise<void> {
    await super.enable();
    
    if (!this.gestureTracker) {
      await this.initialize();
    }
    
    if (this.gestureTracker) {
      this.gestureTracker.setEnabled(true);
    }
  }

  disable(): void {
    super.disable();
    
    if (this.gestureTracker) {
      this.gestureTracker.setEnabled(false);
    }
  }

  async process(frame: ImageData | null): Promise<GestureSensorData | null> {
    if (!this.gestureTracker || !this.enabled || !frame) {
      return null;
    }

    try {
      const data = await this.gestureTracker.processFrame(frame);
      
      if (data) {
        const sensorData: GestureSensorData = {
          ...data,
          timestamp: performance.now()
        };
        
        // Update gesture store
        gestureData.set(data);
        
        return sensorData;
      }
    } catch (error) {
      console.error('GestureSensor: Error processing frame:', error);
    }
    
    return null;
  }

  dispose(): void {
    this.disable();
    
    if (this.gestureTracker) {
      this.gestureTracker.dispose();
      this.gestureTracker = null;
    }
    
    super.dispose();
  }

  /**
   * Set image size for gesture tracking
   */
  setImageSize(width: number, height: number): void {
    this.imageWidth = width;
    this.imageHeight = height;
    if (this.gestureTracker) {
      this.gestureTracker.setImageSize(width, height);
    }
  }
}
