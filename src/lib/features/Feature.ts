/**
 * Feature interface for plugin-based features
 * Features are self-contained plugins that can be enabled/disabled
 */
export interface Feature {
  /** Unique identifier for this feature */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of what this feature does */
  description: string;
  
  /** Required sensor IDs that must be enabled for this feature to work */
  requires: string[];
  
  /** Initialize the feature (load resources, setup listeners, etc.) */
  initialize(): Promise<void>;
  
  /** Update the feature each frame */
  update(deltaTime: number): void;
  
  /** Optional: Render overlay UI (for future features) */
  render?(): void;
  
  /** Clean up resources */
  dispose(): void;
  
  /** Check if feature is enabled */
  isEnabled(): boolean;
  
  /** Enable the feature */
  enable(): Promise<void>;
  
  /** Disable the feature */
  disable(): void;
}

/**
 * Base feature class providing common functionality
 */
export abstract class BaseFeature implements Feature {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly requires: string[];
  
  protected enabled: boolean = false;
  protected initialized: boolean = false;

  constructor(
    id: string,
    name: string,
    description: string,
    requires: string[] = []
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.requires = requires;
  }

  /**
   * Initialize the feature. Override in subclasses.
   */
  abstract initialize(): Promise<void>;

  /**
   * Update the feature each frame. Override in subclasses.
   */
  abstract update(deltaTime: number): void;

  /**
   * Optional: Render overlay UI. Override if needed.
   */
  render?(): void;

  /**
   * Clean up resources. Override in subclasses if needed.
   */
  dispose(): void {
    this.disable();
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable the feature
   */
  async enable(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
    this.enabled = true;
  }

  /**
   * Disable the feature
   */
  disable(): void {
    this.enabled = false;
  }
}
