import { writable } from 'svelte/store';

export interface PerformanceStats {
  fps: number;
  frameTime: number;        // ms per frame
  targetFps: number;        // 30 in power saver, 60 otherwise
  cpuSavings: number;       // estimated % savings vs 60fps
  mode: 'normal' | 'power-saver';
}

const defaultStats: PerformanceStats = {
  fps: 0,
  frameTime: 0,
  targetFps: 60,
  cpuSavings: 0,
  mode: 'normal'
};

export const performanceStats = writable<PerformanceStats>(defaultStats);

// Helper to update stats
export function updatePerformanceStats(stats: Partial<PerformanceStats>): void {
  performanceStats.update(s => ({ ...s, ...stats }));
}
