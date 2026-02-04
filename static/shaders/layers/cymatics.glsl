




// ============================================================================
// LAYER: Cymatics
// Standing-wave / nodal-line patterns (Chladni-inspired)
// Cheap: no texture reads, no loops.
// ============================================================================

vec2 cyRot(vec2 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * p;
}

float cyFieldPlate(vec2 p, float phase, float m, float n) {
    // Classic-ish standing waves on a plate: interference of 2 modes.
    float x = p.x * PI;
    float y = p.y * PI;
    float a = sin(x * m + phase) * sin(y * n - phase);
    float b = sin(x * n - phase * 0.7) * sin(y * m + phase * 0.9);
    return a - b;
}

float cyFieldRadial(vec2 p, float phase, float m, float n) {
    // Radial/azimuthal standing waves (approx cymatics).
    float r = length(p);
    float ang = atan(p.y, p.x);
    float kR = 3.0 + m * 0.85;
    float kA = 2.0 + n;
    float a = sin(r * kR * TAU - phase);
    float b = sin(ang * kA + phase * 0.7);
    return a * b;
}

float cyLine(float v, float w) {
    // Bright on zero-crossings (v ~ 0).
    float aa = 0.35 * w + 0.002;
    return 1.0 - smoothstep(w, w + aa, v);
}

vec3 layerCymatics(
    vec2 uv,
    float time,
    float beat,
    float energy,
    float treble,
    float intensity,
    float theme,
    float mode,
    float m,
    float n,
    float thickness,
    float sharpness,
    float warp
) {
    if (intensity <= 0.0) return vec3(0.0);

    float b = clamp(beat, 0.0, 1.0);
    float e = clamp(energy, 0.0, 1.0);
    float t = clamp(treble, 0.0, 1.0);

    float m0 = max(1.0, floor(m + 0.5));
    float n0 = max(1.0, floor(n + 0.5));

    // Audio adds complexity, but keep it stable on low quality to reduce popping.
    float q = clamp(uQualityLevel, 0.0, 1.0);
    float mAdd = floor(e * 4.0 * mix(0.55, 1.0, smoothstep(0.25, 0.75, q)));
    float nAdd = floor(t * 3.0 * mix(0.55, 1.0, smoothstep(0.25, 0.75, q)));
    float mEff = min(32.0, m0 + mAdd);
    float nEff = min(32.0, n0 + nAdd);

    // Slight rotation for life; stays cheap.
    vec2 p = cyRot(uv, time * 0.12 + (t - 0.5) * 0.18);

    // Optional warp: pure trig, no noise, quality-gated.
    float wAmt = clamp(warp, 0.0, 1.0) * smoothstep(0.35, 0.95, q);
    if (wAmt > 0.001) {
        float wf = 2.5 + 2.0 * t + 0.25 * (mEff + nEff);
        vec2 wv = vec2(
            sin(p.y * wf + time * (0.55 + 0.65 * e)),
            cos(p.x * wf - time * (0.48 + 0.75 * e))
        );
        p += wv * (0.08 + 0.12 * wAmt) * (0.55 + 0.45 * e);
    }

    float phase = time * (0.75 + 0.55 * e);

    // Mode: 0 Plate, 1 Radial, 2 Hybrid.
    float plate = cyFieldPlate(p, phase, mEff, nEff);
    float radial = cyFieldRadial(p, phase, mEff, nEff);

    float f = plate;
    if (mode > 0.5 && mode < 1.5) {
        f = radial;
    } else if (mode >= 1.5) {
        f = mix(plate, radial, 0.5 + 0.35 * sin(time * 0.15));
    }

    // Nodal lines around f == 0.
    float v = abs(f);
    float w = max(0.001, thickness) * (0.85 + 0.55 * (1.0 - t));
    float lines = cyLine(v, w);
    lines = pow(clamp(lines, 0.0, 1.0), max(0.35, sharpness));

    // Subtle center emphasis so it reads under additive mixing.
    float r = length(uv);
    float vign = 1.0 - smoothstep(0.65, 1.85, r);
    float core = exp(-r * r * (1.35 + 0.45 * e));

    vec3 col = palette(0.06 * f + time * 0.03 + 0.08 * e, theme);
    col = mix(col, vec3(1.0), 0.10 + 0.25 * t);

    float pulse = 0.75 + 0.55 * pow(b, 1.15);
    float scale = intensity * (3.2 + 0.6 * e);
    return col * lines * (0.35 + 0.65 * core) * vign * pulse * scale;
}

