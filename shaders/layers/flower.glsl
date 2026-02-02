// ============================================================================
// LAYER: Flower of Life
// Sacred geometry circles
// ============================================================================

float flowerOfLifePattern(vec2 uv, float time, float beat) {
    float pattern = 0.0;
    float scale = 3.0 + beat;
    
    for (int i = 0; i < 7; i++) {
        float angle = float(i) * TAU / 6.0;
        vec2 offset = i == 0 ? vec2(0.0) : vec2(cos(angle), sin(angle)) * 0.5;
        offset *= 1.0 + 0.1 * sin(time + float(i));
        
        float d = length(uv * scale - offset);
        float circle = smoothstep(0.52, 0.48, d) - smoothstep(0.48, 0.44, d);
        pattern += circle;
    }
    
    return pattern;
}

vec3 layerFlower(vec2 uv, float time, float beat, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float flower = flowerOfLifePattern(uv, time, beat);
    vec3 color = palette(0.6 + time * 0.03, theme) * flower;
    
    float scale = intensity * 2.0;
    return color * (0.2 + beat * 0.15) * scale;
}
