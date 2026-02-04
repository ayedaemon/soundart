// ============================================================================
// LAYER: Displacement
// Cellular displacement inspired by @kyndinfo
// ============================================================================

// NOTE: All helpers are prefixed with `disp` to avoid global GLSL name collisions.

vec2 dispHash2(vec2 p) {
    // Uses shared hash(vec2) from common/hash.glsl
    return vec2(
        hash(p),
        hash(p + vec2(17.17, 43.43))
    );
}

float dispNoise(vec2 p) {
    // Cheap value noise (bilinear interpolation of hash)
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec2 dispNoise2(vec2 p) {
    return vec2(
        dispNoise(p),
        dispNoise(p + vec2(5.2, 1.3))
    );
}

void dispWorleyAnimated(
    in vec2 p,
    in float time,
    out float f1,
    out float f2,
    out vec2 cellId,
    out vec2 nearestDiff
) {
    vec2 i_st = floor(p);
    vec2 f_st = fract(p);

    float d1 = 1e9;
    float d2 = 1e9;
    vec2 bestCell = vec2(0.0);
    vec2 bestDiff = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 cell = i_st + neighbor;

            // Random point per cell, but animated (each cell moves at its own speed/phase)
            vec2 rnd = dispHash2(cell);
            float h = hash(cell + vec2(1.7, 9.2));
            float sp = mix(0.35, 1.6, h);

            vec2 point = 0.5 + 0.5 * sin(TAU * rnd + (time * sp + h * TAU));

            // Small orbit to break grid regularity
            float ang = TAU * hash(cell + vec2(8.3, 2.8));
            point += 0.15 * vec2(
                cos(ang + time * (0.7 + 0.5 * sp)),
                sin(ang - time * (0.6 + 0.4 * sp))
            );
            point = fract(point);

            vec2 diff = neighbor + point - f_st;
            float dist2 = dot(diff, diff);

            if (dist2 < d1) {
                d2 = d1;
                d1 = dist2;
                bestCell = cell;
                bestDiff = diff;
            } else if (dist2 < d2) {
                d2 = dist2;
            }
        }
    }

    f1 = sqrt(d1);
    f2 = sqrt(d2);
    cellId = bestCell;
    nearestDiff = bestDiff;
}

vec3 layerDisplacement(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float strength, float cellSize, float ripple) {
    if (intensity <= 0.0) return vec3(0.0);

    float e = clamp(energy, 0.0, 1.0);
    float b = clamp(beat, 0.0, 1.0);
    float t = clamp(treble, 0.0, 1.0);

    // Work in a stable 0-1 space, but allow zoom (uv already zoomed upstream)
    vec2 st = uv * 0.5 + 0.5;

    // Cell scale: keep close to old defaults but allow more "life" with energy
    float scale = cellSize * (4.0 + e * 3.0);
    vec2 p = st * scale;

    // Domain warp / flow. This is what makes it feel less static.
    float flowSpeed = (0.25 + 0.9 * e) * (0.6 + 0.4 * ripple);
    float tt = time * flowSpeed;

    float warpStrength = 0.35 * strength * (0.6 + 0.6 * b);

    // Radial ripple push/pull (so the "Ripple" knob actually feels like ripples)
    float rad = length(uv);
    vec2 radDir = uv / max(1e-4, rad);
    float ripFreq = 3.0 + ripple * 2.5;
    float rip = sin(rad * ripFreq - time * (1.2 + 1.8 * e));
    p += radDir * rip * warpStrength * (0.25 + 0.25 * ripple);

    // Coherent noisy warp
    vec2 n = dispNoise2(p * 0.35 + vec2(0.0, tt * 0.35));
    vec2 warp = (n - 0.5) * 2.0;
    p += warp * warpStrength;

    // Directional flow (adds swirl-like coherence)
    vec2 flow = vec2(
        sin(p.y * 0.85 + tt),
        cos(p.x * 0.75 - tt * 1.1)
    );
    p += flow * warpStrength * (0.6 + 0.4 * t);

    // Animated cellular / Worley distances + nearest-point direction
    float f1, f2;
    vec2 cellId;
    vec2 nearestDiff;
    dispWorleyAnimated(p, time * (0.7 + ripple * 0.4), f1, f2, cellId, nearestDiff);

    // Borders (cell edges) from F2-F1 difference
    float edge = max(0.0, f2 - f1);
    float edgeWidth = mix(0.065, 0.02, t);
    float borders = 1.0 - smoothstep(0.0, edgeWidth, edge);

    // Interior bands give "displacement wave" feel inside each cell
    float bandFreq = mix(3.0, 10.0, clamp(ripple / 3.0, 0.0, 1.0));
    float bands = 0.5 + 0.5 * sin((f1 * bandFreq - tt * (1.2 + 0.8 * e)) * TAU);
    bands = smoothstep(0.2, 0.95, bands);
    float interior = exp(-f1 * (2.2 + e * 1.8)) * (0.6 + 0.4 * bands);

    // Cheap emboss lighting based on nearest point vector
    vec2 dir = nearestDiff / max(1e-4, length(nearestDiff));
    vec3 normal = normalize(vec3(dir * (0.6 + 0.25 * strength), 1.0));
    vec3 lightDir = normalize(vec3(0.6, 0.4, 0.7));
    float ndl = clamp(dot(normal, lightDir), 0.0, 1.0);
    float spec = pow(ndl, 8.0) * (0.25 + 0.75 * t);

    // Color selection: stable per-cell hue + time drift
    float cid = hash(cellId);
    float hueBase = cid + time * 0.03 + f1 * 0.35 + b * 0.12;
    vec3 colA = palette(hueBase, theme);
    vec3 colB = palette(hueBase + 0.25 + edge * 0.9 + t * 0.1, theme);

    // Keep intensity comparable to other layers by avoiding large gain changes from other knobs.
    float pulse = 0.55 + 0.45 * b;

    vec3 color = vec3(0.0);
    color += colA * interior * (0.55 + 0.45 * ndl);
    color += colB * borders * (0.9 + 0.6 * e);
    color += (colA + colB) * spec * 0.6;

    // Subtle vignette so it doesn't read flat across the full screen
    float vign = 1.0 - smoothstep(0.35, 1.65, rad);
    color *= vign;

    // Similar overall gain to Kaleidoscope/other additive layers.
    float scaleOut = intensity * 2.4;
    return color * pulse * scaleOut;
}
