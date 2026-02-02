// ============================================================================
// Reaction-Diffusion Simulation (Gray-Scott)
// ============================================================================
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

uniform sampler2D uInput;
uniform vec2 uTexel;
uniform float uTime;
uniform float uTreble;

#include "common/constants.glsl"
#include "common/hash.glsl"

vec2 sampleChem(vec2 uv) {
    return texture2D(uInput, uv).rg;
}

void main() {
    vec2 uv = gl_FragCoord.xy * uTexel;
    vec2 center = sampleChem(uv);
    float a = center.r;
    float b = center.g;

    vec2 left = sampleChem(uv - vec2(uTexel.x, 0.0));
    vec2 right = sampleChem(uv + vec2(uTexel.x, 0.0));
    vec2 down = sampleChem(uv - vec2(0.0, uTexel.y));
    vec2 up = sampleChem(uv + vec2(0.0, uTexel.y));
    vec2 downLeft = sampleChem(uv - uTexel);
    vec2 downRight = sampleChem(uv + vec2(uTexel.x, -uTexel.y));
    vec2 upLeft = sampleChem(uv + vec2(-uTexel.x, uTexel.y));
    vec2 upRight = sampleChem(uv + uTexel);

    float lapA = -a;
    lapA += (left.r + right.r + up.r + down.r) * 0.2;
    lapA += (downLeft.r + downRight.r + upLeft.r + upRight.r) * 0.05;

    float lapB = -b;
    lapB += (left.g + right.g + up.g + down.g) * 0.2;
    lapB += (downLeft.g + downRight.g + upLeft.g + upRight.g) * 0.05;

    float treble = clamp(uTreble, 0.0, 1.0);
    float feed = 0.034 + treble * 0.014;
    float kill = 0.058 + treble * 0.022;
    float da = 1.0;
    float db = 0.5;
    float reaction = a * b * b;

    float mutation = smoothstep(0.4, 0.9, treble);
    float noise = hash(gl_FragCoord.xy * 0.6 + uTime * 3.5);
    b += mutation * (noise - 0.5) * 0.08;

    float nextA = a + (da * lapA - reaction + feed * (1.0 - a));
    float nextB = b + (db * lapB + reaction - (kill + feed) * b);

    gl_FragColor = vec4(clamp(nextA, 0.0, 1.0), clamp(nextB, 0.0, 1.0), 0.0, 1.0);
}
