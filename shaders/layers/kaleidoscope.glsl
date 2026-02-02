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

float kaleidoscopeLines(vec2 uv, float time, float treble) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x);

    float rings = smoothstep(0.02, 0.0, abs(sin(r * 8.0 - time * 0.6)));
    float spokes = smoothstep(0.02, 0.0, abs(sin(angle * 6.0 + time * 0.4)));
    float lattice = smoothstep(0.02, 0.0, abs(sin((uv.x + uv.y) * 6.0 - time * 0.2)));

    float pulse = 0.6 + 0.4 * sin(time * 0.6 + treble * TAU);
    return clamp((rings * 0.6 + spokes * 0.5 + lattice * 0.4) * pulse, 0.0, 1.0);
}

vec3 layerKaleidoscope(vec2 uv, float time, float treble, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);

    float slices = 6.0 + floor(clamp(treble, 0.0, 1.0) * 10.0 + 0.5);
    vec2 kUv = kaleidoscopeMap(uv, slices);
    float lines = kaleidoscopeLines(kUv, time, treble);

    vec2 rdUv = fract(kUv * 0.5 + 0.5);
    vec2 rd = texture2D(uReactionTex, rdUv).rg;
    float organic = smoothstep(0.18, 0.75, rd.g);

    vec3 webColor = palette(lines + time * 0.04, theme);
    vec3 organicColor = palette(rd.r + time * 0.02 + treble * 0.25, theme);
    float glow = 0.4 + 0.6 * exp(-length(kUv) * 1.6);
    float web = lines * glow;
    float fill = (1.0 - lines) * organic * (0.45 + treble * 0.4);
    return (webColor * web + organicColor * fill) * intensity * 1.6;
}
