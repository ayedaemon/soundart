import { writable, derived } from 'svelte/store';
import type { GestureData, FaceLandmarks, HandLandmarks } from '$lib/camera/types';
import { appSettings } from './settings';

/**
 * Gesture settings
 */
export interface GestureSettings {
  enabled: boolean;
  minConfidence: number; // 0-1, minimum confidence to report gesture
  smoothing: number; // 0-1, temporal smoothing factor
}

const defaultSettings: GestureSettings = {
  enabled: false,
  minConfidence: 0.6,
  smoothing: 0.7
};

// Raw gesture data store
export const gestureData = writable<GestureData | null>(null);

// Gesture settings store
export const gestureSettings = writable<GestureSettings>(defaultSettings);

// Enabled state (derived from camera enabled in app settings)
// Note: Camera UI removed, so this will always be false
export const gestureEnabled = derived(
  [appSettings],
  ([$appSettings]) => $appSettings.cameraEnabled
);

// Processed gesture data with smoothing and filtering
let smoothedFaces: FaceLandmarks[] = [];
let smoothedHands: HandLandmarks[] = [];

export const processedGestures = derived(
  [gestureData, gestureSettings],
  ([$data, $settings]) => {
    if (!$data || !$settings.enabled) {
      smoothedFaces = [];
      smoothedHands = [];
      return null;
    }
    
    // Apply temporal smoothing
    const smoothing = $settings.smoothing;
    
    // Smooth faces
    if ($data.faces && $data.faces.length > 0) {
      const currentFace = $data.faces[0];
      if (smoothedFaces.length === 0) {
        smoothedFaces = [currentFace];
      } else {
        const prevFace = smoothedFaces[0];
        smoothedFaces[0] = {
          ...currentFace,
          center: {
            x: prevFace.center.x * smoothing + currentFace.center.x * (1 - smoothing),
            y: prevFace.center.y * smoothing + currentFace.center.y * (1 - smoothing)
          }
        };
      }
    } else {
      smoothedFaces = [];
    }
    
    // Smooth hands
    smoothedHands = $data.hands?.map((hand, index) => {
      const prevHand = smoothedHands[index];
      if (!prevHand) {
        return hand;
      }
      
      return {
        ...hand,
        center: hand.center ? {
          x: prevHand.center?.x ? prevHand.center.x * smoothing + hand.center.x * (1 - smoothing) : hand.center.x,
          y: prevHand.center?.y ? prevHand.center.y * smoothing + hand.center.y * (1 - smoothing) : hand.center.y
        } : hand.center
      };
    }) || [];
    
    // Filter by confidence
    const filteredHands = smoothedHands.filter(hand => {
      if (!hand.gesture || !hand.gestureIntensity) {
        return true; // Keep hands without gestures
      }
      return hand.gestureIntensity >= $settings.minConfidence;
    });
    
    return {
      faces: smoothedFaces,
      hands: filteredHands
    };
  }
);
