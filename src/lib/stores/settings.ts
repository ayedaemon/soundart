import { writable, get } from 'svelte/store';
import type { AppSettings, DevicePreset } from '$lib/types';
import { DEVICE_PRESETS } from '$lib/types';
import { deviceCapabilities } from '$lib/stores/device';
import { audioSettings } from '$lib/stores/audio';

const defaultSettings: AppSettings = {
  panelsVisible: true,
  fullscreen: false,
  pipEnabled: false,
  
  devicePreset: 'auto',
  autoApplyPreset: true,
  targetFps: 60,
  resolutionScale: 1.0,
  maxActiveLayers: 7,
  feedbackEnabled: true,
  
  randomizerCooldown: 2.0,
  randomizerToggleChance: 0.3,
  randomizerMode: 'flow',
  strobeMode: 'flash',

  powerSaverEnabled: false,
  cameraEnabled: false
};

export const appSettings = writable<AppSettings>(defaultSettings);


export const globalZoom = writable<number>(1.0);
export const globalSpeed = writable<number>(1.0);


export function adjustGlobalZoom(delta: number): void {
  globalZoom.update(z => Math.max(0.1, Math.min(5.0, z + delta)));
}


export function adjustGlobalSpeed(delta: number): void {
  globalSpeed.update(s => Math.max(0.1, Math.min(5.0, s + delta)));
}


export function togglePanels(): void {
  appSettings.update(s => ({ ...s, panelsVisible: !s.panelsVisible }));
}

/** Power saver: lower FPS, fewer layers, reduced res. Strobe and randomizer still work but respect maxActiveLayers. */
export function togglePowerSaver(): void {
  const current = get(appSettings);
  if (current.powerSaverEnabled) {
    // Turning off: restore current device preset
    applyDevicePreset(current.devicePreset);
    appSettings.update(s => ({ ...s, powerSaverEnabled: false }));
  } else {
    // Turning on: apply power-saver limits (laptop-like), keep strobe/random enabled
    appSettings.update(s => ({
      ...s,
      powerSaverEnabled: true,
      targetFps: 30,
      resolutionScale: 0.75,
      maxActiveLayers: 5,
      randomizerCooldown: Math.max(s.randomizerCooldown, 3.0),
      randomizerMode: s.randomizerMode === 'chaos' ? 'flow' : s.randomizerMode,
      strobeMode: s.strobeMode === 'flash' ? 'pulse' : s.strobeMode
    }));
  }
}


export function applyDevicePreset(preset: DevicePreset): void {
  if (preset === 'auto') {
    const caps = get(deviceCapabilities);
    const detectedPreset = caps.detectedPreset;
    const config = DEVICE_PRESETS[detectedPreset];
    
    // Apply app settings
    appSettings.update(s => ({
      ...s,
      devicePreset: 'auto',
      autoApplyPreset: true,
      targetFps: config.targetFps,
      resolutionScale: config.resolutionScale,
      maxActiveLayers: config.maxActiveLayers,
      feedbackEnabled: config.feedbackEnabled,
      randomizerCooldown: config.randomizerCooldown,
      randomizerMode: config.randomizerMode,
      strobeMode: config.strobeMode
    }));
    
    // Apply audio settings
    audioSettings.update(s => ({
      ...s,
      sensitivity: config.audioSensitivity,
      autoEnabled: config.audioAutoEnabled
    }));
  } else {
    const config = DEVICE_PRESETS[preset];
    
    // Apply app settings
    appSettings.update(s => ({
      ...s,
      devicePreset: preset,
      autoApplyPreset: false,
      targetFps: config.targetFps,
      resolutionScale: config.resolutionScale,
      maxActiveLayers: config.maxActiveLayers,
      feedbackEnabled: config.feedbackEnabled,
      randomizerCooldown: config.randomizerCooldown,
      randomizerMode: config.randomizerMode,
      strobeMode: config.strobeMode
    }));
    
    // Apply audio settings
    audioSettings.update(s => ({
      ...s,
      sensitivity: config.audioSensitivity,
      autoEnabled: config.audioAutoEnabled
    }));
  }
}


export function cycleDevicePreset(): void {
  const caps = get(deviceCapabilities);
  const presets: DevicePreset[] = ['auto', 'desktop', 'laptop', 'mobile'];
  const currentPreset = get(appSettings).devicePreset;
  const currentIndex = presets.indexOf(currentPreset);
  const nextIndex = (currentIndex + 1) % presets.length;
  const nextPreset = presets[nextIndex];
  
  applyDevicePreset(nextPreset);
}

export function toggleAutoPreset(): void {
  const currentPreset = get(appSettings).devicePreset;
  if (currentPreset === 'auto') {
    const caps = get(deviceCapabilities);
    applyDevicePreset(caps.detectedPreset);
  } else {
    applyDevicePreset('auto');
  }
}

export function cycleRandomizerMode(): void {
  appSettings.update(s => {
    const modes: AppSettings['randomizerMode'][] = ['flow', 'chaos', 'subtle'];
    const nextIndex = (modes.indexOf(s.randomizerMode) + 1) % modes.length;
    return { ...s, randomizerMode: modes[nextIndex] };
  });
}

export function cycleStrobeMode(): void {
  appSettings.update(s => {
    const modes: AppSettings['strobeMode'][] = ['flash', 'pulse', 'drift'];
    const nextIndex = (modes.indexOf(s.strobeMode) + 1) % modes.length;
    return { ...s, strobeMode: modes[nextIndex] };
  });
}

// Camera functionality disabled - UI removed
// export function toggleCamera(): void {
//   appSettings.update(s => ({ ...s, cameraEnabled: !s.cameraEnabled }));
// }
