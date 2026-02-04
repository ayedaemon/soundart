import { BaseSensor } from './BaseSensor';
import { AudioEngine } from '$lib/engine/AudioEngine';
import { AudioAnalyzer } from '$lib/engine/AudioAnalyzer';
import type { AudioMetrics } from '$lib/types';
import { audioMetrics, audioSettings, micEnabled } from '$lib/stores/audio';

export interface AudioSensorData extends AudioMetrics {
  timestamp: number;
}

export interface AudioSensorSettings {
  fftSize: number;
  enabled: boolean;
}

const defaultSettings: AudioSensorSettings = {
  fftSize: 2048,
  enabled: false
};

/**
 * Audio sensor wrapping AudioEngine
 * Provides audio analysis data through the sensor interface
 */
export class AudioSensor extends BaseSensor<AudioSensorData, AudioSensorSettings> {
  private audioEngine: AudioEngine | null = null;
  private analyzer: AudioAnalyzer | null = null;
  private lastUpdateTime = 0;
  private animationFrameId: number | null = null;

  constructor() {
    super('audio', defaultSettings);
    
    // Sync settings from audio store
    audioSettings.subscribe(settings => {
      // Map audio settings to sensor settings if needed
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.audioEngine = new AudioEngine();
    this.initialized = true;
  }

  async enable(): Promise<void> {
    await super.enable();
    
    if (!this.audioEngine) {
      await this.initialize();
    }
    
    const settings = this.getSettingsStore();
    let currentSettings: AudioSensorSettings;
    settings.subscribe(s => currentSettings = s)();
    
    const enabled = await this.audioEngine!.enable(currentSettings!.fftSize);
    if (enabled) {
      micEnabled.set(true);
      this.startUpdateLoop();
    }
  }

  disable(): void {
    super.disable();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.audioEngine) {
      this.audioEngine.disable();
      micEnabled.set(false);
    }
  }

  async process(frame: any): Promise<AudioSensorData | null> {
    if (!this.audioEngine || !this.enabled) {
      return null;
    }

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const metrics = this.audioEngine.update(deltaTime);
    
    // Update audio store
    audioMetrics.set(metrics);
    
    return {
      ...metrics,
      timestamp: now
    };
  }

  dispose(): void {
    this.disable();
    if (this.audioEngine) {
      this.audioEngine.disable();
      this.audioEngine = null;
    }
    super.dispose();
  }

  /**
   * Get the shared audio buffer for zero-copy worker access
   */
  getSharedBuffer(): SharedArrayBuffer | null {
    return this.audioEngine?.getSharedBuffer() ?? null;
  }

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    const update = () => {
      if (this.enabled) {
        this.process(null);
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    this.lastUpdateTime = performance.now();
    this.animationFrameId = requestAnimationFrame(update);
  }
}
