import { writable, type Writable } from 'svelte/store';

/**
 * Base sensor interface that all sensors must implement.
 * Provides a unified pattern for all input sources (audio, camera, mouse, gestures, etc.)
 */
export interface Sensor<TData, TSettings> {
  /** Unique identifier for this sensor */
  id: string;
  
  /** Whether the sensor is currently enabled */
  enabled: boolean;
  
  /** Initialize the sensor (load models, setup resources, etc.) */
  initialize(): Promise<void>;
  
  /** Process a frame/input and return sensor data */
  process(frame: any): Promise<TData | null>;
  
  /** Update sensor settings */
  updateSettings(settings: Partial<TSettings>): void;
  
  /** Clean up resources */
  dispose(): void;
  
  /** Get the raw data store */
  getDataStore(): Writable<TData | null>;
  
  /** Get the settings store */
  getSettingsStore(): Writable<TSettings>;
  
  /** Enable the sensor */
  enable(): Promise<void>;
  
  /** Disable the sensor */
  disable(): void;
}

/**
 * Base sensor class providing common functionality.
 * All sensors should extend this class.
 */
export abstract class BaseSensor<TData, TSettings> implements Sensor<TData, TSettings> {
  public readonly id: string;
  public enabled: boolean = false;
  protected initialized: boolean = false;
  
  protected readonly dataStore: Writable<TData | null>;
  protected readonly settingsStore: Writable<TSettings>;
  
  constructor(
    id: string,
    defaultSettings: TSettings
  ) {
    this.id = id;
    this.dataStore = writable<TData | null>(null);
    this.settingsStore = writable<TSettings>(defaultSettings);
  }
  
  /**
   * Initialize the sensor. Override in subclasses.
   */
  abstract initialize(): Promise<void>;
  
  /**
   * Process a frame/input. Override in subclasses.
   */
  abstract process(frame: any): Promise<TData | null>;
  
  /**
   * Update sensor settings
   */
  updateSettings(settings: Partial<TSettings>): void {
    this.settingsStore.update(current => ({ ...current, ...settings }));
  }
  
  /**
   * Enable the sensor
   */
  async enable(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
    this.enabled = true;
  }
  
  /**
   * Disable the sensor
   */
  disable(): void {
    this.enabled = false;
  }
  
  /**
   * Clean up resources. Override in subclasses if needed.
   */
  dispose(): void {
    this.enabled = false;
    this.dataStore.set(null);
  }
  
  /**
   * Get the raw data store
   */
  getDataStore(): Writable<TData | null> {
    return this.dataStore;
  }
  
  /**
   * Get the settings store
   */
  getSettingsStore(): Writable<TSettings> {
    return this.settingsStore;
  }
}
