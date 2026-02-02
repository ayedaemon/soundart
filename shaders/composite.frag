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

uniform float uLayerFibonacci;
uniform float uLayerFibonacciZoom;
uniform float uLayerFibonacciPoints;
uniform float uLayerFibonacciSpeed;
uniform float uLayerFibonacciAngle;
uniform float uLayerFibonacciTheme;
uniform float uLayerFibonacciSensitivity;
uniform float uLayerFibonacciMouseSens;
uniform float uLayerFlower;
uniform float uLayerFlowerZoom;
uniform float uLayerFlowerTheme;
uniform float uLayerFlowerSensitivity;
uniform float uLayerFlowerMouseSens;
uniform float uLayerLissajous;
uniform float uLayerLissajousZoom;
uniform float uLayerLissajousTheme;
uniform float uLayerLissajousSensitivity;
uniform float uLayerLissajousMouseSens;
uniform float uLayerMandala;
uniform float uLayerMandalaZoom;
uniform float uLayerMandalaTheme;
uniform float uLayerMandalaSensitivity;
uniform float uLayerMandalaMouseSens;
uniform float uLayerKaleidoscope;
uniform float uLayerKaleidoscopeZoom;
uniform float uLayerKaleidoscopeTheme;
uniform float uLayerKaleidoscopeSensitivity;
uniform float uLayerKaleidoscopeMouseSens;
uniform float uLayerGlow;
uniform float uLayerGlowZoom;
uniform float uLayerGlowTheme;
uniform float uLayerGlowSensitivity;
uniform float uLayerGlowMouseSens;
uniform float uLayerStarfield;
uniform float uLayerStarfieldZoom;
uniform float uLayerStarfieldTheme;
uniform float uLayerStarfieldSensitivity;
uniform float uLayerStarfieldMouseSens;
uniform float uLayerTurbulence;
uniform float uLayerTurbulenceZoom;
uniform float uLayerTurbulenceTheme;
uniform float uLayerTurbulenceSensitivity;
uniform float uLayerTurbulenceMouseSens;
uniform float uLayerDisplacement;
uniform float uLayerDisplacementZoom;
uniform float uLayerDisplacementTheme;
uniform float uLayerDisplacementSensitivity;
uniform float uLayerDisplacementMouseSens;
uniform float uLayerCubescape;
uniform float uLayerCubescapeZoom;
uniform float uLayerCubescapeTheme;
uniform float uLayerCubescapeSensitivity;
uniform float uLayerCubescapeMouseSens;
uniform float uLayerSpires;
uniform float uLayerSpiresZoom;
uniform float uLayerSpiresTheme;
uniform float uLayerSpiresSensitivity;
uniform float uLayerSpiresMouseSens;
uniform float uLayerHopalong;
uniform float uLayerHopalongZoom;
uniform float uLayerHopalongTheme;
uniform float uLayerHopalongSensitivity;
uniform float uLayerHopalongMouseSens;
uniform float uLayerMetatron;
uniform float uLayerMetatronZoom;
uniform float uLayerMetatronRings;
uniform float uLayerMetatronTheme;
uniform float uLayerMetatronSensitivity;
uniform float uLayerMetatronMouseSens;
uniform sampler2D uReactionTex;
uniform sampler2D uFeedbackTex;
uniform float uFeedbackReady;

varying vec2 vUv;

#include "common/constants.glsl"
#include "common/colors.glsl"
#include "common/hash.glsl"

#include "layers/fibonacci.glsl"
#include "layers/flower.glsl"
#include "layers/lissajous.glsl"
#include "layers/mandala.glsl"
#include "layers/kaleidoscope.glsl"
#include "layers/glow.glsl"
#include "layers/starfield.glsl"
#include "layers/turbulence.glsl"
#include "layers/displacement.glsl"
#include "layers/cubescape.glsl"
#include "layers/spires.glsl"
#include "layers/hopalong.glsl"
#include "layers/metatron.glsl"

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);
    
    // Convert mouse position to same UV space as layers
    vec2 mouseUV = uMouse * 2.0 - 1.0;
    mouseUV.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 uvFibonacci = uv / max(0.001, uLayerFibonacciZoom);
    vec2 uvFlower = uv / max(0.001, uLayerFlowerZoom);
    vec2 uvLissajous = uv / max(0.001, uLayerLissajousZoom);
    vec2 uvMandala = uv / max(0.001, uLayerMandalaZoom);
    vec2 uvKaleidoscope = uv / max(0.001, uLayerKaleidoscopeZoom);
    vec2 uvGlow = uv / max(0.001, uLayerGlowZoom);
    vec2 uvStarfield = uv / max(0.001, uLayerStarfieldZoom);
    vec2 uvTurbulence = uv / max(0.001, uLayerTurbulenceZoom);
    vec2 uvDisplacement = uv / max(0.001, uLayerDisplacementZoom);
    vec2 uvCubescape = uv / max(0.001, uLayerCubescapeZoom);
    vec2 uvSpires = uv / max(0.001, uLayerSpiresZoom);
    vec2 uvHopalong = uv / max(0.001, uLayerHopalongZoom);
    vec2 uvMetatron = uv / max(0.001, uLayerMetatronZoom);

    vec3 baseColor = vec3(0.0);
    float beatFibonacci = uBeat * uLayerFibonacciSensitivity;
    float beatFlower = uBeat * uLayerFlowerSensitivity;
    float energyLissajous = uEnergy * uLayerLissajousSensitivity;
    float beatMandala = uBeat * uLayerMandalaSensitivity;
    float energyMandala = uEnergy * uLayerMandalaSensitivity;
    float trebleKaleidoscope = uTreble * uLayerKaleidoscopeSensitivity;
    float beatGlow = uBeat * uLayerGlowSensitivity;
    float trebleGlow = uTreble * uLayerGlowSensitivity;
    float beatStarfield = uBeat * uLayerStarfieldSensitivity;
    float beatTurbulence = uBeat * uLayerTurbulenceSensitivity;
    float energyTurbulence = uEnergy * uLayerTurbulenceSensitivity;
    float trebleTurbulence = uTreble * uLayerTurbulenceSensitivity;
    float beatDisplacement = uBeat * uLayerDisplacementSensitivity;
    float energyDisplacement = uEnergy * uLayerDisplacementSensitivity;
    float trebleDisplacement = uTreble * uLayerDisplacementSensitivity;
    float beatCubescape = uBeat * uLayerCubescapeSensitivity;
    float energyCubescape = uEnergy * uLayerCubescapeSensitivity;
    float beatSpires = uBeat * uLayerSpiresSensitivity;
    float energySpires = uEnergy * uLayerSpiresSensitivity;
    float trebleSpires = uTreble * uLayerSpiresSensitivity;
    float beatHopalong = uBeat * uLayerHopalongSensitivity;
    float energyHopalong = uEnergy * uLayerHopalongSensitivity;
    float beatMetatron = uBeat * uLayerMetatronSensitivity;
    float energyMetatron = uEnergy * uLayerMetatronSensitivity;

    baseColor += layerFibonacci(uvFibonacci, uTime, beatFibonacci, uLayerFibonacci, uLayerFibonacciPoints, uLayerFibonacciSpeed, uLayerFibonacciAngle, uLayerFibonacciTheme);
    baseColor += layerFlower(uvFlower, uTime, beatFlower, uLayerFlower, uLayerFlowerTheme);
    baseColor += layerLissajous(uvLissajous, uTime, energyLissajous, uLayerLissajous, uLayerLissajousTheme);
    baseColor += layerMandala(uvMandala, uTime, beatMandala, energyMandala, uLayerMandala, uLayerMandalaTheme);
    baseColor += layerKaleidoscope(
        uvKaleidoscope,
        uTime,
        trebleKaleidoscope,
        uLayerKaleidoscope,
        uLayerKaleidoscopeTheme
    );
    baseColor += layerGlow(uvGlow, uTime, beatGlow, trebleGlow, uLayerGlow, uLayerGlowTheme);
    baseColor += layerStarfield(uvStarfield, uTime, beatStarfield, uLayerStarfield, uLayerStarfieldTheme);
    baseColor += layerTurbulence(
        uvTurbulence,
        uTime,
        beatTurbulence,
        energyTurbulence,
        trebleTurbulence,
        uLayerTurbulence,
        uLayerTurbulenceTheme
    );
    baseColor += layerDisplacement(
        uvDisplacement,
        uTime,
        beatDisplacement,
        energyDisplacement,
        trebleDisplacement,
        uLayerDisplacement,
        uLayerDisplacementTheme
    );
    baseColor += layerCubescape(
        uvCubescape,
        uTime,
        beatCubescape,
        energyCubescape,
        uLayerCubescape,
        uLayerCubescapeTheme
    );
    baseColor += layerSpires(
        uvSpires,
        uTime,
        beatSpires,
        energySpires,
        trebleSpires,
        uLayerSpires,
        uLayerSpiresTheme
    );
    baseColor += layerHopalong(
        uvHopalong,
        uTime,
        beatHopalong,
        energyHopalong,
        mouseUV,
        uMouseSpeed,
        uMouseDown,
        uLayerHopalong,
        uLayerHopalongMouseSens,
        uLayerHopalongTheme
    );
    baseColor += layerMetatron(
        uvMetatron,
        uTime,
        beatMetatron,
        energyMetatron,
        uLayerMetatron,
        uLayerMetatronRings,
        uLayerMetatronTheme
    );

    vec3 color = baseColor / (vec3(1.0) + baseColor);
    gl_FragColor = vec4(color, 1.0);
}
