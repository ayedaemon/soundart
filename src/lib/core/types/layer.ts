// Layer Parameter Definitions

export type ParameterType = 'float' | 'int' | 'color' | 'boolean' | 'select';

export interface ParameterUI {
  shortLabel?: string;
  tooltip?: string;
}

export interface BaseParameter {
  id: string;
  label: string;
  type: ParameterType;
  uniform: string;
  randomizable?: boolean;
  ui?: ParameterUI;
}

export interface FloatParameter extends BaseParameter {
  type: 'float';
  default: number;
  min: number;
  max: number;
  step?: number;
  randomMin?: number;
  randomMax?: number;
}

export interface IntParameter extends BaseParameter {
  type: 'int';
  default: number;
  min: number;
  max: number;
  step?: number; // Usually 1
  randomMin?: number;
  randomMax?: number;
}

export interface BooleanParameter extends BaseParameter {
  type: 'boolean';
  default: boolean;
}

export interface SelectParameter extends BaseParameter {
  type: 'select';
  default: number; // Index or ID
  options: { value: number; label: string }[];
}

export type LayerParameter = FloatParameter | IntParameter | BooleanParameter | SelectParameter;

export interface LayerDefinition {
  id: string;
  label: string;
  description: string;
  properties: LayerParameter[];
  shaderPath: string;
  randomizable?: boolean;
  /** When true, this layer only appears in the Layers panel when camera is enabled */
  requiresCamera?: boolean;
  /** Sensor dependencies - which sensors this layer needs */
  sensorDependencies?: {
    gestures?: boolean;
    camera?: boolean;
  };
  /** Additional shader uniforms this layer needs (beyond standard ones) */
  shaderUniforms?: string[];
  // Default audio bindings can be defined here if needed,
  // but usually they are runtime config
}

// Runtime configuration sent to worker
export interface LayerConfig {
  id: string;
  enabled: boolean;
  uniforms: Record<string, number>; // Flattened uniform values
}
