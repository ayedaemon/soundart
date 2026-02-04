




// ============================================================================
// LAYER: Displacement
// Cellular displacement waves with Worley noise
// OPTIMIZED: Quality-based Worley cell reduction, reduced noise octaves
// ============================================================================

vec2 dispHash2(vec2 p) {

    return vec2(
        hash(p),
        hash(p + vec2(17.17, 43.43))
    );
}

float dispNoise(vec2 p) {

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
    in float qualityLevel,
    out float f1,
    out float f2,
    out vec2 cellId,
    out vec2 nearestDiff
) {
    // Quality-based cell reduction: check fewer neighbors on low quality
    float q = clamp(qualityLevel, 0.0, 1.0);
    int cellRange = int(mix(0.0, 1.0, smoothstep(0.2, 0.6, q)) + 0.5);
    
    vec2 i_st = floor(p);
    vec2 f_st = fract(p);

    float d1 = 1e9;
    float d2 = 1e9;
    vec2 bestCell = vec2(0.0);
    vec2 bestDiff = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            // Skip outer cells on low quality
            if (cellRange == 0 && (abs(float(i)) + abs(float(j))) > 1.0) continue;
            vec2 neighbor = vec2(float(i), float(j));
            vec2 cell = i_st + neighbor;


            vec2 rnd = dispHash2(cell);
            float h = hash(cell + vec2(1.7, 9.2));
            float sp = mix(0.35, 1.6, h);

            vec2 point = 0.5 + 0.5 * sin(TAU * rnd + (time * sp + h * TAU));


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

    // Quality-based optimizations
    float q = clamp(uQualityLevel, 0.0, 1.0);
    
    float e = clamp(energy, 0.0, 1.0);
    float b = clamp(beat, 0.0, 1.0);
    float t = clamp(treble, 0.0, 1.0);


    vec2 st = uv * 0.5 + 0.5;


    float scale = cellSize * (4.0 + e * 3.0);
    vec2 p = st * scale;


    float flowSpeed = (0.25 + 0.9 * e) * (0.6 + 0.4 * ripple);
    float tt = time * flowSpeed;

    float warpStrength = 0.35 * strength * (0.6 + 0.6 * b);


    float rad = length(uv);
    vec2 radDir = uv / max(1e-4, rad);
    float ripFreq = 3.0 + ripple * 2.5;
    float rip = sin(rad * ripFreq - time * (1.2 + 1.8 * e));
    p += radDir * rip * warpStrength * (0.25 + 0.25 * ripple);


    // Quality-based noise reduction: skip noise warp on very low quality
    if (q >= 0.2) {
        vec2 n = dispNoise2(p * 0.35 + vec2(0.0, tt * 0.35));
        vec2 warp = (n - 0.5) * 2.0;
        p += warp * warpStrength;
    }


    vec2 flow = vec2(
        sin(p.y * 0.85 + tt),
        cos(p.x * 0.75 - tt * 1.1)
    );
    p += flow * warpStrength * (0.6 + 0.4 * t);


    float f1, f2;
    vec2 cellId;
    vec2 nearestDiff;
    dispWorleyAnimated(p, time * (0.7 + ripple * 0.4), q, f1, f2, cellId, nearestDiff);


    float edge = max(0.0, f2 - f1);
    float edgeWidth = mix(0.065, 0.02, t);
    float borders = 1.0 - smoothstep(0.0, edgeWidth, edge);


    float bandFreq = mix(3.0, 10.0, clamp(ripple / 3.0, 0.0, 1.0));
    float bands = 0.5 + 0.5 * sin((f1 * bandFreq - tt * (1.2 + 0.8 * e)) * TAU);
    bands = smoothstep(0.2, 0.95, bands);
    float interior = exp(-f1 * (2.2 + e * 1.8)) * (0.6 + 0.4 * bands);


    // Skip expensive lighting calculations on low quality
    float ndl = 1.0;
    float spec = 0.0;
    if (q >= 0.3) {
        vec2 dir = nearestDiff / max(1e-4, length(nearestDiff));
        vec3 normal = normalize(vec3(dir * (0.6 + 0.25 * strength), 1.0));
        vec3 lightDir = normalize(vec3(0.6, 0.4, 0.7));
        ndl = clamp(dot(normal, lightDir), 0.0, 1.0);
        spec = pow(ndl, 8.0) * (0.25 + 0.75 * t);
    }


    float cid = hash(cellId);
    float hueBase = cid + time * 0.03 + f1 * 0.35 + b * 0.12;
    vec3 colA = palette(hueBase, theme);
    vec3 colB = palette(hueBase + 0.25 + edge * 0.9 + t * 0.1, theme);


    float pulse = 0.55 + 0.45 * b;

    vec3 color = vec3(0.0);
    color += colA * interior * (0.55 + 0.45 * ndl);
    color += colB * borders * (0.9 + 0.6 * e);
    color += (colA + colB) * spec * 0.6;


    float vign = 1.0 - smoothstep(0.35, 1.65, rad);
    color *= vign;


    float scaleOut = intensity * 2.4;
    return color * pulse * scaleOut;
}
