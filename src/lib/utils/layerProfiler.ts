/**
 * Layer GPU Performance Profiler
 * 
 * Profiles each layer individually to determine GPU cost.
 * Measures frame time when rendering each layer alone.
 */

import { layerDefinitions } from '$lib/layers/registry';
import type { LayerConfig } from '$lib/core/types/layer';

export interface LayerProfileResult {
  layerId: string;
  layerName: string;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  fps: number;
  relativeCost: number; // Normalized cost (1.0 = baseline)
}

export class LayerProfiler {
  private frameTimes: Map<string, number[]> = new Map();
  private startTime: number = 0;
  private frameCount: number = 0;
  private currentLayer: string | null = null;
  private samplesPerLayer: number = 60; // Sample 60 frames per layer
  private isProfiling: boolean = false;
  private results: LayerProfileResult[] = [];

  /**
   * Start profiling a specific layer
   */
  startProfiling(layerId: string): void {
    this.currentLayer = layerId;
    this.frameTimes.set(layerId, []);
    this.frameCount = 0;
    this.isProfiling = true;
    this.startTime = performance.now();
  }

  /**
   * Record a frame time for the current layer being profiled
   */
  recordFrame(): void {
    if (!this.isProfiling || !this.currentLayer) return;

    const now = performance.now();
    const frameTime = now - this.startTime;
    this.startTime = now;

    const times = this.frameTimes.get(this.currentLayer) || [];
    times.push(frameTime);
    this.frameTimes.set(this.currentLayer, times);

    this.frameCount++;
  }

  /**
   * Check if current layer has enough samples
   */
  isCurrentLayerComplete(): boolean {
    return this.frameCount >= this.samplesPerLayer;
  }

  /**
   * Stop profiling the current layer
   */
  stopProfiling(): void {
    this.isProfiling = false;
    this.currentLayer = null;
    this.frameCount = 0;
  }

  /**
   * Get results for a specific layer
   */
  getLayerResult(layerId: string): LayerProfileResult | null {
    const times = this.frameTimes.get(layerId);
    if (!times || times.length === 0) return null;

    const avgFrameTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minFrameTime = Math.min(...times);
    const maxFrameTime = Math.max(...times);
    const fps = 1000 / avgFrameTime;

    const layerDef = layerDefinitions.find(l => l.id === layerId);
    const layerName = layerDef?.label || layerId;

    return {
      layerId,
      layerName,
      avgFrameTime,
      minFrameTime,
      maxFrameTime,
      fps,
      relativeCost: 0 // Will be calculated after all layers are profiled
    };
  }

  /**
   * Calculate relative costs for all profiled layers
   */
  calculateRelativeCosts(): void {
    const results: LayerProfileResult[] = [];
    
    for (const [layerId, times] of this.frameTimes.entries()) {
      const result = this.getLayerResult(layerId);
      if (result) {
        results.push(result);
      }
    }

    // Find the baseline (cheapest layer)
    const baseline = Math.min(...results.map(r => r.avgFrameTime));
    
    // Calculate relative costs
    results.forEach(result => {
      result.relativeCost = result.avgFrameTime / baseline;
    });

    // Sort by cost (most expensive first)
    results.sort((a, b) => b.avgFrameTime - a.avgFrameTime);
    
    this.results = results;
  }

  /**
   * Get all results sorted by GPU cost
   */
  getResults(): LayerProfileResult[] {
    return this.results;
  }

  /**
   * Get the most expensive layer
   */
  getMostExpensiveLayer(): LayerProfileResult | null {
    if (this.results.length === 0) return null;
    return this.results[0];
  }

  /**
   * Reset all profiling data
   */
  reset(): void {
    this.frameTimes.clear();
    this.results = [];
    this.currentLayer = null;
    this.isProfiling = false;
    this.frameCount = 0;
  }

  /**
   * Check if currently profiling
   */
  isCurrentlyProfiling(): boolean {
    return this.isProfiling;
  }

  /**
   * Get current layer being profiled
   */
  getCurrentLayer(): string | null {
    return this.currentLayer;
  }

  /**
   * Get progress (0-1) for current profiling session
   */
  getProgress(): number {
    if (!this.isProfiling) return 0;
    return this.frameCount / this.samplesPerLayer;
  }
}

// Singleton instance
export const layerProfiler = new LayerProfiler();
