// ============================================================================
// LAYER: Starfield Tunnel
// Warp drive / hyperspace effect
// ============================================================================

vec3 layerStarfield(vec2 uv, float time, float beat, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float starfield = 0.0;
    
    for (int layer = 0; layer < 4; layer++) {
        float layerOffset = float(layer) * 0.25;
        
        float speed = 0.3 + beat * 0.5;
        float depth = fract(time * speed + layerOffset);
        float invDepth = 1.0 - depth;
        
        vec2 starUV = uv / (invDepth * 0.5 + 0.1);
        
        vec2 starCell = floor(starUV * 15.0);
        vec2 starPos = fract(starUV * 15.0) - 0.5;
        
        vec2 offset = vec2(
            hash(starCell) - 0.5,
            hash(starCell + vec2(1.0, 0.0)) - 0.5
        ) * 0.8;
        
        float starDist = length(starPos - offset);
        float starSize = 0.02 + depth * 0.08;
        
        float brightness = smoothstep(starSize, 0.0, starDist);
        brightness *= depth;
        brightness *= 1.0 + 0.3 * sin(time * 5.0 + hash(starCell) * TAU);
        
        float trail = exp(-starDist * 20.0 / (depth + 0.1)) * depth * 0.5;
        
        starfield += brightness + trail;
    }
    
    vec3 starColor = mix(
        palette(time * 0.05, theme),
        palette(time * 0.12 + 0.4, theme),
        0.5
    );
    
    float scale = intensity * 2.0;
    return starColor * starfield * (0.4 + beat * 0.3) * scale;
}
