// ============================================================================
// LAYER: Mandala
// Radial symmetric patterns
// ============================================================================

float mandalaPattern(vec2 uv, float segments, float time, float offset) {
    float a = atan(uv.y, uv.x) + time * 0.1;
    float r = length(uv);
    
    a = mod(a, TAU / segments) - TAU / segments / 2.0;
    
    float shape = sin(a * segments + r * 10.0 - time + offset);
    shape += 0.5 * sin(a * segments * 2.0 - r * 5.0 + time * 1.5);
    shape *= exp(-r * 2.0);
    
    return shape;
}

vec3 layerMandala(vec2 uv, float time, float beat, float energy, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float baseSegments = 4.0 + COMPLEXITY / 20.0;
    float segments = baseSegments + floor(energy * 4.0);
    
    float m1 = mandalaPattern(uv, segments, time, 0.0);
    float m2 = mandalaPattern(uv * 1.5, segments + 2.0, -time * 0.7, PI);
    
    vec3 color = palette(m1 + time * 0.05, theme);
    
    float scale = intensity * 2.0;
    return color * (abs(m1) * 0.3 + abs(m2) * 0.15) * scale;
}
