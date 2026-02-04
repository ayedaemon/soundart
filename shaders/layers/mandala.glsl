// ============================================================================
// LAYER: Mandala
// Radial symmetric patterns
// ============================================================================

float mandalaPattern(vec2 uv, float segments, float time, float rotation, float symmetry) {
    // Apply rotation
    float angle = atan(uv.y, uv.x) + time * rotation;
    float r = length(uv);
    
    // Apply symmetry (mirroring)
    if (symmetry > 0.0) {
        float slice = TAU / segments;
        angle = mod(angle, slice);
        angle = abs(angle - slice * 0.5);
        angle = slice * 0.5 - angle;
        // Remap back to full circle for sine waves if needed, or keep as wedge
        // For this pattern, we want continuous waves, so we might not want hard mirroring unless requested
        // Let's use symmetry to blend between mirrored and continuous
        float continuousAngle = atan(uv.y, uv.x) + time * rotation;
        angle = mix(continuousAngle, angle, step(0.5, symmetry)); 
    } else {
        // Continuous
        angle = mod(angle, TAU);
    }
    
    // The pattern logic
    // We use 'segments' to determine the frequency around the circle
    
    // Base wave
    float shape = sin(angle * segments + r * 10.0 - time);
    
    // Secondary wave
    shape += 0.5 * sin(angle * segments * 2.0 - r * 5.0 + time * 1.5);
    
    // Decay
    shape *= exp(-r * 2.0);
    
    return shape;
}

vec3 layerMandala(vec2 uv, float time, float beat, float energy, float intensity, float theme, float segments, float rotation, float symmetry) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Audio reactivity adds to the base segments
    float finalSegments = segments + floor(energy * 4.0);
    
    float m1 = mandalaPattern(uv, finalSegments, time, rotation, symmetry);
    float m2 = mandalaPattern(uv * 1.5, finalSegments + 2.0, -time * 0.7, -rotation * 1.2, symmetry);
    
    vec3 color = palette(m1 + time * 0.05, theme);
    
    // Pulse with beat
    float pulse = 1.0 + beat * 0.2;
    
    return color * (abs(m1) * 0.3 + abs(m2) * 0.15) * pulse * intensity * 2.0;
}
