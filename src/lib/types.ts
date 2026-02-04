




export interface AudioMetrics {
  energy: number;
  treble: number;
  bass: number;
  mids: number;
  highs: number;
  lows: number;
  beat: number;
}

export interface AudioSettings {
  sensitivity: number;
  highsBoost: number;
  midsBoost: number;
  lowsBoost: number;
  trebleBoost: number;
  bassBoost: number;
  beatBoost: number;
  minMotion: number;
  beatGate: number;
  autoEnabled: boolean;
  autoStrength: number;
  autoDecay: number;
  autoTarget: 'all' | 'energy' | 'treble' | 'beat';
}


export interface MouseMetrics {
  x: number;           
  y: number;           
  velocityX: number;   
  velocityY: number;   
  speed: number;       
  down: number;        
  clickX: number;      
  clickY: number;      
  inside: number;      
}

export interface LayerState {
  id: string;
  enabled: boolean;
  properties: Record<string, number | boolean>;
  includeInRandomizer: boolean;  
  includeInStrobe: boolean;      
}


export type ThemeBrightness = 'dark' | 'medium' | 'bright';
export type ThemeTemperature = 'warm' | 'cool' | 'neutral';
export type ThemeSaturation = 'low' | 'medium' | 'high';
export type ThemeFamily = 'spectrum' | 'fire' | 'ocean' | 'cosmic' | 'neon' | 'twilight' | 'earth';

export interface ThemeDefinition {
  id: number;
  label: string;
  preview: string; 
  
  brightness: ThemeBrightness;
  temperature: ThemeTemperature;
  saturation: ThemeSaturation;
  family: ThemeFamily;
}


export const BRIGHTNESS_VALUES: Record<ThemeBrightness, number> = {
  dark: 0.2,
  medium: 0.5,
  bright: 1.0
};


export type TransformType = 
  | 'linear'
  | 'exponential'
  | 'threshold'
  | 'envelope'
  | 'gate'
  | 'compress'
  | 'quantize';


export type RandomizerMode = 'chaos' | 'flow' | 'subtle';
export type StrobeMode = 'flash' | 'pulse' | 'drift';
export type DevicePreset = 'auto' | 'desktop' | 'laptop' | 'mobile';


export interface PresetConfig {
  // Rendering performance
  targetFps: number;
  resolutionScale: number;   
  maxActiveLayers: number;
  qualityLevel: number; // 0.0 - 1.0 for shader quality
  feedbackEnabled: boolean;
  
  // Audio settings
  audioFftSize: number; // 1024 or 2048
  audioSensitivity: number; // 0.0 - 2.0
  audioAutoEnabled: boolean; // Auto-suggest feature
  
  // Feature settings
  randomizerCooldown: number;
  randomizerMode: RandomizerMode;
  strobeMode: StrobeMode;
  
  // UI
  label: string;
  icon: string;
}

export const DEVICE_PRESETS: Record<DevicePreset, PresetConfig> = {
  auto: {
    // Will be dynamically determined based on device capabilities
    targetFps: 60,
    resolutionScale: 1.0,
    maxActiveLayers: 7,
    qualityLevel: 1.0,
    feedbackEnabled: true,
    audioFftSize: 2048,
    audioSensitivity: 1.0,
    audioAutoEnabled: true,
    randomizerCooldown: 2.0,
    randomizerMode: 'flow',
    strobeMode: 'flash',
    label: 'Auto',
    icon: '🔄'
  },
  desktop: {
    targetFps: 60,
    resolutionScale: 1.0,
    maxActiveLayers: 7,
    qualityLevel: 1.0,
    feedbackEnabled: true,
    audioFftSize: 2048,
    audioSensitivity: 1.0,
    audioAutoEnabled: true,
    randomizerCooldown: 2.0,
    randomizerMode: 'flow',
    strobeMode: 'flash',
    label: 'Desktop',
    icon: '🖥️'
  },
  laptop: {
    targetFps: 30,
    resolutionScale: 0.75,
    maxActiveLayers: 5,
    qualityLevel: 0.6,
    feedbackEnabled: true,
    audioFftSize: 1024,
    audioSensitivity: 1.2,
    audioAutoEnabled: true,
    randomizerCooldown: 3.0,
    randomizerMode: 'flow',
    strobeMode: 'pulse',
    label: 'Laptop',
    icon: '💻'
  },
  mobile: {
    targetFps: 24,
    resolutionScale: 0.5,
    maxActiveLayers: 3,
    qualityLevel: 0.3,
    feedbackEnabled: false,
    audioFftSize: 1024,
    audioSensitivity: 1.5,
    audioAutoEnabled: false,
    randomizerCooldown: 4.0,
    randomizerMode: 'subtle',
    strobeMode: 'drift',
    label: 'Mobile',
    icon: '📱'
  }
};

export interface AppSettings {
  panelsVisible: boolean;
  fullscreen: boolean;
  pipEnabled: boolean;
  
  devicePreset: DevicePreset;
  autoApplyPreset: boolean;
  targetFps: number;
  resolutionScale: number;
  maxActiveLayers: number;
  feedbackEnabled: boolean;
  
  randomizerCooldown: number;
  randomizerToggleChance: number;
  randomizerMode: RandomizerMode;
  strobeMode: StrobeMode;

  powerSaverEnabled: boolean;
  cameraEnabled: boolean;
}

export interface LayerUniforms {
  [key: string]: number;
}
