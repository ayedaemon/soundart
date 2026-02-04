import type { Feature } from './Feature';
import { sensorRegistry } from '$lib/sensors/SensorRegistry';

/**
 * Registry for managing all features in the system.
 * Provides lifecycle management and dependency checking.
 */
export class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  private initializationPromises: Map<string, Promise<void>> = new Map();
  
  /**
   * Register a feature with the registry
   */
  register(feature: Feature): void {
    if (this.features.has(feature.id)) {
      console.warn(`FeatureRegistry: Feature ${feature.id} is already registered`);
      return;
    }
    
    this.features.set(feature.id, feature);
  }
  
  /**
   * Get a feature by ID
   */
  get(id: string): Feature | undefined {
    return this.features.get(id);
  }
  
  /**
   * Enable a feature (checks dependencies, loads on-demand)
   */
  async enable(id: string): Promise<void> {
    const feature = this.features.get(id);
    if (!feature) {
      console.warn(`FeatureRegistry: Feature ${id} not found`);
      return;
    }
    
    if (feature.isEnabled()) {
      return; // Already enabled
    }
    
    // Check required sensors
    for (const sensorId of feature.requires) {
      if (!sensorRegistry.isEnabled(sensorId)) {
        console.warn(`FeatureRegistry: Feature ${id} requires sensor ${sensorId} which is not enabled`);
        // Optionally auto-enable required sensors
        await sensorRegistry.enable(sensorId);
      }
    }
    
    // Ensure initialization
    if (!this.initializationPromises.has(id)) {
      const initPromise = feature.initialize().then(() => {
        this.initializationPromises.delete(id);
      }).catch((error) => {
        this.initializationPromises.delete(id);
        console.error(`FeatureRegistry: Failed to initialize feature ${id}:`, error);
        throw error;
      });
      this.initializationPromises.set(id, initPromise);
    }
    
    await this.initializationPromises.get(id);
    await feature.enable();
  }
  
  /**
   * Disable a feature
   */
  disable(id: string): void {
    const feature = this.features.get(id);
    if (!feature) {
      return;
    }
    
    feature.disable();
  }
  
  /**
   * Check if a feature is enabled
   */
  isEnabled(id: string): boolean {
    const feature = this.features.get(id);
    return feature?.isEnabled() ?? false;
  }
  
  /**
   * Get all registered feature IDs
   */
  getRegisteredIds(): string[] {
    return Array.from(this.features.keys());
  }
  
  /**
   * Get all enabled feature IDs
   */
  getEnabledIds(): string[] {
    return Array.from(this.features.entries())
      .filter(([_, feature]) => feature.isEnabled())
      .map(([id]) => id);
  }
  
  /**
   * Update all enabled features
   */
  updateAll(deltaTime: number): void {
    for (const feature of this.features.values()) {
      if (feature.isEnabled()) {
        feature.update(deltaTime);
      }
    }
  }
  
  /**
   * Render all enabled features that have render methods
   */
  renderAll(): void {
    for (const feature of this.features.values()) {
      if (feature.isEnabled() && feature.render) {
        feature.render();
      }
    }
  }
  
  /**
   * Dispose all features and clear registry
   */
  disposeAll(): void {
    for (const feature of this.features.values()) {
      feature.dispose();
    }
    this.features.clear();
    this.initializationPromises.clear();
  }
  
  /**
   * Dispose a specific feature
   */
  dispose(id: string): void {
    const feature = this.features.get(id);
    if (feature) {
      feature.dispose();
      this.features.delete(id);
      this.initializationPromises.delete(id);
    }
  }
}

// Singleton instance
export const featureRegistry = new FeatureRegistry();
