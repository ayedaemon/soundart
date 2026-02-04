


// ============================================================================
// LAYER: Mandala
// Radial symmetries
// OPTIMIZED: Quality-based pattern reduction (already very efficient)
// ============================================================================

float mandalaPattern(vec2 uv, float segments, float time, float rotation, float symmetry) {

    float angle = atan(uv.y, uv.x) + time * rotation;
    float r = length(uv);
    

    if (symmetry > 0.0) {
        float slice = TAU / segments;
        angle = mod(angle, slice);
        angle = abs(angle - slice * 0.5);
        angle = slice * 0.5 - angle;



        float continuousAngle = atan(uv.y, uv.x) + time * rotation;
        angle = mix(continuousAngle, angle, step(0.5, symmetry)); 
    } else {

        angle = mod(angle, TAU);
    }
    


    

    float shape = sin(angle * segments + r * 10.0 - time);
    

    shape += 0.5 * sin(angle * segments * 2.0 - r * 5.0 + time * 1.5);
    

    shape *= exp(-r * 2.0);
    
    return shape;
}

vec3 layerMandala(vec2 uv, float time, float beat, float energy, float intensity, float theme, float segments, float rotation, float symmetry) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Quality-based pattern reduction: skip second pattern on very low quality
    float q = clamp(uQualityLevel, 0.0, 1.0);
    bool skipSecondPattern = q < 0.25;

    float finalSegments = segments + floor(energy * 4.0);
    
    float m1 = mandalaPattern(uv, finalSegments, time, rotation, symmetry);
    float m2 = skipSecondPattern ? 0.0 : mandalaPattern(uv * 1.5, finalSegments + 2.0, -time * 0.7, -rotation * 1.2, symmetry);
    
    vec3 color = palette(m1 + time * 0.05, theme);
    

    float pulse = 1.0 + beat * 0.2;
    
    return color * (abs(m1) * 0.3 + abs(m2) * 0.15) * pulse * intensity * 2.0;
}
