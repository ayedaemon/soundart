import { writable, derived } from 'svelte/store';
import type { LayerState, LayerUniforms } from '$lib/types';
import { layerDefinitions } from '$lib/layers/registry';
import { processedAudio } from './audio';
import { globalZoom, globalSpeed } from './settings';


function createInitialLayerStates(): Map<string, LayerState> {
  const states = new Map<string, LayerState>();
  
  for (const def of layerDefinitions) {
    const properties: Record<string, number | boolean> = {};
    for (const prop of def.properties) {
      properties[prop.id] = prop.default;
    }
    
    states.set(def.id, {
      id: def.id,
      enabled: false,
      properties,
      includeInRandomizer: def.randomizable !== false,
      includeInStrobe: def.randomizable !== false
    });
  }
  
  return states;
}


export const layerStates = writable<Map<string, LayerState>>(createInitialLayerStates());


export function updateLayerProperty(layerId: string, propertyId: string, value: number | boolean): void {
  layerStates.update(states => {
    const state = states.get(layerId);
    if (state) {
      state.properties[propertyId] = value;
    }
    return states;
  });
}


export function getEnabledLayerCount(states: Map<string, LayerState>): number {
  let count = 0;
  for (const state of states.values()) {
    if (state.enabled) count++;
  }
  return count;
}


export function toggleLayer(layerId: string, maxLayers?: number): boolean {
  let wasEnabled = false;
  
  layerStates.update(states => {
    const state = states.get(layerId);
    if (state) {
      
      if (!state.enabled && maxLayers !== undefined) {
        const currentCount = getEnabledLayerCount(states);
        if (currentCount >= maxLayers) {
          
          return states;
        }
      }
      
      state.enabled = !state.enabled;
      wasEnabled = state.enabled;
      
      
      if (state.enabled) {
        const def = layerDefinitions.find(d => d.id === layerId);
        const intensityProp = def?.properties.find(p => p.id === 'intensity');
        if (intensityProp) {
          state.properties.intensity = intensityProp.default;
        }
      }
    }
    return states;
  });
  
  return wasEnabled;
}


export function toggleRandomizerInclusion(layerId: string): void {
  layerStates.update(states => {
    const state = states.get(layerId);
    if (state) {
      state.includeInRandomizer = !state.includeInRandomizer;
    }
    return states;
  });
}


export function toggleStrobeInclusion(layerId: string): void {
  layerStates.update(states => {
    const state = states.get(layerId);
    if (state) {
      state.includeInStrobe = !state.includeInStrobe;
    }
    return states;
  });
}

/** Set includeInRandomizer for all layers at once. */
export function setAllIncludeInRandomizer(on: boolean): void {
  layerStates.update(states => {
    for (const state of states.values()) {
      state.includeInRandomizer = on;
    }
    return states;
  });
}

/** Set includeInStrobe for all layers at once. */
export function setAllIncludeInStrobe(on: boolean): void {
  layerStates.update(states => {
    for (const state of states.values()) {
      state.includeInStrobe = on;
    }
    return states;
  });
}

export function setAllLayersEnabled(enabled: boolean, maxLayers?: number): void {
  layerStates.update(states => {
    let enabledCount = 0;
    
    for (const state of states.values()) {
      if (enabled && maxLayers !== undefined && enabledCount >= maxLayers) {
        
        state.enabled = false;
        continue;
      }
      
      state.enabled = enabled;
      if (enabled) enabledCount++;
      
      
      if (state.enabled) {
        const def = layerDefinitions.find(d => d.id === state.id);
        const intensityProp = def?.properties.find(p => p.id === 'intensity');
        if (intensityProp) {
          state.properties.intensity = intensityProp.default;
        }
      }
    }
    return states;
  });
}


export const layerConfig = derived(
  layerStates,
  ($layerStates) => {
    
    
    
    
    
    
    
    return Array.from($layerStates.values()).map(state => {
      
      const uniforms: Record<string, number> = {};
      const def = layerDefinitions.find(d => d.id === state.id);
      
      if (def) {
        for (const prop of def.properties) {
          const value = state.properties[prop.id];
          uniforms[prop.uniform] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
        }
      }
      
      return {
        id: state.id,
        enabled: state.enabled,
        uniforms
      };
    });
  }
);





// Create derived store for flattened uniforms
// This is what gets sent to the shader
export const layerUniforms = derived(
  [layerStates, processedAudio, globalZoom, globalSpeed],
  ([$layerStates, $audio, $globalZoom, $globalSpeed]) => {
    const uniforms: LayerUniforms = {};
    
    for (const def of layerDefinitions) {
      const state = $layerStates.get(def.id);
      if (!state) continue;
      
      for (const prop of def.properties) {
        const rawValue = state.properties[prop.id] ?? prop.default;
        let value = typeof rawValue === 'boolean' ? (rawValue ? 1 : 0) : rawValue;
        
        // If layer is disabled, set intensity to 0
        // This allows the shader to skip expensive calculations for this layer
        if (prop.id === 'intensity' && !state.enabled) {
          value = 0;
        }
        
        // Apply global zoom modifier
        if (prop.id === 'zoom') {
          value = value * $globalZoom;
        }
        
        // Apply global speed modifier
        if (prop.id === 'speed') {
          value = value * $globalSpeed;
        }
        
        uniforms[prop.uniform] = value;
      }
    }
    
    return uniforms;
  }
);
