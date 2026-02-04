import { writable, derived } from 'svelte/store';
import { sensorRegistry } from '$lib/sensors/SensorRegistry';
import { appSettings } from './settings';

/**
 * Sensor registry state store
 * Tracks which sensors are registered and enabled
 */
export interface SensorRegistryState {
  registered: string[];
  enabled: string[];
}

const defaultState: SensorRegistryState = {
  registered: [],
  enabled: []
};

export const sensorRegistryState = writable<SensorRegistryState>(defaultState);

/**
 * Update the sensor registry state
 */
export function updateSensorRegistryState(): void {
  sensorRegistryState.set({
    registered: sensorRegistry.getRegisteredIds(),
    enabled: sensorRegistry.getEnabledIds()
  });
}

/**
 * Check if a sensor is available (registered)
 */
export function isSensorAvailable(id: string): boolean {
  return sensorRegistry.getRegisteredIds().includes(id);
}

/**
 * Check if a sensor is enabled
 */
export function isSensorEnabled(id: string): boolean {
  return sensorRegistry.isEnabled(id);
}
