
// ============================================================================
// LAYER: Fractal Pattern
// Based on creative coding tutorial by Inigo Quilez
// Video URL: https://youtu.be/f4s1h2YETNY
// Creates fractal-like patterns with palette-based coloring
// ============================================================================

vec3 layerFractal(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float iterations, float scale, float power) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Quality-based optimization
    float q = clamp(uQualityLevel, 0.0, 1.0);
    float effectiveIterations = mix(iterations * 0.5, iterations, smoothstep(0.2, 0.8, q));
    effectiveIterations = clamp(effectiveIterations, 1.0, 5.0);
    int maxIter = int(effectiveIterations + 0.5);
    
    // Audio-reactive parameters
    float audioSpeed = 1.0 + energy * 0.3;
    float audioScale = scale * (1.0 + beat * 0.2);
    float audioPower = power * (1.0 + treble * 0.15);
    
    // Convert UV to centered coordinates (matching Shadertoy format)
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    // Iterate to create fractal pattern
    // Use integer loop with constant bound to avoid GLSL compilation errors
    for (int i = 0; i < 5; i++) {
        if (i >= maxIter) break;
        
        float fi = float(i);
        // Fractal transformation
        uv = fract(uv * audioScale) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        
        // Color from global theme palette
        vec3 col = palette(length(uv0) + fi * 0.5 + time * audioSpeed * 0.5, theme);
        
        // Create wave pattern
        d = sin(d * 8.0 + time * audioSpeed) / 8.0;
        d = abs(d);
        
        // Power-based shaping
        d = pow(0.01 / d, audioPower);
        
        // Audio-reactive brightness (reduced by half)
        float brightness = 0.5 + beat * 0.15 + energy * 0.1;
        finalColor += col * d * brightness;
    }
    
    // Apply intensity (reduced by half)
    return finalColor * intensity * 0.5;
}
