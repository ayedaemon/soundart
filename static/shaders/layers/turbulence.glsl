


// ============================================================================
// LAYER: Turbulence
// Audio-reactive turbulence with flow distortion
// OPTIMIZED: Quality-based octave reduction, reduced warp octaves
// ============================================================================

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 288.704; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                        -0.577350269189626,
                        0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}


#define MAX_OCTAVES 6

float turbulenceN(in vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    int oct = octaves;
    if (oct < 1) oct = 1;
    if (oct > MAX_OCTAVES) oct = MAX_OCTAVES;
    

    for (int i = 0; i < MAX_OCTAVES; i++) {
        if (i >= oct) break;
        value += amplitude * abs(snoise(st));
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec3 layerTurbulence(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float complexity, float flow) {
    if (intensity <= 0.0) return vec3(0.0);

    vec2 st = uv * 0.5 + 0.5;

    st.x = (st.x > 0.5) ? st.x : 1.0 - st.x;
    st.y = (st.y > 0.5) ? st.y : 1.0 - st.y;

    float beatBoost = 0.25 + beat * 0.75;
    

    float t = time * (0.35 + energy * 0.8) * (1.0 + abs(flow));
    vec2 flowDir = vec2(cos(flow * PI), sin(flow * PI));



    // Quality-based octave reduction
    float q = clamp(uQualityLevel, 0.0, 1.0);
    
    int octaves = int(complexity + 0.5);
    if (octaves < 1) octaves = 1;
    if (octaves > MAX_OCTAVES) octaves = MAX_OCTAVES;
    
    // Scale octaves based on quality: Low quality uses fewer octaves
    float effectiveOctaves = mix(float(octaves) * 0.5, float(octaves), smoothstep(0.3, 0.8, q));
    octaves = int(effectiveOctaves + 0.5);
    if (octaves < 1) octaves = 1;
    if (octaves > MAX_OCTAVES) octaves = MAX_OCTAVES;
    
    int warpOctaves = octaves;
    if (warpOctaves > 3) warpOctaves = 3;
    
    // Further reduce warp octaves on low quality
    if (q < 0.4) {
        warpOctaves = warpOctaves - 1;
        if (warpOctaves < 1) warpOctaves = 1;
    }


    st.x += turbulenceN(st * (1.2 + treble * 0.6) + t * flowDir.x, warpOctaves) * 0.45 * beatBoost;
    st.y += turbulenceN(st + vec2(1.0, 0.3) + t * flowDir.y, warpOctaves) * 0.25 * (0.6 + treble);


    float field = turbulenceN(st * (4.5 + energy * 5.0), octaves);
    float mask = smoothstep(0.2, 0.9, field);

    float scaleOut = intensity * 1.0;
    vec3 color = palette(field * 0.9 + time * 0.08 + beat * 0.15, theme);
    return color * mask * (0.4 + energy) * scaleOut;
}
