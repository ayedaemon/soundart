// Camera and gesture tracking types

export interface FaceLandmarks {
  boundingBox: { x: number; y: number; width: number; height: number };
  keypoints: Array<{ x: number; y: number; z?: number }>; // 468 MediaPipe face landmarks
  center: { x: number; y: number };
}

export interface HandLandmarks {
  keypoints: Array<{ x: number; y: number; z?: number }>; // 21 MediaPipe hand landmarks
  center: { x: number; y: number };
  gesture?: 'Thumb_Up' | 'Thumb_Down' | 'Victory' | 'ILoveYou';
  gestureIntensity?: number; // 0-1, how strong/confident the gesture is
  side?: 'left' | 'right'; // Which hand (left or right)
}

export interface GestureData {
  faces: FaceLandmarks[];
  hands: HandLandmarks[];
  timestamp: number;
}

export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface CameraStatus {
  active: boolean;
  error?: string;
}
