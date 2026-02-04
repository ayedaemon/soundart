import type { AudioMetrics } from '$lib/types';
import { AudioAnalyzer } from '$lib/engine/AudioAnalyzer';

const EMPTY_METRICS: AudioMetrics = {
  energy: 0,
  treble: 0,
  bass: 0,
  mids: 0,
  highs: 0,
  lows: 0,
  beat: 0
};

export class AudioEngine {
  private analyzer: AudioAnalyzer | null = null;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private enabled = false;

  async enable(fftSize: number = 2048): Promise<boolean> {
    if (!this.analyzer) {
      this.analyzer = new AudioAnalyzer();
    }
    if (this.analyzer.isInitialized()) {
      this.enabled = true;
      return true;
    }

    const buffer = await this.analyzer.init(fftSize);
    this.sharedBuffer = buffer ?? null;
    this.enabled = this.analyzer.isInitialized();
    return this.enabled;
  }

  disable(): void {
    if (this.analyzer) {
      this.analyzer.dispose();
      this.analyzer = null;
    }
    this.sharedBuffer = null;
    this.enabled = false;
  }

  update(deltaTime: number): AudioMetrics {
    if (!this.analyzer || !this.analyzer.isInitialized()) {
      return EMPTY_METRICS;
    }
    return this.analyzer.update(deltaTime);
  }

  getSharedBuffer(): SharedArrayBuffer | null {
    return this.sharedBuffer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  usesSharedBuffer(): boolean {
    return this.sharedBuffer !== null;
  }
}
