


// ============================================================================
// LAYER: Lissajous
// Symmetric line trails with kaleidoscope splits
// OPTIMIZED: Quality-based trail reduction, cached palette, skipped expensive effects
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
    float hueOffset,
    float qualityLevel
) {
    // Quality-based trail step reduction
    // Low (0.0-0.3): ~40% steps, Medium (0.3-0.7): ~70% steps, High (0.7-1.0): 100% steps
    float q = clamp(qualityLevel, 0.0, 1.0);
    float effectiveSteps = mix(48.0 * 0.4, 48.0, smoothstep(0.3, 0.7, q));
    int maxTrailSteps = int(effectiveSteps + 0.5);
    if (maxTrailSteps < 8) maxTrailSteps = 8; // Minimum for visual continuity
    
    // Quality flags
    bool skipGlow = q < 0.3;

    float dmp = clamp(damping, 0.0, 1.0);
    float dmpCurve = pow(dmp, 1.8);
    float decay = mix(0.992, 0.62, dmpCurve);
    
    vec3 col = vec3(0.0);
    float w = 1.0;



    float wLine = max(0.00020, thickness * 0.30);
    float sigma2 = max(1e-6, wLine * wLine);
    float invSigma2 = 1.0 / sigma2;
    float invGlow2 = invSigma2 / 9.0;


    vec3 c = palette(hueOffset + baseTime * 0.015, theme);
    
    vec2 prev = lissajousPos(baseTime, a, b, delta) * 0.5;
    
    const int TRAIL_STEPS = 48;
    for (int i = 0; i < TRAIL_STEPS; i++) {
        if (i >= maxTrailSteps) break;
        float t = baseTime - float(i + 1) * dt;
        vec2 cur = lissajousPos(t, a, b, delta) * 0.5;
        
        float d2 = lissajousSegDist2(uv, prev, cur);
        
        float core = exp(-d2 * invSigma2);
        
        // Skip expensive glow calculation on low quality
        float glow = 0.0;
        if (!skipGlow) {
            glow = exp(-d2 * invGlow2);
        }

        float seg = core * 1.05 + glow * 0.35;

        col += c * seg * w * 0.14;
        
        w *= decay;
        prev = cur;
        
        // Early termination: exit if weight is too low
        if (w < 0.02) break;
        // Early exit on low quality if contribution is minimal
        if (q < 0.4 && w < 0.1 && length(col) < 0.01) break;
    }
    
    return col;
}

vec3 layerLissajous(vec2 uv, float time, float energy, float intensity, float theme, float speed, float frequencies, float slices, float damping, float thickness) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Quality-based optimizations
    float q = clamp(uQualityLevel, 0.0, 1.0);
    
    // Quality-based curve reduction: skip second curve on very low quality
    bool skipSecondCurve = q < 0.25;

    float freqA = 3.0 + frequencies * 0.5;
    float freqB = 2.0 + frequencies * 0.3;
    

    float baseSlices = floor(max(3.0, slices) + 0.5);
    float audioSlices = floor(clamp(energy, 0.0, 1.0) * 2.0);
    vec2 suv = lissajousKaleido(uv, baseSlices + audioSlices);
    



    float timeScaled = time * speed;
    float t1 = timeScaled * 0.30;
    float t2 = timeScaled * 0.33;
    float dt = 0.05 * speed;
    
    vec3 c1 = lissajousTrailColor(suv, t1, dt, freqA, freqB, PI * 0.5, thickness, damping, theme, 0.12, q);
    
    // Skip second curve on very low quality for significant cost savings
    vec3 c2 = vec3(0.0);
    if (!skipSecondCurve) {
        c2 = lissajousTrailColor(suv, t2, dt, freqA + 2.0, freqB + 2.0, 0.0, thickness, damping, theme, 0.12, q);
    }
    
    vec3 color = c1 + c2 * 0.75;
    

    float boost = 0.85 + energy * 1.25;
    float scale = intensity * 4.8;
    return color * boost * scale;
}
