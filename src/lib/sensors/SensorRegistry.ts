import type { Sensor } from './BaseSensor';

/**
 * Registry for managing all sensors in the system.
 * Provides on-demand loading and lifecycle management.
 */
export class SensorRegistry {
  private sensors: Map<string, Sensor<any, any>> = new Map();
  private initializationPromises: Map<string, Promise<void>> = new Map();
  
  /**
   * Register a sensor with the registry
   */
  register<TData, TSettings>(sensor: Sensor<TData, TSettings>): void {
    if (this.sensors.has(sensor.id)) {
      console.warn(`SensorRegistry: Sensor ${sensor.id} is already registered`);
      return;
    }
    
    this.sensors.set(sensor.id, sensor);
  }
  
  /**
   * Get a sensor by ID
   */
  get<TData, TSettings>(id: string): Sensor<TData, TSettings> | undefined {
    return this.sensors.get(id) as Sensor<TData, TSettings> | undefined;
  }
  
  /**
   * Enable a sensor (loads on-demand if not initialized)
   */
  async enable(id: string): Promise<void> {
    const sensor = this.sensors.get(id);
    if (!sensor) {
      console.warn(`SensorRegistry: Sensor ${id} not found`);
      return;
    }
    
    if (sensor.enabled) {
      return; // Already enabled
    }
    
    // Ensure initialization
    if (!this.initializationPromises.has(id)) {
      const initPromise = sensor.initialize().then(() => {
        this.initializationPromises.delete(id);
      }).catch((error) => {
        this.initializationPromises.delete(id);
        console.error(`SensorRegistry: Failed to initialize sensor ${id}:`, error);
        throw error;
      });
      this.initializationPromises.set(id, initPromise);
    }
    
    await this.initializationPromises.get(id);
    await sensor.enable();
  }
  
  /**
   * Disable a sensor
   */
  disable(id: string): void {
    const sensor = this.sensors.get(id);
    if (!sensor) {
      return;
    }
    
    sensor.disable();
  }
  
  /**
   * Check if a sensor is enabled
   */
  isEnabled(id: string): boolean {
    const sensor = this.sensors.get(id);
    return sensor?.enabled ?? false;
  }
  
  /**
   * Get all registered sensor IDs
   */
  getRegisteredIds(): string[] {
    return Array.from(this.sensors.keys());
  }
  
  /**
   * Get all enabled sensor IDs
   */
  getEnabledIds(): string[] {
    return Array.from(this.sensors.entries())
      .filter(([_, sensor]) => sensor.enabled)
      .map(([id]) => id);
  }
  
  /**
   * Dispose all sensors and clear registry
   */
  disposeAll(): void {
    for (const sensor of this.sensors.values()) {
      sensor.dispose();
    }
    this.sensors.clear();
    this.initializationPromises.clear();
  }
  
  /**
   * Dispose a specific sensor
   */
  dispose(id: string): void {
    const sensor = this.sensors.get(id);
    if (sensor) {
      sensor.dispose();
      this.sensors.delete(id);
      this.initializationPromises.delete(id);
    }
  }
}

// Singleton instance
export const sensorRegistry = new SensorRegistry();
