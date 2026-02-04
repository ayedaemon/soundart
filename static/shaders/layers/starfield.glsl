




// ============================================================================
// LAYER: Starfield
// Warp tunnel streaks with multiple depth layers
// OPTIMIZED: Quality-based layer reduction, reduced noise octaves, skipped expensive effects
// ============================================================================

vec2 sfHash2(vec2 p) {
    return vec2(
        hash(p),
        hash(p + vec2(17.17, 43.43))
    );
}

float sfNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float sfFbm(vec2 p, float qualityLevel) {
    // Quality-based octave reduction: fewer octaves on low quality
    float q = clamp(qualityLevel, 0.0, 1.0);
    int maxOctaves = int(mix(1.0, 3.0, smoothstep(0.2, 0.8, q)) + 0.5);
    
    float f = 0.0;
    float a = 0.55;
    for (int i = 0; i < 3; i++) {
        if (i >= maxOctaves) break;
        f += a * sfNoise(p);
        p = p * 2.02 + vec2(11.3, 7.7);
        a *= 0.5;
    }
    return f;
}

vec3 layerStarfield(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float density, float warp, float layers) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Quality-based optimizations
    float q = clamp(uQualityLevel, 0.0, 1.0);
    
    float b = clamp(beat, 0.0, 1.0);
    float e = clamp(energy, 0.0, 1.0);
    float t = clamp(treble, 0.0, 1.0);

    float densN = clamp(density / 3.0, 0.0, 1.0);
    float warpN = clamp((warp - 0.1) / 4.9, 0.0, 1.0);

    // Quality-based layer reduction: scale layers based on quality
    // Low (0.0-0.3): ~40% layers, Medium (0.3-0.7): ~70% layers, High (0.7-1.0): 100% layers
    float effectiveLayers = mix(layers * 0.4, layers, smoothstep(0.3, 0.7, q));
    int numLayers = int(effectiveLayers + 0.5);
    if (numLayers < 1) numLayers = 1;
    if (numLayers > 8) numLayers = 8;
    
    // Quality flags for skipping expensive effects
    bool skipTails = q < 0.4;
    bool skipTwinkle = q < 0.3;
    
    float r = length(uv);
    vec2 dir = uv / max(1e-4, r);


    vec2 nuv = uv;
    float bgAng = 0.25 * warpN + 0.08 * sin(time * 0.07);
    float cs = cos(bgAng);
    float sn = sin(bgAng);
    nuv = mat2(cs, -sn, sn, cs) * nuv;

    float bgN = sfFbm(nuv * (1.4 + 2.2 * densN) + vec2(time * 0.05, -time * 0.03), q);
    float neb = smoothstep(0.25, 0.85, bgN);
    neb *= exp(-r * (1.05 - 0.35 * warpN));
    neb *= 0.06 + 0.22 * e + 0.10 * b;

    vec3 bgColA = palette(time * 0.02, theme);
    vec3 bgColB = palette(time * 0.04 + 0.35, theme);
    vec3 nebCol = mix(bgColA, bgColB, 0.5);
    nebCol = mix(vec3(0.0), nebCol, 0.55);


    vec3 palA = palette(time * 0.05, theme);
    vec3 palB = palette(time * 0.09 + 0.4, theme);

    vec3 stars = vec3(0.0);


    for (int layer = 0; layer < 8; layer++) {
        if (layer >= numLayers) break;

        float layerId = float(layer) + 1.0;
        float layerRand = hash(vec2(layerId, 7.17));


        float speed = (0.22 + 0.55 * b + 0.85 * e) * mix(0.85, 1.25, layerRand);


        float z = fract(layerId * 0.173 - time * speed);
        float closeness = 1.0 - z;


        float denom = 0.18 + z * mix(2.35, 0.85, warpN);
        vec2 tuv = uv / denom;


        float twist = (0.10 + 0.65 * warpN) * (0.15 + 0.85 * e);
        float ang = time * 0.18 * twist + (closeness - 0.5) * 1.35 * twist + layerId;
        float c = cos(ang);
        float s = sin(ang);
        tuv = mat2(c, -s, s, c) * tuv;


        tuv += (closeness - 0.5) * 0.08 * vec2(
            sin(time * 0.17 + layerId * 2.1),
            cos(time * 0.13 - layerId * 1.7)
        ) * (0.35 + 0.65 * e);


        float grid = max(2.0, 15.0 * density);
        vec2 cell = floor(tuv * grid);
        vec2 f = fract(tuv * grid) - 0.5;


        vec2 seed = vec2(layerId * 13.13, layerId * 7.77);
        vec2 h2 = sfHash2(cell + seed);
        vec2 offset = (h2 - 0.5) * 0.92;

        vec2 dv = f - offset;
        float d2 = dot(dv, dv);

        float h = hash(cell + vec2(7.13, 3.71) + seed);
        float th = mix(0.86, 0.94, densN);
        float common = smoothstep(th, 1.0, h);
        float rare = smoothstep(0.985, 1.0, h);
        float presence = clamp(common + rare * 2.0, 0.0, 2.5);

        float size = mix(0.006, 0.060, pow(closeness, 1.7));
        size *= mix(0.75, 1.35, hash(cell + vec2(1.9, 8.4) + seed));
        float invS2 = 1.0 / max(1e-5, size * size);


        float core = exp(-d2 * invS2 * 2.2);
        
        // Skip expensive twinkle calculation on low quality
        float tw = 1.0;
        if (!skipTwinkle) {
            tw = 0.5 + 0.5 * sin(time * (2.2 + 7.0 * t) + h * TAU + layerId * 1.7);
            tw = mix(0.7, 1.35, tw * tw);
        }

        // Skip expensive tail calculations on low quality
        float tail = 0.0;
        if (!skipTails) {
            vec2 vdir = tuv / max(1e-4, length(tuv));
            vdir = mix(dir, vdir, step(0.04, length(tuv)));
            vec2 ortho = vec2(-vdir.y, vdir.x);
            float along = dot(dv, vdir);
            float perp = dot(dv, ortho);

            float tailLen = (0.08 + 0.35 * warpN) * (0.25 + 0.75 * pow(closeness, 1.6)) * (0.7 + 0.9 * b + 0.6 * e);
            float tailMask = step(0.0, -along) * (1.0 - smoothstep(0.0, tailLen, -along));
            float tailSharp = 90.0 + 180.0 * warpN;
            tail = exp(-perp * perp * tailSharp) * tailMask;
        }

        float depthGain = pow(closeness, 2.25);
        float star = (core * (0.8 + 0.6 * tw) + tail * (0.35 + 1.4 * warpN) * (0.6 + 0.4 * tw)) * depthGain * presence;


        float hueMix = fract(h * 1.7 + layerId * 0.11);
        vec3 baseCol = mix(palA, palB, hueMix);
        float tint = mix(0.60, 0.38, rare);
        vec3 scol = mix(vec3(1.0), baseCol, tint);
        scol = mix(scol, vec3(0.75, 0.85, 1.0), (1.0 - closeness) * 0.12);

        stars += scol * star;
    }


    float norm = 1.0 / (1.0 + 0.25 * float(numLayers) * densN);
    stars *= norm;

    vec3 color = nebCol * neb + stars;

    float pulse = (0.55 + 0.35 * b) * (0.75 + 0.55 * e);
    float scale = intensity * 2.6;
    return color * pulse * scale;
}
