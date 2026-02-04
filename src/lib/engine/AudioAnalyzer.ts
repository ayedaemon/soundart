import { AUDIO_BUFFER_HEADER_SIZE, AUDIO_FEATURE_INDICES } from '$lib/core/types/audio';
import type { AudioMetrics } from '$lib/types';

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp helper
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Core audio analysis engine.
 * Handles microphone input, FFT analysis, frequency band splitting,
 * and beat detection logic.
 */
export class AudioAnalyzer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private freqData: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  
  // Shared Buffer for zero-copy transfer to the render worker
  private sharedBuffer: SharedArrayBuffer | null = null;
  private sharedFloatView: Float32Array | null = null;
  
  // Smoothed audio metrics
  private energy: number = 0;
  private treble: number = 0;
  private highs: number = 0;
  private mids: number = 0;
  private lows: number = 0;
  private bass: number = 0;
  
  // Beat detection state
  private beatValue: number = 0;
  private beatCutoff: number = 0;
  private beatHold: number = 0;
  
  // Configuration constants
  private readonly smoothing: number = 0.3;
  private readonly beatFalloff: number = 2.4;
  private readonly beatMin: number = 0.15;
  private readonly beatDecay: number = 0.98;
  private readonly beatHoldTime: number = 0.08;
  
  /**
   * Initialize audio context and analyzer.
   * @param fftSize - FFT size for frequency analysis (default: 2048)
   * @returns SharedArrayBuffer if supported, null otherwise
   */
  async init(fftSize: number = 2048): Promise<SharedArrayBuffer | null> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      // Cross-browser AudioContext support
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      this.source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      this.source.connect(this.analyser);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Initialize SharedArrayBuffer if supported and allowed
      // We check for crossOriginIsolated because SharedArrayBuffer requires specific headers
      // Also check if SharedArrayBuffer is defined to avoid ReferenceError in non-supporting envs
      let hasSharedBuffer = false;
      try {
        // Check for cross-origin isolation required for SharedArrayBuffer
        hasSharedBuffer = typeof window !== 'undefined' && 
                          window.crossOriginIsolated && 
                          typeof window['SharedArrayBuffer'] !== 'undefined';
      } catch (e) {
        // Ignore errors checking for SharedArrayBuffer
      }

      
      // Set up shared memory for zero-copy data transfer to the worker
      if (hasSharedBuffer) {
        try {
          // Calculate buffer size: header (metrics) + frequency data
          const bufferSize = (AUDIO_BUFFER_HEADER_SIZE + this.analyser.frequencyBinCount) * 4;
          
          const SAB = window['SharedArrayBuffer'] as typeof SharedArrayBuffer;
          this.sharedBuffer = new SAB(bufferSize);
          this.sharedFloatView = new Float32Array(this.sharedBuffer);
          
          return this.sharedBuffer;
        } catch (e) {
          console.error('[AudioAnalyzer] Failed to create SharedArrayBuffer despite checks:', e);
          return null;
        }
      } else {
        console.warn('[AudioAnalyzer] SharedArrayBuffer not supported or not isolated, falling back to message passing');
        return null;
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return null;
    }
  }
  
  dispose(): void {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.analyser = null;
    this.freqData = null;
    this.sharedBuffer = null;
    this.sharedFloatView = null;
  }
  
  /**
   * Process audio data for the current frame.
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime: number): AudioMetrics {
    if (!this.analyser || !this.freqData) {
      return this.getEmptyMetrics();
    }
    
    this.analyser.getByteFrequencyData(this.freqData);
    
    const totalBins = this.freqData.length;
    const sampleRate = this.context?.sampleRate || 44100;
    const binHz = sampleRate / this.analyser.fftSize;
    
    // Frequency band boundaries (Hz)
    const bassEndHz = 120;
    const lowEndHz = 200;
    const midEndHz = 2000;
    const highEndHz = 6000;
    
    // Convert Hz to FFT bin indices
    const bassEnd = Math.max(2, Math.floor(bassEndHz / binHz));
    const lowEnd = Math.max(bassEnd + 1, Math.floor(lowEndHz / binHz));
    const midEnd = Math.max(lowEnd + 1, Math.floor(midEndHz / binHz));
    const highEnd = Math.max(midEnd + 1, Math.floor(highEndHz / binHz));
    
    const lowEndIdx = Math.min(totalBins - 1, lowEnd);
    const midEndIdx = Math.min(totalBins - 1, midEnd);
    const highEndIdx = Math.min(totalBins - 1, highEnd);
    
    // Calculate band totals
    let total = 0;
    let bassTotal = 0;
    let lowTotal = 0;
    let midTotal = 0;
    let highTotal = 0;
    let trebleTotal = 0;
    
    for (let i = 0; i < totalBins; i++) {
      const value = this.freqData[i];
      total += value;
      
      // Write normalized frequency data to shared buffer
      // Offset by header size to skip metrics area
      if (this.sharedFloatView) {
        this.sharedFloatView[AUDIO_BUFFER_HEADER_SIZE + i] = value / 255.0;
      }
      
      if (i < bassEnd) {
        bassTotal += value;
      }
      if (i < lowEndIdx) {
        lowTotal += value;
      } else if (i < midEndIdx) {
        midTotal += value;
      } else if (i < highEndIdx) {
        highTotal += value;
      } else {
        trebleTotal += value;
      }
    }
    
    // Normalize to 0-1 range
    const energy = total / (totalBins * 255);
    const bass = bassTotal / (Math.max(1, bassEnd) * 255);
    const lows = lowTotal / (Math.max(1, lowEndIdx) * 255);
    const mids = midTotal / (Math.max(1, midEndIdx - lowEndIdx) * 255);
    const highs = highTotal / (Math.max(1, highEndIdx - midEndIdx) * 255);
    const treble = trebleTotal / (Math.max(1, totalBins - highEndIdx) * 255);
    
    // Apply smoothing to prevent jitter
    this.energy = lerp(this.energy, energy, this.smoothing);
    this.treble = lerp(this.treble, treble, this.smoothing);
    this.highs = lerp(this.highs, highs, this.smoothing);
    this.mids = lerp(this.mids, mids, this.smoothing);
    this.lows = lerp(this.lows, lows, this.smoothing);
    this.bass = lerp(this.bass, bass, this.smoothing);
    
    // Beat detection logic
    // Detects sudden energy spikes in low frequencies
    const dt = Math.max(0, deltaTime);
    this.beatValue = Math.max(0, this.beatValue - dt * this.beatFalloff);
    
    if (lows > this.beatCutoff && lows > this.beatMin) {
      this.beatValue = clamp(lows * 1.5, 0, 1);
      this.beatCutoff = lows * 1.1;
      this.beatHold = this.beatHoldTime;
    }
    
    if (this.beatHold > 0) {
      this.beatHold -= dt;
    } else {
      this.beatCutoff = Math.max(this.beatMin, this.beatCutoff - dt * this.beatDecay);
    }
    
    // Write calculated metrics to shared buffer header
    if (this.sharedFloatView) {
      this.sharedFloatView[AUDIO_FEATURE_INDICES.energy] = this.energy;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.treble] = this.treble;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.bass] = this.bass;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.mids] = this.mids;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.highs] = this.highs;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.lows] = this.lows;
      this.sharedFloatView[AUDIO_FEATURE_INDICES.beat] = this.beatValue;
    }
    
    return {
      energy: this.energy,
      treble: this.treble,
      highs: this.highs,
      mids: this.mids,
      lows: this.lows,
      bass: this.bass,
      beat: this.beatValue
    };
  }
  
  private getEmptyMetrics(): AudioMetrics {
    return {
      energy: 0,
      treble: 0,
      highs: 0,
      mids: 0,
      lows: 0,
      bass: 0,
      beat: 0
    };
  }
  
  isInitialized(): boolean {
    return this.analyser !== null;
  }
}
