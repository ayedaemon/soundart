import { BaseFeature } from './Feature';
import { processedGestures } from '$lib/stores/gestures';
import { sensorRegistry } from '$lib/sensors/SensorRegistry';
import type { GestureSensor } from '$lib/sensors/GestureSensor';
import type { CameraSensor } from '$lib/sensors/CameraSensor';

/**
 * Gesture Control Feature
 * Provides gesture-based layer control and visual effects
 */
export class GestureControlFeature extends BaseFeature {
  private gestureSensor: GestureSensor | null = null;
  private cameraSensor: CameraSensor | null = null;

  constructor() {
    super(
      'gestureControl',
      'Gesture Control',
      'Control visual layers and effects using hand gestures',
      ['camera', 'gesture']
    );
  }

  async initialize(): Promise<void> {
    // Get sensors from registry
    this.cameraSensor = sensorRegistry.get<CameraSensor>('camera');
    this.gestureSensor = sensorRegistry.get<GestureSensor>('gesture');
    
    if (!this.cameraSensor || !this.gestureSensor) {
      throw new Error('GestureControlFeature: Required sensors not found');
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled || !this.cameraSensor || !this.gestureSensor) {
      return;
    }

    // Process gestures from camera frames
    const imageData = this.cameraSensor.getImageData();
    if (imageData) {
      // Process gestures (this will update the gestureData store)
      this.gestureSensor.process(imageData);
    }
  }
}
