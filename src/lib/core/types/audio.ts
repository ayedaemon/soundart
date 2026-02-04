// Audio Feature Definitions
export type AudioFeature = 
  | 'energy' 
  | 'treble' 
  | 'bass' 
  | 'mids' 
  | 'highs' 
  | 'lows' 
  | 'beat';

export interface AudioAnalysisData {
  features: Record<AudioFeature, number>;
  frequencyData: Float32Array;
  timeDomainData: Float32Array;
}

// Shared Buffer Layout
// [0]: energy
// [1]: treble
// [2]: bass
// [3]: mids
// [4]: highs
// [5]: lows
// [6]: beat
// [7...N]: frequency data
export const AUDIO_BUFFER_HEADER_SIZE = 8;
export const AUDIO_FEATURE_INDICES: Record<AudioFeature, number> = {
  energy: 0,
  treble: 1,
  bass: 2,
  mids: 3,
  highs: 4,
  lows: 5,
  beat: 6
};
