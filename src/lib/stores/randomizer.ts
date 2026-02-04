import { writable, get } from 'svelte/store';
import { layerStates, getEnabledLayerCount } from './layers';
import { layerDefinitions } from '$lib/layers/registry';
import { appSettings } from './settings';
import { themeDefinitions, themeAffinities, getTheme } from './themes';
import { BRIGHTNESS_VALUES } from '$lib/types';
import type { ThemeDefinition, ThemeBrightness, ThemeFamily } from '$lib/types';

interface RandomizerState {
  lastChangeTime: number;
  cooldown: number;
}

const randomizerState = writable<RandomizerState>({
  lastChangeTime: 0,
  cooldown: 2.0
});


const MAX_BRIGHTNESS_BUDGET = 2.5;

/**
 * Get a random value in a range
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Get a random integer in a range (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 * Throws if array is empty
 */
function randomChoice<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('randomChoice called with empty array');
  }
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Calculate current brightness budget from active layer themes
 * Excludes the layer being updated so its current theme doesn't affect the budget
 */
function calculateBrightnessBudget(
  allStates: Map<string, { enabled: boolean; properties: Record<string, number | boolean> }>,
  excludeLayerId: string
): number {
  let budget = 0;
  for (const [layerId, state] of allStates) {
    if (state.enabled && layerId !== excludeLayerId) {
      const theme = getTheme(state.properties.theme as number);
      if (theme) {
        budget += BRIGHTNESS_VALUES[theme.brightness];
      }
    }
  }
  return budget;
}

/**
 * Get themes filtered by allowed brightness levels
 */
function getThemesByBrightnessLevels(levels: ThemeBrightness[]): ThemeDefinition[] {
  return themeDefinitions.filter(t => levels.includes(t.brightness));
}

/**
 * Get the most common family among active themes
 * Excludes the layer being updated so its current theme doesn't influence selection
 */
function getDominantFamily(
  allStates: Map<string, { enabled: boolean; properties: Record<string, number | boolean> }>,
  excludeLayerId: string
): ThemeFamily | null {
  const familyCounts: Partial<Record<ThemeFamily, number>> = {};
  
  for (const [layerId, state] of allStates) {
    if (state.enabled && layerId !== excludeLayerId) {
      const theme = getTheme(state.properties.theme as number);
      if (theme) {
        familyCounts[theme.family] = (familyCounts[theme.family] || 0) + 1;
      }
    }
  }
  
  let maxCount = 0;
  let dominantFamily: ThemeFamily | null = null;
  
  for (const [family, count] of Object.entries(familyCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantFamily = family as ThemeFamily;
    }
  }
  
  return dominantFamily;
}

/**
 * Select a compatible theme based on current layer states
 * Uses brightness budget, family affinity, and temperature balance
 */
function selectCompatibleTheme(
  allStates: Map<string, { enabled: boolean; properties: Record<string, number | boolean> }>,
  excludeLayerId: string
): number {
  
  const currentBudget = calculateBrightnessBudget(allStates, excludeLayerId);
  const dominantFamily = getDominantFamily(allStates, excludeLayerId);
  
  // Determine allowed brightness levels based on remaining budget
  let allowedBrightness: ThemeBrightness[];
  if (currentBudget >= MAX_BRIGHTNESS_BUDGET) {
    // Budget exhausted, only allow dark themes
    allowedBrightness = ['dark'];
  } else if (currentBudget >= MAX_BRIGHTNESS_BUDGET - 0.5) {
    // Budget nearly full, allow dark or medium
    allowedBrightness = ['dark', 'medium'];
  } else {
    // Budget available, allow anything
    allowedBrightness = ['dark', 'medium', 'bright'];
  }
  
  const allowedThemes = getThemesByBrightnessLevels(allowedBrightness);
  
  // Fallback if no themes match criteria (should rarely happen)
  if (allowedThemes.length === 0) {
    return 0; 
  }
  
  // 50% chance to pick a theme from the dominant family (cohesion)
  if (dominantFamily && Math.random() < 0.5) {
    const familyThemeIds = themeAffinities[dominantFamily];
    const familyThemes = allowedThemes.filter(t => familyThemeIds.includes(t.id));
    if (familyThemes.length > 0) {
      return randomChoice(familyThemes).id;
    }
  }
  
  // 30% chance to pick a contrasting temperature (visual interest)
  if (Math.random() < 0.3) {
    const activeTemps = new Set<string>();
    for (const [layerId, state] of allStates) {
      if (state.enabled && layerId !== excludeLayerId) {
        const theme = getTheme(state.properties.theme as number);
        if (theme) activeTemps.add(theme.temperature);
      }
    }
    
    // If all active layers have the same temperature, try to pick the opposite
    if (activeTemps.size === 1) {
      const currentTemp = [...activeTemps][0];
      let contrastTemp: ThemeDefinition['temperature'] | null = null;
      if (currentTemp === 'warm') contrastTemp = 'cool';
      else if (currentTemp === 'cool') contrastTemp = 'warm';
      
      if (contrastTemp) {
        const contrastThemes = allowedThemes.filter(t => t.temperature === contrastTemp);
        if (contrastThemes.length > 0) {
          return randomChoice(contrastThemes).id;
        }
      }
    }
  }
  
  // Default: pick random allowed theme
  return randomChoice(allowedThemes).id;
}

/**
 * Get intensity range based on theme brightness
 * Dark themes need higher intensity to be visible
 * Bright themes should be more subtle to prevent oversaturation
 */
function getIntensityRangeForTheme(themeId: number): { min: number; max: number } {
  const theme = getTheme(themeId);
  if (!theme) return { min: 0.3, max: 0.7 };
  
  switch (theme.brightness) {
    case 'dark':
      return { min: 0.5, max: 0.9 };   // Boost dark themes
    case 'medium':
      return { min: 0.3, max: 0.7 };   // Standard range
    case 'bright':
      return { min: 0.2, max: 0.5 };   // Reduce bright themes
  }
}

/**
 * Update the randomizer based on audio metrics
 */
export function updateRandomizer(beat: number): void {
  const settings = get(appSettings);
  const state = get(randomizerState);
  const now = performance.now() / 1000;
  
  // Check cooldown
  // Adjust cooldown based on mode
  let effectiveCooldown = settings.randomizerCooldown;
  if (settings.randomizerMode === 'chaos') effectiveCooldown *= 0.25;
  if (settings.randomizerMode === 'subtle') effectiveCooldown *= 2.5;

  if (now - state.lastChangeTime < effectiveCooldown) return;
  
  // Check beat threshold
  let beatThreshold = 0.6;
  if (settings.randomizerMode === 'chaos') beatThreshold = 0.4;
  if (settings.randomizerMode === 'subtle') beatThreshold = 0.8;

  if (beat < beatThreshold) return;
  
  // Select a random layer to update
  // Note: No layers currently require camera (camera UI removed)
  const states = get(layerStates);
  const participatingLayers = layerDefinitions.filter(def => {
    if (def.requiresCamera && !settings.cameraEnabled) return false;
    const layerState = states.get(def.id);
    return def.randomizable !== false &&
           (layerState?.includeInRandomizer || layerState?.includeInStrobe);
  });
  
  if (participatingLayers.length === 0) return;
  
  // Pick one layer to modify
  const targetLayer = participatingLayers[randomInt(0, participatingLayers.length - 1)];
  const targetState = states.get(targetLayer.id);
  if (!targetState) return;
  
  // Apply changes
  layerStates.update(allStates => {
    const state = allStates.get(targetLayer.id);
    if (!state) return allStates;
    
    // Handle Strobe (Enable/Disable toggling)
    if (state.includeInStrobe) {
      let toggleChance = settings.randomizerToggleChance;
      
      // Adjust toggle chance based on strobe mode
      if (settings.strobeMode === 'pulse') toggleChance = 0.8;
      if (settings.strobeMode === 'drift') toggleChance = 0.05;
      
      if (Math.random() < toggleChance) {
        const wouldEnable = !state.enabled;
        // Respect max concurrent layers (power saver and preset limit)
        if (wouldEnable && getEnabledLayerCount(allStates) >= settings.maxActiveLayers) {
          return allStates;
        }
        state.enabled = !state.enabled;
      }
    }
    
    // Handle Parameter Randomization
    if (state.enabled && state.includeInRandomizer) {
      
      const layerDef = layerDefinitions.find(d => d.id === targetLayer.id);
      if (!layerDef) return allStates;
      
      // Determine probability of changing a property
      let changeChance = 1.0;
      if (settings.randomizerMode === 'flow') changeChance = 0.5;
      if (settings.randomizerMode === 'subtle') changeChance = 0.2;
      
      // Iterate through properties and potentially randomize them
      for (const prop of layerDef.properties) {
        if (!prop.randomizable) continue;
        
        // Skip based on chance
        if (Math.random() > changeChance) continue;
        
        // Special handling for Theme
        if (prop.id === 'theme') {
          // Subtle mode rarely changes themes to maintain visual consistency
          if (settings.randomizerMode === 'subtle' && Math.random() > 0.1) continue;
          
          state.properties.theme = selectCompatibleTheme(allStates, targetLayer.id);
          continue;
        }
        
        // Special handling for Intensity
        if (prop.id === 'intensity') {
          const intensityRange = getIntensityRangeForTheme(state.properties.theme as number);
          state.properties.intensity = randomInRange(intensityRange.min, intensityRange.max);
          continue;
        }

        // Handle boolean properties
        if (prop.type === 'boolean') {
          state.properties[prop.id] = Math.random() < 0.5;
          continue;
        }

        // Handle generic select properties (non-theme)
        if (prop.type === 'select') {
          const options = prop.options?.map(o => o.value) ?? [];
          if (options.length === 0) continue;

          const current = state.properties[prop.id] as number;
          let nextValue = options[Math.floor(Math.random() * options.length)];

          // Prefer changing the value when possible
          if (options.length > 1 && typeof current === 'number' && nextValue === current) {
            const currentIndex = options.indexOf(current);
            const offset = 1 + Math.floor(Math.random() * (options.length - 1));
            nextValue = options[(Math.max(0, currentIndex) + offset) % options.length];
          }

          state.properties[prop.id] = nextValue;
          continue;
        }
        
        // Handle numeric properties
        if ((prop.type === 'float' || prop.type === 'int') && prop.min !== undefined && prop.max !== undefined) {
          const min = prop.randomMin ?? prop.min;
          const max = prop.randomMax ?? prop.max;
          
          // Calculate new value
          let targetValue: number;
          
          // Full range jump or small step?
          if (prop.type === 'int' || (prop.step && prop.step >= 1)) {
            targetValue = randomInt(min, max);
          } else {
            targetValue = randomInRange(min, max);
          }
          
          // For non-chaos modes, limit the jump size to keep transitions smoother
          // or keep values closer to their previous state
          if (settings.randomizerMode !== 'chaos') {
            const current = state.properties[prop.id] as number;
            const jumpScale = settings.randomizerMode === 'subtle' ? 0.1 : 0.3;
            const range = max - min;
            const maxJump = range * jumpScale;
            
            // Clamp new target within a window around current value
            const lower = Math.max(min, current - maxJump);
            const upper = Math.min(max, current + maxJump);
            
            if (prop.step && prop.step >= 1) {
               targetValue = randomInt(Math.floor(lower), Math.ceil(upper));
            } else {
               targetValue = randomInRange(lower, upper);
            }
          }
          
          state.properties[prop.id] = targetValue;
          continue;
        }

        if (prop.type === 'boolean') {
          const current = state.properties[prop.id] as boolean;
          const nextValue = typeof current === 'boolean' ? !current : !prop.default;
          state.properties[prop.id] = nextValue;
          continue;
        }
      }
    }
    
    return allStates;
  });
  
  // Update last change time
  randomizerState.update(s => ({ ...s, lastChangeTime: now }));
}

/**
 * One-shot: apply smart random values to a single layer's parameters (theme, intensity, zoom, etc.).
 * Uses current randomizer preset for style; no beat or cooldown.
 */
export function randomizeLayerNow(layerId: string): void {
  const settings = get(appSettings);
  const layerDef = layerDefinitions.find(d => d.id === layerId);
  if (!layerDef || layerDef.randomizable === false) return;

  layerStates.update(allStates => {
    const state = allStates.get(layerId);
    if (!state) return allStates;

    const changeChance = 1.0; // apply to all randomizable props for one-shot

    for (const prop of layerDef.properties) {
      if (!prop.randomizable) continue;
      if (Math.random() > changeChance) continue;

      if (prop.id === 'theme') {
        if (settings.randomizerMode === 'subtle' && Math.random() > 0.1) continue;
        state.properties.theme = selectCompatibleTheme(allStates, layerId);
        continue;
      }
      if (prop.id === 'intensity') {
        const intensityRange = getIntensityRangeForTheme(state.properties.theme as number);
        state.properties.intensity = randomInRange(intensityRange.min, intensityRange.max);
        continue;
      }
      if (prop.type === 'boolean') {
        state.properties[prop.id] = Math.random() < 0.5;
        continue;
      }
      if (prop.type === 'select') {
        const options = prop.options?.map(o => o.value) ?? [];
        if (options.length === 0) continue;
        const current = state.properties[prop.id] as number;
        let nextValue = options[Math.floor(Math.random() * options.length)];
        if (options.length > 1 && typeof current === 'number' && nextValue === current) {
          const currentIndex = options.indexOf(current);
          const offset = 1 + Math.floor(Math.random() * (options.length - 1));
          nextValue = options[(Math.max(0, currentIndex) + offset) % options.length];
        }
        state.properties[prop.id] = nextValue;
        continue;
      }
      if ((prop.type === 'float' || prop.type === 'int') && prop.min !== undefined && prop.max !== undefined) {
        const min = prop.randomMin ?? prop.min;
        const max = prop.randomMax ?? prop.max;
        let targetValue: number;
        if (prop.type === 'int' || (prop.step && prop.step >= 1)) {
          targetValue = randomInt(min, max);
        } else {
          targetValue = randomInRange(min, max);
        }
        if (settings.randomizerMode !== 'chaos') {
          const current = state.properties[prop.id] as number;
          const jumpScale = settings.randomizerMode === 'subtle' ? 0.1 : 0.3;
          const range = max - min;
          const maxJump = range * jumpScale;
          const lower = Math.max(min, current - maxJump);
          const upper = Math.min(max, current + maxJump);
          if (prop.step && prop.step >= 1) {
            targetValue = randomInt(Math.floor(lower), Math.ceil(upper));
          } else {
            targetValue = randomInRange(lower, upper);
          }
        }
        state.properties[prop.id] = targetValue;
      }
    }
    return allStates;
  });
}
