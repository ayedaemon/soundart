// ============================================================================
// LAYER: Fibonacci
// Golden ratio spiral points
// ============================================================================

vec3 layerFibonacci(vec2 uv, float time, float beat, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float fiboField = 0.0;
    float numPoints = COMPLEXITY;
    
    for (float i = 1.0; i < 200.0; i++) {
        if (i >= numPoints) break;
        
        float angle = i * GOLDEN_ANGLE + time * 0.2;
        float radius = sqrt(i) * 0.05;
        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        
        float d = length(uv - pos);
        float size = 0.025 + 0.01 * sin(time + i * 0.1) * (1.0 + beat);
        fiboField += exp(-d * d / (size * size)) * 0.25;
    }
    
    vec3 color = palette(fiboField * 2.0 + time * 0.08, theme);
    
    float scale = intensity * 2.0;
    return color * fiboField * 0.5 * scale;
}
