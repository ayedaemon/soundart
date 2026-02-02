// ============================================================================
// LAYER: Lissajous
// Flowing mathematical curves
// ============================================================================

float lissajousCurve(vec2 uv, float time, float a, float b, float delta) {
    float t = time * 0.3;
    vec2 curve = vec2(sin(a * t + delta), sin(b * t));
    return length(uv - curve * 0.5);
}

vec3 layerLissajous(vec2 uv, float time, float energy, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float liss1 = lissajousCurve(uv, time, 3.0, 2.0, PI * 0.5);
    float liss2 = lissajousCurve(uv, time * 1.1, 5.0, 4.0, 0.0);
    
    float glow = exp(-liss1 * 8.0) + exp(-liss2 * 8.0) * 0.5;
    glow *= 0.5 + energy * 0.5;
    
    vec3 color = palette(0.3 + time * 0.04, theme);
    
    float scale = intensity * 2.0;
    return color * glow * 0.35 * scale;
}
