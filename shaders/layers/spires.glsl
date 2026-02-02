// ============================================================================
// LAYER: Spires
// Raymarched pillars and vaulted terrain
// ============================================================================

vec3 spiresRotateY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

float spiresSdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float spiresMap(vec3 p, float time, float beat, float energy) {
    float spacing = 3.4;
    p.z += time * (0.8 + energy * 0.4);
    p = spiresRotateY(p, time * 0.1 + beat * 0.3);

    vec2 cellId = floor((p.xz + spacing * 0.5) / spacing);
    vec2 cell = mod(p.xz + spacing * 0.5, spacing) - spacing * 0.5;
    float heightWave = sin(dot(cellId, vec2(1.3, 2.1)) + time * 0.4);
    float height = 1.4 + (0.5 + 0.5 * heightWave) * 3.2 + energy * 2.0;

    vec3 columnPos = vec3(cell.x, p.y - height * 0.5, cell.y);
    float column = spiresSdBox(
        columnPos,
        vec3(0.5 + beat * 0.15, height * 0.5, 0.5 + beat * 0.15)
    );
    float cap = spiresSdBox(
        columnPos - vec3(0.0, height * 0.5, 0.0),
        vec3(0.3, 0.25 + beat * 0.1, 0.3)
    );
    float floorPlane = p.y + 1.6;
    return min(min(column, cap), floorPlane);
}

float spiresRaymarch(vec3 ro, vec3 rd, float time, float beat, float energy) {
    float t = 0.0;
    for (int i = 0; i < 40; i++) {
        vec3 p = ro + rd * t;
        float d = spiresMap(p, time, beat, energy);
        if (d < 0.002) {
            break;
        }
        t += d * 0.85;
        if (t > 24.0) {
            break;
        }
    }
    return t;
}

vec3 spiresNormal(vec3 p, float time, float beat, float energy) {
    vec2 e = vec2(0.002, 0.0);
    return normalize(vec3(
        spiresMap(p + e.xyy, time, beat, energy) - spiresMap(p - e.xyy, time, beat, energy),
        spiresMap(p + e.yxy, time, beat, energy) - spiresMap(p - e.yxy, time, beat, energy),
        spiresMap(p + e.yyx, time, beat, energy) - spiresMap(p - e.yyx, time, beat, energy)
    ));
}

vec3 layerSpires(
    vec2 uv,
    float time,
    float beat,
    float energy,
    float treble,
    float intensity,
    float theme
) {
    if (intensity <= 0.0) return vec3(0.0);

    vec3 ro = vec3(0.0, 0.8, -8.0);
    ro.x += sin(time * 0.12) * 0.8;
    ro.y += energy * 0.3;
    vec3 rd = normalize(vec3(uv.x, uv.y * 0.85 - 0.15, 1.8));
    rd = spiresRotateY(rd, sin(time * 0.1) * 0.35);

    float maxDist = 24.0;
    float t = spiresRaymarch(ro, rd, time, beat, energy);
    if (t > maxDist) return vec3(0.0);

    vec3 p = ro + rd * t;
    vec3 n = spiresNormal(p, time, beat, energy);

    vec3 lightDir = normalize(vec3(-0.3, 0.8, 0.5));
    float diff = max(dot(n, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 24.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);

    vec3 base = palette(p.y * 0.15 + time * 0.04, theme);
    vec3 accent = palette(p.z * 0.1 + 0.5, theme);

    float fog = exp(-t * 0.12);
    float pulse = 0.55 + 0.45 * beat;
    vec3 color = base * (0.3 + diff) + accent * (rim * (0.5 + treble));
    color += spec * (0.3 + treble);
    return color * fog * pulse * intensity * 1.5;
}
