import { writable, derived } from 'svelte/store';
import type { MouseMetrics } from '$lib/types';

// Mouse state interface
interface MouseState {
  position: { x: number; y: number };      // Normalized 0-1 (center is 0.5, 0.5)
  velocity: { x: number; y: number };      // Movement delta per frame
  speed: number;                           // Magnitude of velocity (0-1)
  isDown: boolean;                         // Left button pressed
  clickPosition: { x: number; y: number }; // Last click location (normalized)
  isInside: boolean;                       // Mouse is inside canvas
}

// Default mouse state
const defaultMouseState: MouseState = {
  position: { x: 0.5, y: 0.5 },
  velocity: { x: 0, y: 0 },
  speed: 0,
  isDown: false,
  clickPosition: { x: 0.5, y: 0.5 },
  isInside: false
};

// Raw mouse state store
export const mouseState = writable<MouseState>(defaultMouseState);

// Smoothing settings
const VELOCITY_SMOOTHING = 0.15;
const SPEED_SMOOTHING = 0.1;

// Previous values for smoothing
let smoothedVelocity = { x: 0, y: 0 };
let smoothedSpeed = 0;

// Helper to clamp values
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Processed mouse metrics (after applying smoothing)
export const processedMouse = derived(
  mouseState,
  ($state) => {
    // Smooth velocity
    smoothedVelocity.x += ($state.velocity.x - smoothedVelocity.x) * VELOCITY_SMOOTHING;
    smoothedVelocity.y += ($state.velocity.y - smoothedVelocity.y) * VELOCITY_SMOOTHING;
    
    // Smooth speed
    smoothedSpeed += ($state.speed - smoothedSpeed) * SPEED_SMOOTHING;
    
    const metrics: MouseMetrics = {
      // Position in normalized coordinates (0-1)
      x: $state.position.x,
      y: $state.position.y,
      // Smoothed velocity
      velocityX: clamp(smoothedVelocity.x, -1, 1),
      velocityY: clamp(smoothedVelocity.y, -1, 1),
      // Smoothed speed magnitude
      speed: clamp(smoothedSpeed, 0, 1),
      // Click state
      down: $state.isDown ? 1 : 0,
      // Last click position
      clickX: $state.clickPosition.x,
      clickY: $state.clickPosition.y,
      // Is mouse inside canvas
      inside: $state.isInside ? 1 : 0
    };
    
    return metrics;
  }
);

// Update mouse position (call from mousemove handler)
export function updateMousePosition(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  deltaTime: number
): void {
  mouseState.update(state => {
    // Normalize coordinates to 0-1 range
    const newX = clamp((clientX - canvasRect.left) / canvasRect.width, 0, 1);
    const newY = clamp((clientY - canvasRect.top) / canvasRect.height, 0, 1);
    
    // Calculate velocity (pixels per ms, normalized)
    const dt = Math.max(deltaTime, 1); // Avoid division by zero
    const velX = (newX - state.position.x) / dt * 16.67; // Normalize to ~60fps
    const velY = (newY - state.position.y) / dt * 16.67;
    
    // Calculate speed (magnitude of velocity)
    const speed = Math.sqrt(velX * velX + velY * velY);
    
    return {
      ...state,
      position: { x: newX, y: newY },
      velocity: { x: velX, y: velY },
      speed: clamp(speed * 10, 0, 1), // Scale for usability
      isInside: true
    };
  });
}

// Mouse down handler
export function setMouseDown(clientX: number, clientY: number, canvasRect: DOMRect): void {
  mouseState.update(state => {
    const clickX = clamp((clientX - canvasRect.left) / canvasRect.width, 0, 1);
    const clickY = clamp((clientY - canvasRect.top) / canvasRect.height, 0, 1);
    
    return {
      ...state,
      isDown: true,
      clickPosition: { x: clickX, y: clickY }
    };
  });
}

// Mouse up handler
export function setMouseUp(): void {
  mouseState.update(state => ({
    ...state,
    isDown: false
  }));
}

// Mouse leave handler
export function setMouseLeave(): void {
  mouseState.update(state => ({
    ...state,
    isInside: false,
    velocity: { x: 0, y: 0 },
    speed: 0
  }));
}

// Reset mouse state
export function resetMouseState(): void {
  mouseState.set(defaultMouseState);
  smoothedVelocity = { x: 0, y: 0 };
  smoothedSpeed = 0;
}
