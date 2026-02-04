import { BaseSensor } from './BaseSensor';
import { mouseState, processedMouse } from '$lib/stores/mouse';
import type { MouseMetrics } from '$lib/types';

export interface MouseSensorData {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  speed: number;
  isDown: boolean;
  clickPosition: { x: number; y: number };
  isInside: boolean;
  timestamp: number;
}

export interface MouseSensorSettings {
  enabled: boolean;
}

const defaultSettings: MouseSensorSettings = {
  enabled: true // Mouse is always enabled
};

/**
 * Mouse sensor wrapping mouse tracking stores
 * Provides mouse/touch data through the sensor interface
 */
export class MouseSensor extends BaseSensor<MouseSensorData, MouseSensorSettings> {
  constructor() {
    super('mouse', defaultSettings);
    
    // Subscribe to processed mouse store and update data store
    processedMouse.subscribe(mouse => {
      if (mouse) {
        this.dataStore.set({
          position: mouse.position,
          velocity: mouse.velocity,
          speed: mouse.speed,
          isDown: mouse.isDown,
          clickPosition: mouse.clickPosition,
          isInside: mouse.isInside,
          timestamp: performance.now()
        });
      }
    });
  }

  async initialize(): Promise<void> {
    // Mouse sensor doesn't need initialization
    this.initialized = true;
  }

  async process(frame: any): Promise<MouseSensorData | null> {
    // Mouse data is already updated via store subscription
    // Just return current value
    let currentData: MouseSensorData | null = null;
    this.dataStore.subscribe(data => currentData = data)();
    return currentData;
  }

  /**
   * Get the raw mouse state store
   */
  getMouseStateStore() {
    return mouseState;
  }
}
