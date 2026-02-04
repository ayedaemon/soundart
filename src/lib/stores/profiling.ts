import { writable, get } from 'svelte/store';
import { layerProfiler, type LayerProfileResult } from '$lib/utils/layerProfiler';
import { layerDefinitions } from '$lib/layers/registry';
import { layerStates, setAllLayersEnabled } from './layers';

export interface ProfilingState {
  isActive: boolean;
  currentLayerIndex: number;
  progress: number;
  results: LayerProfileResult[];
  savedLayerStates: Map<string, boolean> | null; // Store original layer states
}

const defaultState: ProfilingState = {
  isActive: false,
  currentLayerIndex: -1,
  progress: 0,
  results: [],
  savedLayerStates: null
};

export const profilingState = writable<ProfilingState>(defaultState);

/**
 * Start profiling all layers sequentially
 */
export async function startProfiling(): Promise<void> {
  if (layerProfiler.isCurrentlyProfiling()) {
    return; // Already profiling
  }

  // Save current layer states
  const currentStates = get(layerStates);
  const savedStates = new Map<string, boolean>();
  for (const [id, state] of currentStates.entries()) {
    savedStates.set(id, state.enabled);
  }

  // Reset profiler
  layerProfiler.reset();
  
  // Disable all layers initially
  setAllLayersEnabled(false, undefined);
  
  // Start with first layer
  const firstLayer = layerDefinitions[0];
  if (firstLayer) {
    // Enable first layer for profiling (bypass maxLayers check)
    layerStates.update(states => {
      const state = states.get(firstLayer.id);
      if (state) {
        state.enabled = true;
      }
      return states;
    });
    layerProfiler.startProfiling(firstLayer.id);
    profilingState.set({
      isActive: true,
      currentLayerIndex: 0,
      progress: 0,
      results: [],
      savedLayerStates: savedStates
    });
  }
}

/**
 * Stop profiling and restore original layer states
 */
export function stopProfiling(): void {
  const state = get(profilingState);
  if (!state.isActive) {
    return;
  }

  // Stop profiling if still active
  if (layerProfiler.isCurrentlyProfiling()) {
    layerProfiler.stopProfiling();
  }
  
  // Calculate final results
  layerProfiler.calculateRelativeCosts();
  const results = layerProfiler.getResults();
  
  // Restore original layer states
  if (state.savedLayerStates) {
    layerStates.update(states => {
      for (const [id, enabled] of state.savedLayerStates!.entries()) {
        const layerState = states.get(id);
        if (layerState && layerState.enabled !== enabled) {
          layerState.enabled = enabled;
        }
      }
      return states;
    });
  }
  
  profilingState.set({
    isActive: false,
    currentLayerIndex: -1,
    progress: 0,
    results,
    savedLayerStates: null
  });
}

/**
 * Update profiling progress (called from render loop)
 */
export function updateProfilingProgress(): void {
  if (!layerProfiler.isCurrentlyProfiling()) {
    return;
  }

  const currentLayer = layerProfiler.getCurrentLayer();
  if (!currentLayer) {
    return;
  }

  const progress = layerProfiler.getProgress();
  const layerIndex = layerDefinitions.findIndex(l => l.id === currentLayer);
  
  profilingState.update(state => ({
    ...state,
    progress,
    currentLayerIndex: layerIndex
  }));

  // Check if current layer profiling is complete
  if (layerProfiler.isCurrentLayerComplete()) {
    // Move to next layer
    const nextIndex = layerIndex + 1;
    if (nextIndex < layerDefinitions.length) {
      // Stop profiling current layer before moving to next
      layerProfiler.stopProfiling();
      
      const nextLayer = layerDefinitions[nextIndex];
      // Disable current layer
      layerStates.update(states => {
        const currentState = states.get(currentLayer);
        if (currentState) {
          currentState.enabled = false;
        }
        return states;
      });
      
      // Enable and start profiling next layer (bypass maxLayers check)
      // Small delay to ensure layer state updates before starting next profiling
      requestAnimationFrame(() => {
        layerStates.update(states => {
          const nextState = states.get(nextLayer.id);
          if (nextState) {
            nextState.enabled = true;
          }
          return states;
        });
        layerProfiler.startProfiling(nextLayer.id);
        
        profilingState.update(state => ({
          ...state,
          currentLayerIndex: nextIndex,
          progress: 0
        }));
      });
    } else {
      // All layers profiled - let stopProfiling() handle everything
      stopProfiling();
    }
  }
}
