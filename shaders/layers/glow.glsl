




// ============================================================================
// LAYER: Center Glow
// Pulsing core with arcs
// OPTIMIZED: Quality-based ring reduction, reduced FBM octaves
// ============================================================================

float glowNoise(vec2 p) {

    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float glowFbm(vec2 p, float qualityLevel) {
    // Quality-based octave reduction
    float q = clamp(qualityLevel, 0.0, 1.0);
    int maxOctaves = int(mix(1.0, 3.0, smoothstep(0.2, 0.8, q)) + 0.5);

    float f = 0.0;
    float a = 0.55;
    for (int i = 0; i < 3; i++) {
        if (i >= maxOctaves) break;
        f += a * glowNoise(p);
        p = p * 2.02 + vec2(11.3, 7.7);
        a *= 0.5;
    }
    return f;
}

vec3 layerGlow(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float coreSize, float ringCount, float arcIntensity) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float b = clamp(beat, 0.0, 1.0);
    float e = clamp(energy, 0.0, 1.0);
    float t = clamp(treble, 0.0, 1.0);
    float q = clamp(uQualityLevel, 0.0, 1.0);

    float r = length(uv);
    float size = max(0.12, coreSize);


    vec3 tintA = mix(vec3(1.0), palette(0.48 + time * 0.03 + b * 0.08, theme), 0.72);
    vec3 tintB = mix(vec3(1.0), palette(0.82 + time * 0.04 + t * 0.15, theme), 0.68);


    float n = glowFbm(uv * (7.0 + e * 6.0) + vec2(time * 0.18, -time * 0.14), q);
    float tex = 0.85 + 0.25 * sin(time * (0.9 + e) + n * TAU);


    float coreK = 3.8 / (size * size);
    float core = exp(-r * r * coreK);
    float coreGlow = core * (0.06 + 0.10 * e + 0.12 * pow(b, 1.15)) * tex;


    float haloR = 0.22 * size + 0.06 * pow(b, 1.2);
    float haloW = 0.035 + 0.055 * size;
    float halo = exp(-pow((r - haloR) / max(1e-4, haloW), 2.0));
    float haloGlow = halo * (0.04 + 0.10 * e) * (0.85 + 0.35 * n);


    // Quality-based ring reduction
    float effectiveRingCount = mix(ringCount * 0.5, ringCount, smoothstep(0.3, 0.7, q));
    
    float ringPulse = 0.18 + 0.82 * pow(smoothstep(0.18, 1.0, b), 1.4);
    int rings = int(effectiveRingCount + 0.5);
    float ringField = 0.0;
    if (rings > 0) {
        float maxR = 0.25 + 0.75 * size;
        float speed = 0.55 + e * 0.85;
        for (int i = 0; i < 10; i++) {
            if (i >= rings) break;
            float fi = float(i) + 1.0;
            float phase = fract(time * speed + fi * 0.37 + n * 0.25);
            float rr = phase * maxR;
            float w = mix(0.020, 0.006, t) * (1.0 + 0.35 * e);
            float ring = exp(-pow((r - rr) / max(1e-4, w), 2.0));
            ring *= (1.0 - phase);
            ringField += ring;
        }
    }
    float ringsGlow = ringField * ringPulse * (0.10 + 0.12 * e);


    // Skip expensive ray calculations on low quality
    float raysGlow = 0.0;
    if (q >= 0.3) {
        float ang = atan(uv.y, uv.x);
        float spokeCount = 6.0 + floor(ringCount * 0.6);
        float spoke = abs(sin(ang * spokeCount + time * (0.25 + e * 0.25) + (n - 0.5) * 0.6));
        float spokeWidth = mix(0.085, 0.028, t);
        float rays = smoothstep(spokeWidth, 0.0, spoke);
        rays *= smoothstep(0.06, 0.22, r);
        rays *= exp(-r * (1.6 / max(0.3, size)));
        raysGlow = rays * arcIntensity * (0.05 + 0.22 * smoothstep(0.25, 1.0, t));
    }


    vec3 result = vec3(0.0);
    result += tintA * coreGlow;
    result += tintB * haloGlow;
    result += mix(tintA, tintB, 0.5) * ringsGlow;
    result += tintB * raysGlow;

    float scale = intensity * 2.4;
    return result * scale;
}
