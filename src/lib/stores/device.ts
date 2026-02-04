import { writable } from 'svelte/store';
import type { DevicePreset } from '$lib/types';
import { browser } from '$app/environment';

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEnd: boolean;
  cpuCores: number;
  deviceMemory: number | null;
  detectedPreset: DevicePreset;
}

const defaultCapabilities: DeviceCapabilities = {
  isMobile: false,
  isLowEnd: false,
  cpuCores: 4,
  deviceMemory: null,
  detectedPreset: 'auto'
};

export const deviceCapabilities = writable<DeviceCapabilities>(defaultCapabilities);

export function detectDeviceCapabilities(): void {
  if (!browser) return;

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)); 
  
  const cpuCores = navigator.hardwareConcurrency || 4;
  // @ts-ignore - deviceMemory is experimental but supported in Chrome
  const deviceMemory = (navigator as any).deviceMemory || null;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Check for battery API (if available)
  // @ts-ignore - Battery API is experimental
  const battery = (navigator as any).getBattery ? null : null; // Will be async if available
  
  // Smart detection logic
  let detectedPreset: DevicePreset = 'desktop';
  
  if (isMobile) {
    // Mobile device - check capabilities for refinement
    if (cpuCores >= 6 && deviceMemory && deviceMemory >= 6) {
      // High-end mobile (flagship phones)
      detectedPreset = 'laptop'; // Can handle more than basic mobile
    } else {
      detectedPreset = 'mobile';
    }
  } else {
    // Desktop/laptop detection
    const isLowEnd = cpuCores < 4 || (deviceMemory !== null && deviceMemory < 4);
    const isMidRange = (cpuCores >= 4 && cpuCores < 8) || (deviceMemory !== null && deviceMemory >= 4 && deviceMemory < 8);
    const isHighEnd = cpuCores >= 8 && (deviceMemory === null || deviceMemory >= 8);
    
    // Screen size consideration
    const isSmallScreen = screenWidth < 1280;
    const isLargeScreen = screenWidth >= 1920;
    
    if (isLowEnd || (isMidRange && isSmallScreen)) {
      detectedPreset = 'laptop';
    } else if (isHighEnd && isLargeScreen) {
      detectedPreset = 'desktop';
    } else if (isMidRange) {
      detectedPreset = 'laptop';
    } else {
      // Default to desktop for unknown configurations
      detectedPreset = 'desktop';
    }
  }

  deviceCapabilities.set({
    isMobile,
    isLowEnd: cpuCores < 4 || (deviceMemory !== null && deviceMemory < 4),
    cpuCores,
    deviceMemory,
    detectedPreset
  });
  
  // Device detection complete - preset applied automatically
}
