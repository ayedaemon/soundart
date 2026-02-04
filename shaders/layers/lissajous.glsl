// ============================================================================
// LAYER: Lissajous
// Flowing mathematical curves
// ============================================================================

vec2 lissajousPos(float t, float a, float b, float delta) {
    return vec2(sin(a * t + delta), sin(b * t));
}

float lissajousSegDist2(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float denom = max(1e-6, dot(ba, ba));
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
    vec2 v = pa - ba * h;
    return dot(v, v);
}

vec2 lissajousKaleido(vec2 uv, float slices) {
    // Same mapping style as Kaleidoscope layer: folds space into a symmetric wedge.
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float slice = TAU / max(1.0, slices);
    angle = mod(angle, slice);
    angle = abs(angle - slice * 0.5);
    angle = slice * 0.5 - angle;
    return vec2(cos(angle), sin(angle)) * radius;
}

vec3 lissajousTrailColor(
    vec2 uv,
    float baseTime,
    float dt,
    float a,
    float b,
    float delta,
    float thickness,
    float damping,
    float theme,
    float hueOffset
) {
    // Similar to Hopalong: accumulate many small contributions with a hue gradient.
    // Higher damping -> shorter trail (faster decay).
    const int TRAIL_STEPS = 48;
    // Perceptual curve: give more precision near low damping values.
    float dmp = clamp(damping, 0.0, 1.0);
    float dmpCurve = pow(dmp, 1.8);
    float decay = mix(0.992, 0.62, dmpCurve);
    
    vec3 col = vec3(0.0);
    float w = 1.0;

    // Hoist invariants out of the loop (big perf win).
    // Thickness -> effective gaussian width (clamped for stability).
    float wLine = max(0.00020, thickness * 0.30);
    float sigma2 = max(1e-6, wLine * wLine);
    float invSigma2 = 1.0 / sigma2;
    float invGlow2 = invSigma2 / 9.0; // (wLine*3)^2 = 9*wLine^2

    // Theme-consistent color with slight time drift (no per-step palette calls).
    vec3 c = palette(hueOffset + baseTime * 0.015, theme);
    
    vec2 prev = lissajousPos(baseTime, a, b, delta) * 0.5;
    
    for (int i = 0; i < TRAIL_STEPS; i++) {
        float t = baseTime - float(i + 1) * dt;
        vec2 cur = lissajousPos(t, a, b, delta) * 0.5;
        
        float d2 = lissajousSegDist2(uv, prev, cur);
        
        float core = exp(-d2 * invSigma2);
        float glow = exp(-d2 * invGlow2);
        
        // Bright core + softer glow for visibility over noisy layers.
        float seg = core * 1.05 + glow * 0.35;

        col += c * seg * w * 0.14;
        
        w *= decay;
        prev = cur;
        
        // Early exit when contribution becomes negligible.
        if (w < 0.02) break;
    }
    
    return col;
}

vec3 layerLissajous(vec2 uv, float time, float energy, float intensity, float theme, float speed, float frequencies, float slices, float damping, float thickness) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Frequencies control the complexity of the knot
    float freqA = 3.0 + frequencies * 0.5;
    float freqB = 2.0 + frequencies * 0.3;
    
    // Symmetry complexity (explicit control) with subtle audio push
    float baseSlices = floor(max(3.0, slices) + 0.5);
    float audioSlices = floor(clamp(energy, 0.0, 1.0) * 2.0);
    vec2 suv = lissajousKaleido(uv, baseSlices + audioSlices);
    
    // Decouple speed from trail persistence:
    // - `speed` controls motion (phase progression)
    // - trail "age per step" stays constant in real time by scaling dt with speed
    float timeScaled = time * speed;
    float t1 = timeScaled * 0.30;
    float t2 = timeScaled * 0.33;
    float dt = 0.05 * speed;
    
    vec3 c1 = lissajousTrailColor(suv, t1, dt, freqA, freqB, PI * 0.5, thickness, damping, theme, 0.12);
    vec3 c2 = lissajousTrailColor(suv, t2, dt, freqA + 2.0, freqB + 2.0, 0.0, thickness, damping, theme, 0.12);
    
    vec3 color = c1 + c2 * 0.75;
    
    // Energy boosts brightness so it stays visible over turbulence/noise layers.
    float boost = 0.85 + energy * 1.25;
    float scale = intensity * 4.8;
    return color * boost * scale;
}
