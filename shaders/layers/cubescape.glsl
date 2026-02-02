// ============================================================================
// LAYER: Cubescape
// Raymarched cube lattice with audio-driven motion
// ============================================================================

vec3 cubescapeRotateX(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 cubescapeRotateY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

float cubescapeSdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float cubescapeMap(vec3 p, float time, float beat, float energy) {
    float spacing = 2.6 + energy * 1.2;
    p.z += time * (0.6 + energy * 0.3);
    p = cubescapeRotateY(p, time * 0.2 + beat * 0.6);
    p = cubescapeRotateX(p, sin(time * 0.15) * 0.4);

    vec3 cellId = floor((p + spacing * 0.5) / spacing);
    vec3 cell = mod(p + spacing * 0.5, spacing) - spacing * 0.5;

    float wobble = sin(dot(cellId, vec3(0.9, 1.3, 1.1)) + time * 0.4);
    float size = 0.35 + 0.2 * wobble + beat * 0.2;
    return cubescapeSdBox(cell, vec3(size));
}

float cubescapeRaymarch(vec3 ro, vec3 rd, float time, float beat, float energy) {
    float t = 0.0;
    for (int i = 0; i < 36; i++) {
        vec3 p = ro + rd * t;
        float d = cubescapeMap(p, time, beat, energy);
        if (d < 0.002) {
            break;
        }
        t += d * 0.85;
        if (t > 20.0) {
            break;
        }
    }
    return t;
}

vec3 cubescapeNormal(vec3 p, float time, float beat, float energy) {
    vec2 e = vec2(0.002, 0.0);
    return normalize(vec3(
        cubescapeMap(p + e.xyy, time, beat, energy) - cubescapeMap(p - e.xyy, time, beat, energy),
        cubescapeMap(p + e.yxy, time, beat, energy) - cubescapeMap(p - e.yxy, time, beat, energy),
        cubescapeMap(p + e.yyx, time, beat, energy) - cubescapeMap(p - e.yyx, time, beat, energy)
    ));
}

vec3 layerCubescape(vec2 uv, float time, float beat, float energy, float intensity, float theme) {
    if (intensity <= 0.0) return vec3(0.0);

    vec3 ro = vec3(0.0, 0.2, -6.0);
    ro.x += sin(time * 0.2) * 0.6;
    ro.y += cos(time * 0.17) * 0.4;
    vec3 rd = normalize(vec3(uv, 1.6));
    rd = cubescapeRotateY(rd, sin(time * 0.15) * 0.3);
    rd = cubescapeRotateX(rd, cos(time * 0.12) * 0.2);

    float maxDist = 20.0;
    float t = cubescapeRaymarch(ro, rd, time, beat, energy);
    if (t > maxDist) return vec3(0.0);

    vec3 p = ro + rd * t;
    vec3 n = cubescapeNormal(p, time, beat, energy);

    vec3 lightDir = normalize(vec3(0.5, 0.7, 0.6));
    float diff = max(dot(n, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 16.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);

    vec3 base = palette(p.z * 0.12 + time * 0.05, theme);
    vec3 highlight = palette(p.x * 0.18 + time * 0.08 + 0.35, theme);

    float fog = exp(-t * 0.15);
    float pulse = 0.6 + 0.4 * beat;
    vec3 color = base * (0.25 + diff * 0.9) + highlight * (rim * 0.6 + spec * 0.4);
    return color * fog * pulse * intensity * 1.6;
}
