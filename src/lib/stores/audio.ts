import { writable, derived } from 'svelte/store';
import type { AudioMetrics, AudioSettings } from '$lib/types';

// Default audio metrics (all zeros)
const defaultMetrics: AudioMetrics = {
  energy: 0,
  treble: 0,
  bass: 0,
  mids: 0,
  highs: 0,
  lows: 0,
  beat: 0
};

// Default audio settings
const defaultSettings: AudioSettings = {
  sensitivity: 1.0,
  highsBoost: 1.0,
  midsBoost: 1.0,
  lowsBoost: 1.0,
  trebleBoost: 1.0,
  bassBoost: 1.0,
  beatBoost: 1.0,
  minMotion: 0.02,
  beatGate: 0.35,
  autoEnabled: false,
  autoStrength: 0.4,
  autoDecay: 0.6,
  autoTarget: 'all'
};

// Raw audio metrics from the analyzer
export const audioMetrics = writable<AudioMetrics>(defaultMetrics);

// Audio tuning settings
export const audioSettings = writable<AudioSettings>(defaultSettings);

// Microphone status
export const micEnabled = writable<boolean>(false);

// Auto-envelope value (for auto-suggest feature)
export const autoEnvelope = writable<number>(0);

// Helper to clamp values
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Processed audio metrics (after applying settings)
// This derived store applies sensitivity, boosts, and auto-envelope logic
// to generate the final values used by the visualizer layers.
export const processedAudio = derived(
  [audioMetrics, audioSettings, autoEnvelope],
  ([$metrics, $settings, $autoEnvelope]) => {
    const sens = clamp($settings.sensitivity, 0, 2);
    
    // Apply sensitivity and boosts
    let energy = clamp($metrics.energy * sens, 0, 2);
    let treble = clamp($metrics.treble * sens * $settings.trebleBoost, 0, 2);
    let beat = clamp($metrics.beat * sens * $settings.beatBoost * $settings.bassBoost, 0, 2);
    
    // Apply overall boost from frequency boosts
    const overallBoost = ($settings.highsBoost + $settings.midsBoost + $settings.lowsBoost) / 3;
    energy *= overallBoost;
    
    // Apply minimum motion threshold
    // Ensures visuals don't completely freeze during silence
    energy = Math.max(energy, $settings.minMotion);
    treble = Math.max(treble, $settings.minMotion);
    beat = Math.max(beat, $settings.minMotion);
    
    // Apply auto-suggest if enabled
    // This adds a decaying envelope to specific metrics when a beat is detected
    if ($settings.autoEnabled && $autoEnvelope > 0) {
      const autoOffset = $autoEnvelope * $settings.autoStrength;
      switch ($settings.autoTarget) {
        case 'energy':
          energy += autoOffset;
          break;
        case 'treble':
          treble += autoOffset;
          break;
        case 'beat':
          beat += autoOffset;
          break;
        default:
          energy += autoOffset;
          treble += autoOffset;
          beat += autoOffset;
      }
    }
    
    return {
      energy: clamp(energy, 0, 2),
      treble: clamp(treble, 0, 2),
      beat: clamp(beat, 0, 2),
      // Pass through raw metrics for level display in the UI
      raw: {
        highs: clamp($metrics.highs * sens, 0, 2),
        mids: clamp($metrics.mids * sens, 0, 2),
        lows: clamp($metrics.lows * sens, 0, 2),
        treble: clamp($metrics.treble * sens, 0, 2),
        bass: clamp($metrics.bass * sens, 0, 2),
        beat: clamp($metrics.beat * sens, 0, 2)
      }
    };
  }
);

