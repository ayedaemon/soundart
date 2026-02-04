// ============================================================================
// LAYER: Kaleidoscope
// Sacred geometry mirroring and mandala symmetry
// ============================================================================

vec2 kaleidoscopeMap(vec2 uv, float slices) {
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float slice = TAU / max(1.0, slices);
    angle = mod(angle, slice);
    angle = abs(angle - slice * 0.5);
    angle = slice * 0.5 - angle;
    return vec2(cos(angle), sin(angle)) * radius;
}

float kaleidoscopeLines(vec2 uv, float time, float treble, float distortion, float slices) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Distortion warps the coordinates (still symmetric because we're in folded space)
    float dist = sin(r * 10.0 - time) * distortion * 0.1;
    r += dist;
    angle += sin(r * 6.0 + time * 0.7) * distortion * 0.05;

    float s = max(2.0, slices);
    float spokeCount = 3.0 + s * 0.5;

    // Multi-frequency symmetric structure (rings + spokes + lattices + rosettes)
    float ringsA = smoothstep(0.02, 0.0, abs(sin(r * 8.0 - time * 0.6)));
    float ringsB = smoothstep(0.015, 0.0, abs(sin(r * (12.0 + s * 0.2) + time * 0.35)));
    float spokesA = smoothstep(0.02, 0.0, abs(sin(angle * spokeCount + time * 0.4)));
    float spokesB = smoothstep(0.02, 0.0, abs(sin(angle * spokeCount * 2.0 - r * 6.0 + time * 0.9)));
    float latticeA = smoothstep(0.02, 0.0, abs(sin((uv.x + uv.y) * (6.0 + s * 0.2) - time * 0.2)));
    float latticeB = smoothstep(0.02, 0.0, abs(sin((uv.x - uv.y) * (5.0 + s * 0.18) + time * 0.27)));
    float rosette = smoothstep(0.02, 0.0, abs(sin(angle * s * 1.5 + r * 10.0 - time)));

    float pulse = 0.6 + 0.4 * sin(time * 0.6 + treble * TAU);

    float structure =
      ringsA * 0.35 +
      ringsB * 0.25 +
      spokesA * 0.35 +
      spokesB * 0.25 +
      latticeA * 0.30 +
      latticeB * 0.25 +
      rosette * 0.30;

    return clamp(structure * pulse, 0.0, 1.0);
}

vec3 layerKaleidoscope(vec2 uv, float time, float treble, float intensity, float theme, float slices, float feedback, float distortion, sampler2D feedbackTex) {
    if (intensity <= 0.0) return vec3(0.0);

    float tr = clamp(treble, 0.0, 1.0);

    // Audio reactivity adds to slices
    float finalSlices = slices + floor(tr * 4.0);
    
    vec2 kUv = kaleidoscopeMap(uv, finalSlices);
    // Nested kaleidoscope fold adds symmetric complexity without extra params
    vec2 kUv2 = kaleidoscopeMap(kUv * 1.35, max(3.0, finalSlices * 0.5 + 3.0));

    float linesA = kaleidoscopeLines(kUv, time, treble, distortion, finalSlices);
    float linesB = kaleidoscopeLines(kUv2, -time * 0.7, treble, distortion * 0.75, finalSlices + 4.0);
    float lines = clamp(linesA * 0.65 + linesB * 0.65, 0.0, 1.0);

    // Feedback sampling
    // We sample the feedback texture using the kaleidoscoped UVs
    vec2 sampleUv = mix(kUv, kUv2, 0.35 + 0.25 * tr);
    vec2 rdUv = fract(sampleUv * 0.5 + 0.5); // Map to 0-1 range
    vec3 rd = texture2D(feedbackTex, rdUv).rgb;
    
    // Use feedback green channel for organic pattern
    float organic = smoothstep(0.18, 0.75, rd.g);

    // Stronger, more readable web so it survives bright additive mixes.
    float linesSoft = pow(lines, 0.5);   // Softer falloff for more visible lines
    float linesSharp = pow(lines, 1.8);  // Less aggressive sharpening
    
    float glow = 0.7 + 1.2 * exp(-length(kUv) * 1.2);  // Stronger center glow
    float web = (linesSharp * (1.2 + tr * 0.5) + linesSoft * (0.5 + tr * 0.3)) * glow;

    vec3 webColor = palette(lines * 0.85 + time * 0.04, theme);
    // Stronger white-lift so it punches through other layers
    webColor = mix(webColor, vec3(1.0), 0.15 + 0.3 * tr);

    vec3 organicColor = palette(rd.r + time * 0.02 + tr * 0.25, theme);
    
    // Mix organic feedback based on feedback parameter
    float fill = (1.0 - linesSharp) * organic * (0.6 + tr * 0.5) * feedback;
    
    // Much brighter output so it holds up against other additive layers
    return (webColor * web + organicColor * fill) * intensity * 5.5;
}
