import type { GestureData, FaceLandmarks, HandLandmarks } from './types';
import { loadMediaPipeFromCDN } from '$lib/utils/cdnLoader';

// MediaPipe types - will be loaded dynamically
type FaceLandmarkerType = any;
type HandLandmarkerType = any;
type FilesetResolverType = any;

// Gesture state tracking for temporal smoothing
interface GestureState {
  gesture: 'Thumb_Up' | 'Thumb_Down' | 'Victory' | 'ILoveYou' | undefined;
  intensity: number;
  confidence: number; // 0-1, how consistently detected
  lastSeen: number; // timestamp
  frameCount: number; // consecutive frames detected
}

/**
 * GestureTracker: Face and hand tracking using MediaPipe
 * Processes camera frames to detect faces and hands, extracts landmarks
 * Includes temporal tracking to reduce false positives
 */
export class GestureTracker {
  private faceDetector: FaceLandmarkerType | null = null;
  private handDetector: HandLandmarkerType | null = null;
  private enabled = false;
  private processing = false;
  private frameSkip = 2; // Process every Nth frame (30fps → 15fps tracking)
  private frameCount = 0;
  private initialized = false;
  private imageWidth = 640;
  private imageHeight = 360;
  
  // Temporal tracking: track gestures per hand over multiple frames
  private gestureHistory: Map<number, GestureState[]> = new Map(); // hand index -> gesture states
  private readonly MIN_CONSECUTIVE_FRAMES = 3; // Require 3 consecutive detections
  private readonly CONFIDENCE_THRESHOLD = 0.6; // Minimum confidence to report gesture
  private readonly INTENSITY_SMOOTHING = 0.7; // Exponential smoothing factor (0-1, higher = more smoothing)
  private readonly GESTURE_TIMEOUT_MS = 200; // Gesture expires after 200ms of no detection


  /**
   * Initialize MediaPipe models using CDN
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Only initialize in browser (not during SSR)
    if (typeof window === 'undefined') {
      console.warn('GestureTracker: Cannot initialize MediaPipe during SSR');
      this.initialized = false;
      return;
    }

    try {
      await this.initializeMediaPipeSolutions();
      this.initialized = true;
      console.log('GestureTracker: MediaPipe Solutions initialized successfully');
    } catch (error) {
      console.error('GestureTracker: Failed to initialize MediaPipe:', error);
      console.warn('GestureTracker: Continuing without face/hand tracking');
      this.initialized = false;
      // Fallback: allow system to work without tracking
    }
  }

  /**
   * Load MediaPipe Solutions from CDN at runtime
   * Uses the centralized CDN loader utility
   */
  private async loadMediaPipeFromCDN(): Promise<any> {
    return loadMediaPipeFromCDN();
  }

  /**
   * Initialize MediaPipe Solutions API using CDN
   */
  private async initializeMediaPipeSolutions(): Promise<void> {
    // Load MediaPipe from CDN at runtime
    const { FaceLandmarker, HandLandmarker, FilesetResolver } = await this.loadMediaPipeFromCDN();

    // Initialize FilesetResolver - WASM files will be loaded from CDN
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );

    // Initialize FaceLandmarker
    this.faceDetector = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'IMAGE',
      numFaces: 1
    });

    // Initialize HandLandmarker
    this.handDetector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      numHands: 2
    });
  }


  /**
   * Set image dimensions for coordinate normalization
   */
  setImageSize(width: number, height: number): void {
    this.imageWidth = width;
    this.imageHeight = height;
  }

  /**
   * Extract face landmarks from MediaPipe Solutions API results
   */
  private extractFaceLandmarksSolutions(faceResult: any): FaceLandmarks | null {
    if (!faceResult || !faceResult.faceLandmarks || faceResult.faceLandmarks.length === 0) {
      return null;
    }

    const landmarks = faceResult.faceLandmarks[0];
    const keypoints = landmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0
    }));

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    keypoints.forEach((kp: { x: number; y: number }) => {
      minX = Math.min(minX, kp.x);
      minY = Math.min(minY, kp.y);
      maxX = Math.max(maxX, kp.x);
      maxY = Math.max(maxY, kp.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      boundingBox: {
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height
      },
      keypoints,
      center: { x: centerX, y: centerY }
    };
  }

  /**
   * Extract hand landmarks from MediaPipe Solutions API results
   * @param handLandmarks - Array of hand landmarks from MediaPipe
   * @param handedness - Handedness classification from MediaPipe (optional)
   */
  private extractHandLandmarksSolutions(handLandmarks: any, handedness?: any): HandLandmarks | null {
    if (!handLandmarks || handLandmarks.length === 0) {
      return null;
    }

    const keypoints = handLandmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0
    }));

    const center = { x: keypoints[0].x, y: keypoints[0].y };
    const gestureResult = this.detectGesture(keypoints);
    
    // Extract hand side from MediaPipe handedness classification
    let handSide: 'left' | 'right' | undefined = undefined;
    if (handedness && handedness.length > 0 && handedness[0].categoryName) {
      const categoryName = handedness[0].categoryName.toLowerCase();
      if (categoryName === 'left' || categoryName === 'right') {
        handSide = categoryName as 'left' | 'right';
      }
    }

    return {
      keypoints,
      center,
      gesture: gestureResult.gesture,
      gestureIntensity: gestureResult.intensity,
      side: handSide
    };
  }


  /**
   * Enhanced gesture detection with intensity calculation
   */
  private detectGesture(keypoints: Array<{ x: number; y: number; z?: number }>): { gesture: 'Thumb_Up' | 'Thumb_Down' | 'Victory' | 'ILoveYou' | undefined; intensity: number } {
    // MediaPipe hand landmarks indices:
    // 0: wrist, 4: thumb tip, 8: index tip, 12: middle tip, 16: ring tip, 20: pinky tip
    // Joints: 5-6 (thumb), 6-7-8 (index), 9-10-11-12 (middle), 13-14-15-16 (ring), 17-18-19-20 (pinky)
    if (keypoints.length < 21) return { gesture: undefined, intensity: 0 };

    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    const pinkyTip = keypoints[20];
    const wrist = keypoints[0];
    const thumbIP = keypoints[3]; // Thumb IP joint
    const thumbMCP = keypoints[2]; // Thumb MCP joint

    // Calculate finger extension states (tip above PIP joint = extended)
    const indexExtended = indexTip.y < keypoints[6].y;
    const middleExtended = middleTip.y < keypoints[10].y;
    const ringExtended = ringTip.y < keypoints[14].y;
    const pinkyExtended = pinkyTip.y < keypoints[18].y;
    
    // Thumb extended upward: thumb tip is significantly above thumb IP joint
    const thumbExtendedUp = thumbTip.y < thumbIP.y - 0.05;
    // Thumb extended downward: thumb tip is significantly below thumb IP joint
    const thumbExtendedDown = thumbTip.y > thumbIP.y + 0.05;
    // Thumb extended outward: thumb tip is to the right of thumb MCP (for right hand)
    const thumbExtendedOut = thumbTip.x > thumbMCP.x;

    // Thumb_Up: Thumb extended upward, other fingers closed
    if (thumbExtendedUp && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const thumbUpHeight = thumbIP.y - thumbTip.y; // Positive when thumb is up
      const intensity = Math.min(1.0, Math.max(0.5, thumbUpHeight * 5.0));
      return { gesture: 'Thumb_Up', intensity };
    }

    // Thumb_Down: Thumb extended downward, other fingers closed
    if (thumbExtendedDown && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const thumbDownHeight = thumbTip.y - thumbIP.y; // Positive when thumb is down
      const intensity = Math.min(1.0, Math.max(0.5, thumbDownHeight * 5.0));
      return { gesture: 'Thumb_Down', intensity };
    }

    // Victory: Index and middle finger extended (V shape), others closed
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      // Check that index and middle are spread apart (V shape)
      const indexMiddleDist = Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) + Math.pow(indexTip.y - middleTip.y, 2)
      );
      if (indexMiddleDist > 0.05) { // Fingers are spread
        const intensity = Math.min(1.0, Math.max(0.6, indexMiddleDist * 8.0));
        return { gesture: 'Victory', intensity };
      }
    }

    // ILoveYou: Index + pinky extended, middle + ring closed, thumb extended outward
    if (indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtendedOut) {
      // Check that index and pinky are spread apart
      const indexPinkyDist = Math.sqrt(
        Math.pow(indexTip.x - pinkyTip.x, 2) + Math.pow(indexTip.y - pinkyTip.y, 2)
      );
      if (indexPinkyDist > 0.08) { // Fingers are spread
        const intensity = Math.min(1.0, Math.max(0.6, indexPinkyDist * 5.0));
        return { gesture: 'ILoveYou', intensity };
      }
    }

    return { gesture: undefined, intensity: 0 };
  }

  /**
   * Update gesture state with temporal tracking to reduce false positives
   * @param states - Array of gesture states (one per gesture type)
   * @param detectedGesture - Gesture detected in current frame
   * @param detectedIntensity - Intensity detected in current frame
   * @param timestamp - Current timestamp
   * @returns Smoothed gesture state
   */
  private updateGestureState(
    states: GestureState[],
    detectedGesture: 'Thumb_Up' | 'Thumb_Down' | 'Victory' | 'ILoveYou' | undefined,
    detectedIntensity: number,
    timestamp: number
  ): GestureState {
    // Find or create state for detected gesture
    let state = states.find(s => s.gesture === detectedGesture);
    
    if (detectedGesture && detectedIntensity > 0.1) {
      if (!state) {
        // New gesture detected
        state = {
          gesture: detectedGesture,
          intensity: detectedIntensity,
          confidence: 0,
          lastSeen: timestamp,
          frameCount: 1
        };
        states.push(state);
      } else {
        // Same gesture detected again - increase confidence
        state.frameCount++;
        state.lastSeen = timestamp;
        
        // Exponential smoothing for intensity
        state.intensity = state.intensity * this.INTENSITY_SMOOTHING + detectedIntensity * (1 - this.INTENSITY_SMOOTHING);
        
        // Calculate confidence based on consecutive frame count
        state.confidence = Math.min(1.0, state.frameCount / this.MIN_CONSECUTIVE_FRAMES);
      }
    }
    
    // Decay other gesture states (gestures not detected this frame)
    for (const s of states) {
      if (s !== state) {
        const timeSinceLastSeen = timestamp - s.lastSeen;
        if (timeSinceLastSeen > this.GESTURE_TIMEOUT_MS) {
          // Gesture expired, reset it
          s.frameCount = 0;
          s.confidence = 0;
          s.intensity = 0;
          s.gesture = undefined;
        } else {
          // Decay confidence and intensity
          s.confidence *= 0.8; // Decay confidence
          s.intensity *= 0.9; // Decay intensity
          s.frameCount = Math.max(0, s.frameCount - 1);
        }
      }
    }
    
    // Return the most confident gesture state
    const bestState = states.reduce((best, current) => 
      current.confidence > (best?.confidence ?? 0) ? current : best,
      undefined as GestureState | undefined
    );
    
    return bestState ?? {
      gesture: undefined,
      intensity: 0,
      confidence: 0,
      lastSeen: timestamp,
      frameCount: 0
    };
  }

  /**
   * Decay gesture state when hand is no longer detected
   */
  private decayGestureState(states: GestureState[], timestamp: number): void {
    for (const state of states) {
      const timeSinceLastSeen = timestamp - state.lastSeen;
      if (timeSinceLastSeen > this.GESTURE_TIMEOUT_MS) {
        // Reset expired gestures
        state.frameCount = 0;
        state.confidence = 0;
        state.intensity = 0;
        state.gesture = undefined;
      } else {
        // Decay confidence and intensity
        state.confidence *= 0.7;
        state.intensity *= 0.8;
        state.frameCount = Math.max(0, state.frameCount - 1);
      }
    }
  }

  /**
   * Process a frame for face/hand detection
   * @param imageData - ImageData from camera frame
   * @returns GestureData with detected faces and hands, or null if processing skipped/failed
   */
  async processFrame(imageData: ImageData): Promise<GestureData | null> {
    if (!this.enabled || this.processing || !this.initialized) return null;
    
    // Throttle: process every Nth frame
    this.frameCount++;
    if (this.frameCount % this.frameSkip !== 0) return null;

    this.processing = true;
    
    // Suppress MediaPipe's NORM_RECT warning during detection
    // The warning format: "W0204 18:09:22.243000 ... landmark_projection_calculator.cc:81] Using NORM_RECT without IMAGE_DIMENSIONS..."
    const originalWarn = console.warn;
    const mediaPipeWarningFilter = (message: any, ...args: any[]) => {
      const messageStr = String(message);
      if (messageStr.includes('NORM_RECT without IMAGE_DIMENSIONS') || 
          messageStr.includes('landmark_projection_calculator')) {
        // Suppress this specific MediaPipe warning - ImageData dimensions are automatically detected
        return;
      }
      originalWarn.call(console, message, ...args);
    };
    console.warn = mediaPipeWarningFilter;
    
    try {
      const faces: FaceLandmarks[] = [];
      const hands: HandLandmarks[] = [];

      // Process face detection using MediaPipe Solutions API
      if (this.faceDetector) {
        try {
          const faceResult = this.faceDetector.detect(imageData);
          if (faceResult && faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
            const faceData = this.extractFaceLandmarksSolutions(faceResult);
            if (faceData) {
              faces.push(faceData);
            }
          }
        } catch (error) {
          console.warn('GestureTracker: Face detection error:', error);
        }
      }

      // Process hand detection using MediaPipe Solutions API
      if (this.handDetector) {
        try {
          const handResult = this.handDetector.detect(imageData);
          const now = performance.now();
          
          if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
            // MediaPipe Solutions API provides handednesses array matching landmarks array
            const handednesses = handResult.handednesses || [];
            
            for (let i = 0; i < handResult.landmarks.length; i++) {
              const hand = handResult.landmarks[i];
              const handedness = handednesses[i]; // Get corresponding handedness
              const handData = this.extractHandLandmarksSolutions(hand, handedness);
              if (handData) {
                // Get or create gesture state for this hand
                let gestureStates = this.gestureHistory.get(i);
                if (!gestureStates) {
                  gestureStates = [];
                  this.gestureHistory.set(i, gestureStates);
                }
                
                // Update gesture state with temporal tracking
                const smoothedHandData = this.updateGestureState(
                  gestureStates,
                  handData.gesture,
                  handData.gestureIntensity ?? 0,
                  now
                );
                
                // Only include gesture if confidence is high enough
                if (smoothedHandData.confidence >= this.CONFIDENCE_THRESHOLD && smoothedHandData.gesture) {
                  handData.gesture = smoothedHandData.gesture;
                  handData.gestureIntensity = smoothedHandData.intensity;
                } else {
                  // Clear gesture if confidence too low
                  handData.gesture = undefined;
                  handData.gestureIntensity = 0;
                }
                
                hands.push(handData);
              }
            }
            
            // Clean up old gesture states (remove hands that are no longer detected)
            const detectedHandIndices = new Set(Array.from({ length: handResult.landmarks.length }, (_, i) => i));
            for (const [handIndex, states] of this.gestureHistory.entries()) {
              if (!detectedHandIndices.has(handIndex)) {
                // Hand no longer detected, decay its gesture state
                this.decayGestureState(states, now);
              }
            }
          } else {
            // No hands detected, decay all gesture states
            const now = performance.now();
            for (const states of this.gestureHistory.values()) {
              this.decayGestureState(states, now);
            }
          }
        } catch (error) {
          console.warn('GestureTracker: Hand detection error:', error);
        }
      }

      const gestureData: GestureData = {
        faces,
        hands,
        timestamp: performance.now()
      };

      this.processing = false;
      // Restore original console.warn
      console.warn = originalWarn;
      return gestureData;
    } catch (error) {
      console.error('GestureTracker: Error processing frame:', error);
      this.processing = false;
      // Restore original console.warn
      console.warn = originalWarn;
      return null;
    }
  }

  /**
   * Enable or disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled && this.initialized;
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.initialized;
  }

  /**
   * Set frame skip rate (process every Nth frame)
   */
  setFrameSkip(skip: number): void {
    this.frameSkip = Math.max(1, skip);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.enabled = false;
    this.processing = false;
    this.gestureHistory.clear();
    
    if (this.faceDetector) {
      try {
        this.faceDetector.close();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.faceDetector = null;
    }
    
    if (this.handDetector) {
      try {
        this.handDetector.close();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.handDetector = null;
    }
    
    this.initialized = false;
  }
}
