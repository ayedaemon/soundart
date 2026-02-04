import type { AudioFeature } from './audio';

export type TransformType = 
  | 'linear'
  | 'exponential'
  | 'threshold'
  | 'envelope'
  | 'gate'
  | 'compress'
  | 'quantize';

export interface AudioBindingConfig {
  audioMetric: AudioFeature;
  targetProperty: string; // ID of the layer parameter
  sensitivity: number;
  transform: TransformType;
  params?: Record<string, number>;
}

export interface LayerRuntimeConfig {
  layerId: string;
  enabled: boolean;
  properties: Record<string, number | boolean>; // Current values
  audioBindings: AudioBindingConfig[];
}

export interface AppConfig {
  layers: LayerRuntimeConfig[];
  globalSettings: {
    targetFps: number;
    powerSaver: boolean;
    resolutionScale: number;
  };
}
