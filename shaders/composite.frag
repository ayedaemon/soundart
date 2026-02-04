#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uBeat;
uniform float uEnergy;
uniform float uTreble;

// Mouse uniforms
uniform vec2 uMouse;           // Normalized position (0-1)
uniform vec2 uMouseVelocity;   // Movement velocity
uniform float uMouseSpeed;     // Velocity magnitude
uniform float uMouseDown;      // Button pressed (0 or 1)
uniform vec2 uMouseClick;      // Last click position

// --- Layer Uniforms ---

// Lissajous
uniform float uLayerLissajous;
uniform float uLayerLissajousSpeed;
uniform float uLayerLissajousZoom;
uniform float uLayerLissajousTheme;
uniform float uLayerLissajousFrequencies;
uniform float uLayerLissajousSlices;
uniform float uLayerLissajousDamping;
uniform float uLayerLissajousThickness;

// Mandala
uniform float uLayerMandala;
uniform float uLayerMandalaSpeed;
uniform float uLayerMandalaZoom;
uniform float uLayerMandalaTheme;
uniform float uLayerMandalaSegments;
uniform float uLayerMandalaRotation;
uniform float uLayerMandalaSymmetry;

// Kaleidoscope
uniform float uLayerKaleidoscope;
uniform float uLayerKaleidoscopeSpeed;
uniform float uLayerKaleidoscopeZoom;
uniform float uLayerKaleidoscopeTheme;
uniform float uLayerKaleidoscopeSlices;
uniform float uLayerKaleidoscopeFeedback;
uniform float uLayerKaleidoscopeDistortion;

// Metatron
uniform float uLayerMetatron;
uniform float uLayerMetatronSpeed;
uniform float uLayerMetatronZoom;
uniform float uLayerMetatronTheme;
uniform float uLayerMetatronRings;
uniform float uLayerMetatronThickness;
uniform float uLayerMetatronSpin;

// Glow
uniform float uLayerGlow;
uniform float uLayerGlowSpeed;
uniform float uLayerGlowZoom;
uniform float uLayerGlowTheme;
uniform float uLayerGlowCoreSize;
uniform float uLayerGlowRingCount;
uniform float uLayerGlowArcIntensity;

// Starfield
uniform float uLayerStarfield;
uniform float uLayerStarfieldSpeed;
uniform float uLayerStarfieldZoom;
uniform float uLayerStarfieldTheme;
uniform float uLayerStarfieldDensity;
uniform float uLayerStarfieldWarp;
uniform float uLayerStarfieldLayers;

// Turbulence
uniform float uLayerTurbulence;
uniform float uLayerTurbulenceSpeed;
uniform float uLayerTurbulenceZoom;
uniform float uLayerTurbulenceTheme;
uniform float uLayerTurbulenceComplexity;
uniform float uLayerTurbulenceFlow;

// Displacement
uniform float uLayerDisplacement;
uniform float uLayerDisplacementSpeed;
uniform float uLayerDisplacementZoom;
uniform float uLayerDisplacementTheme;
uniform float uLayerDisplacementStrength;
uniform float uLayerDisplacementCellSize;
uniform float uLayerDisplacementRipple;

// Hopalong
uniform float uLayerHopalong;
uniform float uLayerHopalongSpeed;
uniform float uLayerHopalongZoom;
uniform float uLayerHopalongTheme;
uniform float uLayerHopalongDivergence;
uniform float uLayerHopalongIterations;
uniform float uLayerHopalongSlices;
uniform float uLayerHopalongRotation;


uniform sampler2D uFeedbackTex;
uniform float uFeedbackReady;

varying vec2 vUv;

#include "common/constants.glsl"
#include "common/colors.glsl"
#include "common/hash.glsl"

#include "layers/lissajous.glsl"
#include "layers/mandala.glsl"
#include "layers/kaleidoscope.glsl"
#include "layers/metatron.glsl"
#include "layers/glow.glsl"
#include "layers/starfield.glsl"
#include "layers/turbulence.glsl"
#include "layers/displacement.glsl"
#include "layers/hopalong.glsl"


void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);
    
    // Convert mouse position to same UV space as layers
    vec2 mouseUV = uMouse * 2.0 - 1.0;
    mouseUV.x *= uResolution.x / max(uResolution.y, 1.0);

    vec3 finalColor = vec3(0.0);

    // --- Geometric & Symmetry ---

    if (uLayerMandala > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerMandalaZoom);
        vec3 layer = layerMandala(uvL, uTime * uLayerMandalaSpeed, uBeat, uEnergy, uLayerMandala, uLayerMandalaTheme, uLayerMandalaSegments, uLayerMandalaRotation, uLayerMandalaSymmetry);
        finalColor += layer;
    }

    if (uLayerKaleidoscope > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerKaleidoscopeZoom);
        vec3 layer = layerKaleidoscope(uvL, uTime * uLayerKaleidoscopeSpeed, uTreble, uLayerKaleidoscope, uLayerKaleidoscopeTheme, uLayerKaleidoscopeSlices, uLayerKaleidoscopeFeedback, uLayerKaleidoscopeDistortion, uFeedbackTex);
        finalColor += layer;
    }

    if (uLayerMetatron > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerMetatronZoom);
        vec3 layer = layerMetatron(uvL, uTime * uLayerMetatronSpeed, uBeat, uEnergy, uLayerMetatron, uLayerMetatronTheme, uLayerMetatronRings, uLayerMetatronThickness, uLayerMetatronSpin);
        finalColor += layer;
    }

    if (uLayerLissajous > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerLissajousZoom);
        vec3 layer = layerLissajous(uvL, uTime, uEnergy, uLayerLissajous, uLayerLissajousTheme, uLayerLissajousSpeed, uLayerLissajousFrequencies, uLayerLissajousSlices, uLayerLissajousDamping, uLayerLissajousThickness);
        finalColor += layer;
    }

    // --- Organic & Noise ---

    if (uLayerTurbulence > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerTurbulenceZoom);
        vec3 layer = layerTurbulence(uvL, uTime * uLayerTurbulenceSpeed, uBeat, uEnergy, uTreble, uLayerTurbulence, uLayerTurbulenceTheme, uLayerTurbulenceComplexity, uLayerTurbulenceFlow);
        finalColor += layer;
    }

    if (uLayerDisplacement > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerDisplacementZoom);
        vec3 layer = layerDisplacement(uvL, uTime * uLayerDisplacementSpeed, uBeat, uEnergy, uTreble, uLayerDisplacement, uLayerDisplacementTheme, uLayerDisplacementStrength, uLayerDisplacementCellSize, uLayerDisplacementRipple);
        finalColor += layer;
    }

    if (uLayerGlow > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerGlowZoom);
        vec3 layer = layerGlow(uvL, uTime * uLayerGlowSpeed, uBeat, uEnergy, uTreble, uLayerGlow, uLayerGlowTheme, uLayerGlowCoreSize, uLayerGlowRingCount, uLayerGlowArcIntensity);
        finalColor += layer;
    }

    // --- 3D & Space ---

    if (uLayerStarfield > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerStarfieldZoom);
        vec3 layer = layerStarfield(uvL, uTime * uLayerStarfieldSpeed, uBeat, uEnergy, uTreble, uLayerStarfield, uLayerStarfieldTheme, uLayerStarfieldDensity, uLayerStarfieldWarp, uLayerStarfieldLayers);
        finalColor += layer;
    }

    if (uLayerHopalong > 0.001) {
        vec2 uvL = uv / max(0.001, uLayerHopalongZoom);
        vec3 layer = layerHopalong(uvL, uTime * uLayerHopalongSpeed, uBeat, uEnergy, uTreble, uLayerHopalong, uLayerHopalongTheme, uLayerHopalongDivergence, uLayerHopalongIterations, uLayerHopalongSlices, uLayerHopalongRotation);
        finalColor += layer;
    }

    // Tone mapping / Saturation control could go here
    vec3 color = finalColor / (vec3(1.0) + finalColor);
    gl_FragColor = vec4(color, 1.0);
}
