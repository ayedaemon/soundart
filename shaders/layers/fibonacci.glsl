// ============================================================================
// LAYER: Fibonacci
// Golden ratio spiral with phyllotaxis pattern
// ============================================================================

vec3 layerFibonacci(vec2 uv, float time, float beat, float intensity, float numPoints, float speed, float angleMult, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float fiboField = 0.0;
    
    // Phyllotaxis angle - GOLDEN_ANGLE multiplied by user control
    // 1.0 = perfect golden angle (137.5°)
    // < 1.0 = counter-clockwise swirl
    // > 1.0 = clockwise swirl
    float phyllotaxisAngle = GOLDEN_ANGLE * angleMult;
    
    // Rotation speed
    float rotationSpeed = speed * 0.2;
    
    for (float i = 1.0; i < 200.0; i++) {
        if (i >= numPoints) break;
        
        float angle = i * phyllotaxisAngle + time * rotationSpeed;
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
