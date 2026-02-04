import { writable, derived } from 'svelte/store';
import { appSettings } from './settings';

/**
 * Raw camera data (frame bitmap, not processed)
 */
export interface CameraData {
  frame: ImageBitmap | null;
  timestamp: number;
  width: number;
  height: number;
}

/**
 * Camera settings
 */
export interface CameraSettings {
  width: number;
  height: number;
  fps: number;
  enabled: boolean;
}

const defaultSettings: CameraSettings = {
  width: 640,
  height: 360,
  fps: 24,
  enabled: false
};

// Raw camera data store
export const cameraData = writable<CameraData | null>(null);

// Camera settings store
export const cameraSettings = writable<CameraSettings>(defaultSettings);

// Enabled state (derived from app settings)
export const cameraEnabled = derived(
  [appSettings],
  ([$appSettings]) => $appSettings.cameraEnabled
);

// Processed camera data (with any filtering/processing)
export const processedCamera = derived(
  [cameraData, cameraSettings],
  ([$data, $settings]) => {
    if (!$data || !$settings.enabled) {
      return null;
    }
    
    // Apply any processing here (scaling, filtering, etc.)
    return {
      ...$data,
      // Add processed fields as needed
    };
  }
);
