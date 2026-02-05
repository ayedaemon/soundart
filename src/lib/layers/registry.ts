import type { LayerDefinition, LayerParameter } from '$lib/core/types/layer';

// Helper to create parameters with less boilerplate
const createFloat = (id: string, label: string, def: number, min: number, max: number, uniform: string, step = 0.01, randomizable = true, randomMin?: number, randomMax?: number): LayerParameter => ({
  id,
  label,
  type: 'float',
  default: def,
  min,
  max,
  step,
  uniform,
  randomizable,
  randomMin,
  randomMax
});

const createInt = (id: string, label: string, def: number, min: number, max: number, uniform: string, step = 1, randomizable = true, randomMin?: number, randomMax?: number): LayerParameter => ({
  id,
  label,
  type: 'int',
  default: def,
  min,
  max,
  step,
  uniform,
  randomizable,
  randomMin,
  randomMax
});

const createSelect = (id: string, label: string, def: number, options: {value: number, label: string}[], uniform: string, randomizable = true): LayerParameter => ({
  id,
  label,
  type: 'select',
  default: def,
  options,
  uniform,
  randomizable
});

// Standard parameters factory
// Creates the common set of parameters (Intensity, Speed, Zoom, Theme) used by all layers
const createStandardParams = (layerId: string, layerName: string) => {
  const prefix = `uLayer${layerId.charAt(0).toUpperCase() + layerId.slice(1)}`;
  return [
    createFloat('intensity', 'Intensity', 0.5, 0, 1, `${prefix}`),
    createFloat('speed', 'Speed', 1.0, 0, 3, `${prefix}Speed`),
    createFloat('zoom', 'Zoom', 1.0, 0.5, 2, `${prefix}Zoom`),
    createSelect('theme', 'Theme', 0, [], `${prefix}Theme`) // Themes to be populated dynamically or later
  ];
};

// Layer definitions registry
// Defines all available visual layers, their properties, and shader paths.
// This registry is used to generate the UI, configure the randomizer, and set up WebGL uniforms.
export const layerDefinitions: LayerDefinition[] = [
  // --- A. Geometric & Symmetry ---
  {
    id: 'mandala',
    label: 'Mandala',
    description: 'Radial symmetries',
    properties: [
      ...createStandardParams('mandala', 'Mandala'),
      createInt('segments', 'Segments', 6, 4, 32, 'uLayerMandalaSegments'),
      createFloat('rotation', 'Rotation', 0.2, -1, 1, 'uLayerMandalaRotation'),
      {
        id: 'symmetry',
        label: 'Symmetry',
        type: 'boolean',
        default: true,
        uniform: 'uLayerMandalaSymmetry',
        randomizable: true,
        ui: {
          shortLabel: 'Sym',
          tooltip: 'Toggle mirrored symmetry on/off'
        }
      }
    ],
    shaderPath: 'layers/mandala.glsl',
    randomizable: true
  },
  {
    id: 'kaleidoscope',
    label: 'Kaleidoscope',
    description: 'Sacred geometry mirroring',
    properties: [
      ...createStandardParams('kaleidoscope', 'Kaleidoscope'),
      createInt('slices', 'Slices', 6, 6, 24, 'uLayerKaleidoscopeSlices'),
      createFloat('feedback', 'Feedback', 0.5, 0, 0.95, 'uLayerKaleidoscopeFeedback'),
      createFloat('distortion', 'Distortion', 0.5, 0, 2, 'uLayerKaleidoscopeDistortion'),
      createFloat('raymarchMode', '3D Mode', 0.0, 0.0, 1.0, 'uLayerKaleidoscopeRaymarchMode', 0.05, true, 0.0, 0.7)
    ],
    shaderPath: 'layers/kaleidoscope.glsl',
    randomizable: true
  },
  {
    id: 'metatron',
    label: "Metatron's Cube",
    description: 'Sacred geometry with nested rings',
    properties: [
      ...createStandardParams('metatron', 'Metatron'),
      createInt('rings', 'Rings', 2, 1, 10, 'uLayerMetatronRings'),
      createFloat('thickness', 'Thickness', 0.008, 0.001, 0.02, 'uLayerMetatronThickness', 0.001, true, 0.003, 0.015),
      createFloat('spin', 'Spin', 0.5, -2, 2, 'uLayerMetatronSpin')
    ],
    shaderPath: 'layers/metatron.glsl',
    randomizable: true
  },
  {
    id: 'lissajous',
    label: 'Lissajous',
    description: 'Symmetric line trails',
    properties: [
      ...createStandardParams('lissajous', 'Lissajous'),
      {
        id: 'frequencies',
        label: 'Complexity',
        type: 'float',
        default: 3.0,
        min: 1.0,
        max: 10.0,
        step: 0.1,
        uniform: 'uLayerLissajousFrequencies',
        randomizable: true,
        randomMin: 2.0,
        randomMax: 8.0,
        ui: {
          shortLabel: 'Cplx',
          tooltip: 'Curve frequency ratio / knot complexity'
        }
      },
      {
        id: 'slices',
        label: 'Symmetry',
        type: 'int',
        default: 8,
        min: 3,
        max: 24,
        step: 1,
        uniform: 'uLayerLissajousSlices',
        randomizable: true,
        randomMin: 4,
        randomMax: 16,
        ui: {
          shortLabel: 'Sym',
          tooltip: 'Kaleidoscope slices (higher = more symmetry)'
        }
      },
      {
        id: 'damping',
        label: 'Trail Decay',
        type: 'float',
        default: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        uniform: 'uLayerLissajousDamping',
        randomizable: true,
        randomMin: 0.0,
        randomMax: 0.8,
        ui: {
          shortLabel: 'Decy',
          tooltip: 'Higher = shorter trail'
        }
      },
      {
        id: 'thickness',
        label: 'Line Width',
        type: 'float',
        default: 0.008,
        min: 0.001,
        max: 0.02,
        step: 0.001,
        uniform: 'uLayerLissajousThickness',
        randomizable: true,
        randomMin: 0.003,
        randomMax: 0.012,
        ui: {
          shortLabel: 'Line',
          tooltip: 'Line thickness'
        }
      }
    ],
    shaderPath: 'layers/lissajous.glsl',
    randomizable: true
  },
  {
    id: 'cymatics',
    label: 'Cymatics',
    description: 'Standing-wave nodal line patterns',
    properties: [
      ...createStandardParams('cymatics', 'Cymatics'),
      {
        id: 'mode',
        label: 'Pattern Style',
        type: 'select',
        default: 0,
        options: [
          { value: 0, label: 'Plate' },
          { value: 1, label: 'Radial' },
          { value: 2, label: 'Hybrid' }
        ],
        uniform: 'uLayerCymaticsMode',
        randomizable: true,
        ui: {
          shortLabel: 'Style',
          tooltip: 'Plate = grid-like patterns, Radial = circular patterns, Hybrid = mix of both'
        }
      },
      {
        id: 'm',
        label: 'Pattern Detail',
        type: 'int',
        default: 5,
        min: 1,
        max: 16,
        step: 1,
        uniform: 'uLayerCymaticsM',
        randomizable: true,
        randomMin: 2,
        randomMax: 12,
        ui: {
          shortLabel: 'Detail',
          tooltip: 'Higher = more intricate pattern with more lines'
        }
      },
      {
        id: 'n',
        label: 'Pattern Complexity',
        type: 'int',
        default: 8,
        min: 1,
        max: 16,
        step: 1,
        uniform: 'uLayerCymaticsN',
        randomizable: true,
        randomMin: 3,
        randomMax: 16,
        ui: {
          shortLabel: 'Cplx',
          tooltip: 'Higher = more complex wave patterns'
        }
      },
      {
        id: 'thickness',
        label: 'Line Width',
        type: 'float',
        default: 0.06,
        min: 0.005,
        max: 0.20,
        step: 0.001,
        uniform: 'uLayerCymaticsThickness',
        randomizable: true,
        randomMin: 0.02,
        randomMax: 0.12,
        ui: {
          shortLabel: 'Width',
          tooltip: 'Thickness of the pattern lines (thinner = more delicate)'
        }
      },
      {
        id: 'sharpness',
        label: 'Line Sharpness',
        type: 'float',
        default: 1.4,
        min: 0.35,
        max: 4.0,
        step: 0.05,
        uniform: 'uLayerCymaticsSharpness',
        randomizable: true,
        randomMin: 0.7,
        randomMax: 2.6,
        ui: {
          shortLabel: 'Sharp',
          tooltip: 'Higher = crisper, more defined lines (lower = softer, more blurred)'
        }
      },
      {
        id: 'warp',
        label: 'Flow Distortion',
        type: 'float',
        default: 0.35,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        uniform: 'uLayerCymaticsWarp',
        randomizable: true,
        randomMin: 0.0,
        randomMax: 0.85,
        ui: {
          shortLabel: 'Flow',
          tooltip: 'Adds flowing, wavy distortion to the pattern (0 = straight lines, higher = more movement)'
        }
      }
    ],
    shaderPath: 'layers/cymatics.glsl',
    randomizable: true
  },

  // --- B. Organic & Noise ---
  {
    id: 'turbulence',
    label: 'Turbulence',
    description: 'Audio-reactive turbulence',
    properties: [
      ...createStandardParams('turbulence', 'Turbulence'),
      createInt('complexity', 'Complexity', 3, 1, 6, 'uLayerTurbulenceComplexity'),
      createFloat('flow', 'Flow', 0.5, -1.0, 1.0, 'uLayerTurbulenceFlow')
    ],
    shaderPath: 'layers/turbulence.glsl',
    randomizable: true
  },
  {
    id: 'displacement',
    label: 'Displacement',
    description: 'Cellular displacement waves',
    properties: [
      ...createStandardParams('displacement', 'Displacement'),
      createFloat('strength', 'Strength', 0.5, 0.0, 2.0, 'uLayerDisplacementStrength'),
      createFloat('cellSize', 'Cell Size', 1.0, 0.1, 5.0, 'uLayerDisplacementCellSize'),
      createFloat('ripple', 'Ripple', 1.0, 0.0, 3.0, 'uLayerDisplacementRipple')
    ],
    shaderPath: 'layers/displacement.glsl',
    randomizable: true
  },
  {
    id: 'glow',
    label: 'Center Glow',
    description: 'Pulsing core with arcs',
    properties: [
      ...createStandardParams('glow', 'Glow'),
      createFloat('coreSize', 'Core Size', 0.5, 0.1, 2.0, 'uLayerGlowCoreSize'),
      createInt('ringCount', 'Ring Count', 3, 0, 10, 'uLayerGlowRingCount'),
      createFloat('arcIntensity', 'Arc Intensity', 0.5, 0.0, 10.0, 'uLayerGlowArcIntensity')
    ],
    shaderPath: 'layers/glow.glsl',
    randomizable: true
  },

  // --- C. 3D & Space ---
  {
    id: 'starfield',
    label: 'Starfield',
    description: 'Warp tunnel streaks',
    properties: [
      ...createStandardParams('starfield', 'Starfield'),
      createFloat('density', 'Density', 1.0, 0.1, 3.0, 'uLayerStarfieldDensity'),
      createFloat('warp', 'Warp', 1.0, 0.1, 5.0, 'uLayerStarfieldWarp'),
      createInt('layers', 'Layers', 4, 1, 8, 'uLayerStarfieldLayers')
    ],
    shaderPath: 'layers/starfield.glsl',
    randomizable: true
  },
  {
    id: 'hopalong',
    label: 'Hopalong Orbits',
    description: 'Barry Martin attractor with kaleidoscope splits',
    properties: [
      ...createStandardParams('hopalong', 'Hopalong'),
      createFloat('divergence', 'Divergence', 1.0, 0.1, 5.0, 'uLayerHopalongDivergence'),
      createInt('iterations', 'Iterations', 5, 1, 10, 'uLayerHopalongIterations'),
      createInt('slices', 'Slices', 1, 1, 16, 'uLayerHopalongSlices', 1, true, 1, 12),
      createFloat('rotation', 'Rotation', 0.0, -1.0, 1.0, 'uLayerHopalongRotation', 0.01, true, -0.5, 0.5)
    ],
    shaderPath: 'layers/hopalong.glsl',
    randomizable: true
  },
  {
    id: 'fractal',
    label: 'Fractal Pattern',
    description: 'Fractal patterns with palette-based coloring',
    properties: [
      ...createStandardParams('fractal', 'Fractal'),
      createFloat('iterations', 'Iterations', 3.5, 1.0, 5.0, 'uLayerFractalIterations', 0.1, true, 2.0, 4.5),
      createFloat('scale', 'Scale', 1.0, 0.1, 4.0, 'uLayerFractalScale', 0.05, true, 0.3, 1.5),
      createFloat('power', 'Power', 1.2, 0.5, 2.5, 'uLayerFractalPower', 0.05, true, 0.8, 1.8)
    ],
    shaderPath: 'layers/fractal.glsl',
    randomizable: true
  },

];

// Get layer definition by ID
export function getLayerDefinition(id: string): LayerDefinition | undefined {
  return layerDefinitions.find(layer => layer.id === id);
}

// Get all layer IDs
export function getLayerIds(): string[] {
  return layerDefinitions.map(layer => layer.id);
}
