// ============================================================================
// LAYER: Center Glow
// Pulsing core, beat rings, electric arcs
// ============================================================================

vec3 layerGlow(vec2 uv, float time, float beat, float treble, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float centerDist = length(uv);
    vec3 result = vec3(0.0);
    float scale = intensity * 2.0;
    
    // Soft pulsing core
    float coreGlow = exp(-centerDist * 3.0) * (0.12 + beat * 0.15);
    result += palette(0.5 + time * 0.05, theme) * coreGlow * scale;
    
    // Expanding rings on beats
    if (beat > 0.5) {
        float ringPhase = fract(time * 1.5);
        float ring = abs(centerDist - ringPhase * 0.6);
        float ringGlow = exp(-ring * ring * 80.0) * (beat - 0.5) * 0.5;
        result += palette(ringPhase + 0.2, theme) * ringGlow * scale;
    }
    
    // Electric arcs on treble
    if (treble > 0.4) {
        float arcAngle = floor(atan(uv.y, uv.x) / (TAU / 6.0)) * (TAU / 6.0);
        vec2 arcDir = vec2(cos(arcAngle), sin(arcAngle));
        float arc = abs(dot(uv, vec2(-arcDir.y, arcDir.x)));
        float arcGlow = exp(-arc * 40.0) * (treble - 0.4) * centerDist * 0.6;
        result += palette(0.9, theme) * arcGlow * scale;
    }
    
    return result;
}
