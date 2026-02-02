// ============================================================================
// LAYER: Displacement
// Cellular displacement inspired by @kyndinfo
// ============================================================================

float randomDisplacement(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43756.049);
}

vec2 random2Displacement(vec2 p) {
    return fract(
        sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))))
        * 43758.937
    );
}

float cellularDisplacement(vec2 p) {
    vec2 i_st = floor(p);
    vec2 f_st = fract(p);
    float m_dist = 10.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = random2Displacement(i_st + neighbor);
            point = 0.5 + 0.5 * sin(TAU * point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            m_dist = min(m_dist, dist);
        }
    }
    return m_dist;
}

vec3 layerDisplacement(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);

    vec2 st = uv * 0.5 + 0.5;
    float scale = 4.0 + energy * 4.0;
    st *= scale;

    float wobble = sin(time * 0.5 + treble * 2.0) * 0.4;
    float r = cellularDisplacement(st);
    float b = cellularDisplacement(st - vec2(0.0, wobble));

    float pattern = smoothstep(0.05, 0.8, r);
    float pulse = 0.4 + beat * 0.6;
    vec3 color = palette(r * 1.2 + time * 0.05, theme);
    vec3 accent = palette(b * 1.4 + time * 0.08 + 0.35, theme);

    float scaleOut = intensity * 2.0;
    return mix(color, accent, b) * pattern * pulse * scaleOut;
}
