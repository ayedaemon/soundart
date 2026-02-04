








// ============================================================================
// LAYER: Hopalong Orbits
// Barry Martin attractor with kaleidoscope splits
// OPTIMIZED: Quality-based scaling, reduced orbits/iterations, skipped expensive effects
// ============================================================================

float hopSegDist2(vec2 p, vec2 a, vec2 b) {

    vec2 pa = p - a;
    vec2 ba = b - a;
    float denom = max(1e-6, dot(ba, ba));
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
    vec2 v = pa - ba * h;
    return dot(v, v);
}


vec2 hopKaleidoscope(vec2 uv, float slices, float rotation) {
    if (slices <= 1.0) return uv;
    
    float angle = atan(uv.y, uv.x) + rotation * TAU;
    float radius = length(uv);
    float slice = TAU / max(2.0, slices);
    

    angle = mod(angle, slice);
    angle = abs(angle - slice * 0.5);
    
    return vec2(cos(angle), sin(angle)) * radius;
}

vec3 layerHopalong(
    vec2 uv, 
    float time, 
    float beat, 
    float energy,
    float treble,
    float intensity, 
    float theme,
    float divergence,
    float iterations,
    float slices,
    float rotation
) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Quality-based optimizations
    float q = clamp(uQualityLevel, 0.0, 1.0);
    
    // Quality-based orbit reduction: Low quality uses fewer orbits
    // Low (0.0-0.3): 2 orbits, Medium (0.3-0.7): 3 orbits, High (0.7-1.0): 4 orbits
    int maxOrbits = int(mix(2.0, 4.0, smoothstep(0.3, 0.7, q)) + 0.5);
    
    float b0 = clamp(beat, 0.0, 1.0);
    float e0 = clamp(energy, 0.0, 1.0);
    float t0 = clamp(treble, 0.0, 1.0);


    float dynamicRotation = rotation + time * rotation * 0.1 + b0 * 0.02;
    

    float dynamicSlices = slices + floor(t0 * 2.0);
    

    vec2 uvKaleid = hopKaleidoscope(uv, dynamicSlices, dynamicRotation);
    

    vec2 uvDraw = abs(uvKaleid);


    float morph = 0.5 + 0.5 * sin(time * (0.055 + 0.06 * e0));
    float a1 = 1.4 + 0.8 * sin(time * 0.023);
    float b1 = 2.3 + 0.5 * cos(time * 0.031);
    float c1 = 2.4 + 0.6 * sin(time * 0.017);

    float a2 = 1.25 + 0.95 * sin(time * 0.019 + 1.3);
    float b2 = 2.05 + 0.85 * cos(time * 0.027 + 2.1);
    float c2 = 2.15 + 0.90 * sin(time * 0.013 + 3.4);

    float a = mix(a1, a2, morph);
    float b = mix(b1, b2, morph);
    float c = mix(c1, c2, morph);


    a += b0 * 0.22 + e0 * 0.12;
    b += e0 * 0.28 - b0 * 0.06;
    
    vec3 color = vec3(0.0);


    float divN = clamp(divergence / 5.0, 0.0, 1.0);
    float wCore = 0.0035 + 0.0045 * e0 + 0.0025 * b0;
    wCore *= 0.85 + 0.40 * sqrt(divN);
    wCore = clamp(wCore, 0.0012, 0.018);

    float wHalo = wCore * (3.2 + 1.0 * e0);
    float invCore = 1.0 / max(1e-6, wCore * wCore);
    float invHalo = 1.0 / max(1e-6, wHalo * wHalo);
    
    // Quality flags for skipping expensive effects
    bool skipBeads = q < 0.4;
    bool skipSides = q < 0.3;
    bool skipSparks = q < 0.5;

    for (int orbit = 0; orbit < 4; orbit++) {
        if (orbit >= maxOrbits) break;
        float o = float(orbit);
        float oSeed = hash(vec2(o + 1.0, 7.7));


        float aO = a + o * 0.12 + (oSeed - 0.5) * 0.10;
        float bO = b + o * 0.06 + (hash(vec2(o + 3.0, 2.1)) - 0.5) * 0.08;
        float cO = c + o * 0.10 + (hash(vec2(o + 5.0, 4.2)) - 0.5) * 0.12;
        

        float px = 0.08 + o * 0.04 + (oSeed - 0.5) * 0.06;
        float py = 0.00 + o * 0.02 + (hash(vec2(o + 9.0, 1.9)) - 0.5) * 0.05;
        

        // Quality-based warmup reduction: fewer iterations on low quality
        int warmupIter = int(mix(15.0, 30.0, smoothstep(0.2, 0.8, q)) + 0.5);
        for (int i = 0; i < 30; i++) {
            if (i >= warmupIter) break;
            float signX = (px >= 0.0) ? 1.0 : -1.0;
            float newX = py - signX * sqrt(abs(bO * px - cO));
            float newY = aO - px;
            px = newX;
            py = newY;
        }



        vec2 center = vec2(0.0);
        // Quality-based center samples reduction: fewer samples on low quality
        int centerSamples = int(mix(9.0, 18.0, smoothstep(0.2, 0.8, q)) + 0.5);
        for (int i = 0; i < 18; i++) {
            if (i >= centerSamples) break;
            float signX = (px >= 0.0) ? 1.0 : -1.0;
            float newX = py - signX * sqrt(abs(bO * px - cO));
            float newY = aO - px;
            px = newX;
            py = newY;
            center += vec2(px, py);
        }
        center /= float(centerSamples);
        

        float hue0 = 0.12 + time * 0.014 + o * 0.23 + morph * 0.10 + b0 * 0.08;
        vec3 cA = palette(hue0, theme);
        vec3 cB = palette(hue0 + 0.30 + e0 * 0.10, theme);


        // Quality-based iteration reduction: scale iterations based on quality
        // Low quality: ~50% iterations, Medium: ~75%, High: 100%
        float effectiveIterations = mix(iterations * 0.5, iterations, smoothstep(0.3, 0.8, q));
        int maxIter = int(effectiveIterations + 0.5);
        if (maxIter < 10) maxIter = 10;
        if (maxIter > 200) maxIter = 200;
        float invMax = 1.0 / float(maxIter);


        float breathe = 0.92 + 0.08 * sin(time * 0.17 + o * 1.7) + 0.06 * e0;
        float scale = 0.04 * divergence * breathe;


        vec2 prevP = (vec2(px, py) - center) * scale;

        float w = 1.0;
        float iterN = float(maxIter) / 200.0;
        float decay = mix(0.995, 0.982, iterN);


        vec2 prevDir = vec2(1.0, 0.0);
        float hasPrev = 0.0;

        for (int i = 0; i < 200; i++) {
            if (i >= maxIter) break;


            float signX = (px >= 0.0) ? 1.0 : -1.0;
            float newX = py - signX * sqrt(abs(bO * px - cO));
            float newY = aO - px;
            px = newX;
            py = newY;

            vec2 p2 = (vec2(px, py) - center) * scale;


            vec2 prevDraw = abs(prevP);
            vec2 p2Draw = abs(p2);


            vec2 segV = p2Draw - prevDraw;
            float segLen = length(segV);
            vec2 segDir = segV / max(1e-4, segLen);
            vec2 segN = vec2(-segDir.y, segDir.x);
            float curv = (1.0 - abs(dot(prevDir, segDir))) * hasPrev;
            prevDir = segDir;
            hasPrev = 1.0;


            float dens = clamp(wCore / max(1e-4, segLen), 0.0, 4.0);
            dens = smoothstep(0.0, 4.0, dens);

            float feat = clamp(0.25 + 1.35 * curv + 0.85 * dens, 0.0, 2.0);



            float off = wCore * (0.9 + 2.4 * t0) * (0.25 + 0.65 * feat);
            off = min(off, wCore * 6.0);

            float d0 = hopSegDist2(uvDraw, prevDraw, p2Draw);
            float core0 = exp(-d0 * invCore);
            float halo0 = exp(-d0 * invHalo);
            
            // Skip expensive side calculations on low quality
            float core1 = 0.0;
            float core2 = 0.0;
            if (!skipSides) {
                float d1 = hopSegDist2(uvDraw, prevDraw + segN * off, p2Draw + segN * off);
                float d2 = hopSegDist2(uvDraw, prevDraw - segN * off, p2Draw - segN * off);
                float sideMul = mix(0.55, 0.85, t0);
                core1 = exp(-d1 * invCore * sideMul);
                core2 = exp(-d2 * invCore * sideMul);
            }


            // Skip expensive spark calculations on low quality
            float spark = 0.0;
            if (!skipSparks) {
                float sparkSeed = hash(vec2(oSeed, float(i)));
                float tw = 0.5 + 0.5 * sin(time * (0.8 + 2.2 * t0) + sparkSeed * TAU);
                spark = smoothstep(0.985, 1.0, sparkSeed) * pow(tw, 6.0) * smoothstep(0.6, 1.0, t0);
            }

            float tt = float(i) * invMax;
            vec3 cMix = mix(cA, cB, tt);

            vec3 cPrism = mix(cMix, cMix.bgr, 0.14 + 0.10 * t0);
            vec3 cS1 = mix(cPrism, cA, 0.25);
            vec3 cS2 = mix(cPrism, cB, 0.25);

            cMix = mix(cMix, vec3(1.0), 0.03 + 0.08 * t0 + 0.06 * spark);
            cS1 = mix(cS1, vec3(1.0), 0.02 + 0.06 * t0);
            cS2 = mix(cS2, vec3(1.0), 0.03 + 0.07 * t0);


            float freq = 0.55 + 2.8 * t0 + 0.8 * b0;
            float band = abs(fract(tt * freq + oSeed * 1.7 + morph * 0.3) - 0.5) * 2.0;
            float dash = 0.78 + 0.22 * (1.0 - smoothstep(0.25, 0.90, band));

            float main = core0 * (1.0 + 0.45 * spark) + halo0 * (0.24 + 0.26 * e0);
            float mainGain = (0.12 + 0.07 * e0) * (0.72 + 0.68 * feat) * dash;
            float sideGain = (0.040 + 0.040 * t0) * (0.45 + 0.70 * feat) * dash;

            color += cMix * main * w * mainGain;
            
            // Skip side segments on low quality
            if (!skipSides) {
                color += cS1 * core1 * w * sideGain;
                color += cS2 * core2 * w * sideGain;
            }


            // Skip expensive bead calculations on low quality
            if (!skipBeads) {
                vec2 dp = uvDraw - p2Draw;
                float bead = exp(-dot(dp, dp) * invCore * (3.5 + 9.0 * t0));
                float beadAmt = (0.006 + 0.030 * t0) * (0.20 + 0.90 * curv) * (0.55 + 0.55 * b0) * dash;
                color += mix(cMix, vec3(1.0), 0.22) * bead * w * beadAmt;
            }

            w *= decay;
            // Early termination: exit if weight is too low or contribution negligible
            if (w < 0.02) break;
            // Early exit on low quality if contribution is minimal
            if (q < 0.4 && w < 0.1 && length(color) < 0.01) break;
            prevP = p2;
        }
    }
    

    float pulse = 0.75 + 0.35 * pow(b0, 1.2);

    float gainByDiv = mix(2.15, 1.55, divN);
    float scaleOut = intensity * gainByDiv;
    return color * pulse * scaleOut;
}
