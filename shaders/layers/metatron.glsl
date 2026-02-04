




// ============================================================================
// LAYER: Metatron's Cube
// Sacred geometry with nested rings
// OPTIMIZED: Quality-based ring reduction, reduced FBM octaves
// ============================================================================

float metaNoise(vec2 p) {

    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float metaFbm(vec2 p, float qualityLevel) {
    // Quality-based octave reduction
    float q = clamp(qualityLevel, 0.0, 1.0);
    int maxOctaves = int(mix(1.0, 3.0, smoothstep(0.2, 0.8, q)) + 0.5);

    float f = 0.0;
    float a = 0.55;
    for (int i = 0; i < 3; i++) {
        if (i >= maxOctaves) break;
        f += a * metaNoise(p);
        p = p * 2.02 + vec2(13.7, 9.2);
        a *= 0.5;
    }
    return f;
}

vec2 metaRot(vec2 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * p;
}


vec2 metaSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float denom = max(1e-4, dot(ba, ba));
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
    float d = length(pa - ba * h);
    return vec2(d, h);
}

vec2 metaHexDir(int i) {


    if (i == 0) return vec2(1.0, 0.0);
    if (i == 1) return vec2(0.5, 0.86602540378);
    if (i == 2) return vec2(-0.5, 0.86602540378);
    if (i == 3) return vec2(-1.0, 0.0);
    if (i == 4) return vec2(-0.5, -0.86602540378);
    return vec2(0.5, -0.86602540378);
}

vec2 metaWarp(vec2 p, float time, float beat, float energy, float detail) {

    float r = length(p);
    float ang = atan(p.y, p.x);
    vec2 dir = p / max(1e-4, r);

    float k = (0.010 + 0.020 * energy) * smoothstep(0.15, 1.65, r);
    float wob = sin(ang * 6.0 + time * (0.35 + 0.45 * energy) + sin(r * 2.2 - time * 0.25));
    p += dir * wob * k;

    float twist = (0.035 + 0.060 * energy) * (0.18 + 0.82 * beat) * sin(r * 1.7 - time * 0.30 + detail * 0.7);
    p = metaRot(p, twist);

    return p;
}

vec3 metaStrokeColor(float d, float w, vec3 coreCol, vec3 glowCol, float tex, float boost) {
    float core = smoothstep(w, 0.0, d);
    float glow = smoothstep(w * 5.0, 0.0, d);
    float halo = smoothstep(w * 14.0, 0.0, d);

    vec3 col = coreCol * core;
    col += glowCol * glow * (0.30 + 0.55 * tex) * boost;
    col += glowCol * halo * (0.05 + 0.08 * tex) * boost;
    return col;
}

vec3 metaDrawCircle(vec2 p, vec2 center, float radius, float w, float time, float beat, float energy, vec3 coreCol, vec3 accentCol, float seed, float tex) {
    vec2 qv = p - center;
    float rr = length(qv);
    float d = abs(rr - radius);

    float ang = atan(qv.y, qv.x);
    float arc = 0.5 + 0.5 * sin(ang * 6.0 + time * (0.70 + 0.65 * energy) + seed * TAU);
    arc = pow(arc, 5.0);
    float arcMod = 0.76 + 0.24 * arc;

    float t = 0.75 + 0.25 * sin(time * (0.95 + 0.10 * seed) + tex * TAU + seed * 9.7);

    vec3 glowCol = mix(coreCol, accentCol, 0.35 + 0.25 * energy);

    glowCol = mix(glowCol, vec3(1.0), 0.06 + 0.14 * energy);

    vec3 col = metaStrokeColor(d, w, coreCol, glowCol, t, 1.0) * arcMod;


    float node = smoothstep(w * 10.0, 0.0, rr);
    col += glowCol * node * (0.06 + 0.22 * beat);

    return col;
}

vec3 metaDrawLine(vec2 p, vec2 a, vec2 b, float w, float time, float beat, float energy, vec3 colA, vec3 colB, vec3 accentCol, float seed, float tex, float qualityLevel) {
    vec2 seg = metaSeg(p, a, b);
    float d = seg.x;
    float u = seg.y;

    float t = 0.72 + 0.28 * sin(time * (1.05 + 0.12 * seed) + tex * TAU + seed * 7.3);

    vec3 coreCol = mix(colA, colB, u);
    vec3 glowCol = mix(coreCol, accentCol, 0.35 + 0.25 * energy);
    glowCol = mix(glowCol, vec3(1.0), 0.05 + 0.15 * energy);

    float boost = 0.90 + 0.80 * energy;
    vec3 col = metaStrokeColor(d, w, coreCol, glowCol, t, boost);


    // Skip expensive spark calculations on low quality
    if (qualityLevel >= 0.3) {
        float freq = 2.0 + 6.0 * energy;
        float speed = 0.35 + 0.90 * energy;
        float x = fract(u * freq - time * speed + seed);
        float spark = smoothstep(0.10, 0.0, abs(x - 0.5));
        spark *= smoothstep(w * 9.0, 0.0, d);
        col += glowCol * spark * (0.12 + 0.60 * beat);
    }


    float dash = 0.5 + 0.5 * sin((u * (8.0 + 10.0 * energy) + seed) * TAU);
    dash = smoothstep(0.25, 0.90, dash);
    col *= 0.82 + 0.18 * dash;

    return col;
}

vec3 layerMetatron(vec2 uv, float time, float beat, float energy, float intensity, float theme, float rings, float thickness, float spin) {
    if (intensity <= 0.0) return vec3(0.0);

    float b = clamp(beat, 0.0, 1.0);
    float e = clamp(energy, 0.0, 1.0);
    
    // Quality-based ring reduction: fewer rings on low quality
    float q = clamp(uQualityLevel, 0.0, 1.0);
    float effectiveRings = mix(rings * 0.5, rings, smoothstep(0.3, 0.7, q));
    int detail = int(clamp(floor(effectiveRings + 0.5), 1.0, 10.0));


    float scale = 2.5;
    vec2 p = metaRot(uv * scale, time * spin);
    p = metaWarp(p, time, b, e, float(detail));


    float base = 0.4;
    float spacing = base;
    float radius = base * (1.0 + b * 0.15);
    float wLine = thickness * (1.0 + e * 0.35);
    float wCircle = thickness * 1.15 * (1.0 + b * 0.35);


    float tex = metaFbm(p * (4.5 + 4.0 * e) + vec2(time * 0.12, -time * 0.10), q);

    float hueBase = 0.52 + time * 0.02 + b * 0.10;

    vec3 accentCol = palette(hueBase + 0.18 + time * 0.01, theme);
    accentCol = mix(accentCol, vec3(1.0), 0.06 + 0.12 * e);
    vec3 colCenter = palette(hueBase, theme);
    vec3 colR1A = palette(hueBase + 0.10, theme);
    vec3 colR1B = palette(hueBase + 0.45, theme);
    vec3 colR2A = palette(hueBase + 0.35, theme);
    vec3 colR2B = palette(hueBase + 0.80, theme);

    vec3 col = vec3(0.0);



    float centerPulse = 1.0 + 0.06 * sin(time * 2.0);
    col += metaDrawCircle(p, vec2(0.0), radius * centerPulse, wCircle, time, b, e, colCenter, accentCol, 0.01, tex);


    for (int i = 0; i < 6; i++) {
        vec2 c1 = metaHexDir(i) * spacing;
        float t1 = float(i) / 5.0;
        vec3 cCol = mix(colR1A, colR1B, t1);
        col += metaDrawCircle(p, c1, radius, wCircle, time, b, e, cCol, accentCol, 0.11 + float(i) * 0.17, tex);
    }


    if (detail >= 2) {
        for (int i = 0; i < 6; i++) {
            vec2 c2 = metaHexDir(i) * (spacing * 2.0);
            float t2 = float(i) / 5.0;
            vec3 cCol = mix(colR2A, colR2B, t2);
            col += metaDrawCircle(p, c2, radius, wCircle, time, b, e, cCol, accentCol, 0.41 + float(i) * 0.13, tex);
        }
    }


    if (detail >= 3) {
        for (int i = 0; i < 6; i++) {
            int j = (i == 5) ? 0 : (i + 1);
            vec2 c3 = (metaHexDir(i) + metaHexDir(j)) * spacing;
            float t3 = float(i) / 5.0;
            vec3 cCol = mix(colR1B, colR2A, 0.35 + 0.25 * t3);
            col += metaDrawCircle(p, c3, radius, wCircle, time, b, e, cCol, accentCol, 0.77 + float(i) * 0.09, tex);
        }
    }




    for (int i = 0; i < 6; i++) {
        vec2 b1 = metaHexDir(i) * spacing;
        float t1 = float(i) / 5.0;
        vec3 c1 = mix(colR1A, colR1B, t1);
        col += metaDrawLine(p, vec2(0.0), b1, wLine, time, b, e, colCenter, c1, accentCol, 0.23 + float(i) * 0.11, tex, q);
    }

    if (detail >= 2) {

        for (int i = 0; i < 6; i++) {
            int j = (i == 5) ? 0 : (i + 1);
            vec2 a1 = metaHexDir(i) * spacing;
            vec2 b1 = metaHexDir(j) * spacing;
            vec2 a2 = metaHexDir(i) * (spacing * 2.0);
            vec2 b2 = metaHexDir(j) * (spacing * 2.0);

            float ti = float(i) / 5.0;
            float tj = float(j) / 5.0;
            vec3 cA1 = mix(colR1A, colR1B, ti);
            vec3 cB1 = mix(colR1A, colR1B, tj);
            vec3 cA2 = mix(colR2A, colR2B, ti);
            vec3 cB2 = mix(colR2A, colR2B, tj);

            col += metaDrawLine(p, a1, b1, wLine, time, b, e, cA1, cB1, accentCol, 0.51 + float(i) * 0.07, tex, q);
            col += metaDrawLine(p, a1, a2, wLine, time, b, e, cA1, cA2, accentCol, 0.61 + float(i) * 0.08, tex, q);
            col += metaDrawLine(p, a2, b2, wLine, time, b, e, cA2, cB2, accentCol, 0.71 + float(i) * 0.09, tex, q);
        }
    }

    if (detail >= 4) {

        for (int k = 0; k < 3; k++) {
            int i0 = k * 2;
            int i1 = ((k == 2) ? 0 : (k + 1)) * 2;
            vec2 a1 = metaHexDir(i0) * spacing;
            vec2 b1 = metaHexDir(i1) * spacing;
            vec2 a2 = metaHexDir(i0) * (spacing * 2.0);
            vec2 b2 = metaHexDir(i1) * (spacing * 2.0);
            float t0 = float(i0) / 5.0;
            float t1 = float(i1) / 5.0;
            vec3 cA1 = mix(colR1A, colR1B, t0);
            vec3 cB1 = mix(colR1A, colR1B, t1);
            vec3 cA2 = mix(colR2A, colR2B, t0);
            vec3 cB2 = mix(colR2A, colR2B, t1);
            col += metaDrawLine(p, a1, b1, wLine, time, b, e, cA1, cB1, accentCol, 1.07 + float(k) * 0.19, tex, q);
            col += metaDrawLine(p, a2, b2, wLine, time, b, e, cA2, cB2, accentCol, 1.17 + float(k) * 0.21, tex, q);

            int j0 = k * 2 + 1;
            int j1 = ((k == 2) ? 0 : (k + 1)) * 2 + 1;
            vec2 c1 = metaHexDir(j0) * spacing;
            vec2 d1 = metaHexDir(j1) * spacing;
            vec2 c2 = metaHexDir(j0) * (spacing * 2.0);
            vec2 d2 = metaHexDir(j1) * (spacing * 2.0);
            float u0 = float(j0) / 5.0;
            float u1 = float(j1) / 5.0;
            vec3 dA1 = mix(colR1A, colR1B, u0);
            vec3 dB1 = mix(colR1A, colR1B, u1);
            vec3 dA2 = mix(colR2A, colR2B, u0);
            vec3 dB2 = mix(colR2A, colR2B, u1);
            col += metaDrawLine(p, c1, d1, wLine, time, b, e, dA1, dB1, accentCol, 1.27 + float(k) * 0.23, tex, q);
            col += metaDrawLine(p, c2, d2, wLine, time, b, e, dA2, dB2, accentCol, 1.37 + float(k) * 0.25, tex, q);
        }
    }

    if (detail >= 6) {

        for (int i = 0; i < 6; i++) {
            int j2 = i + 2;
            if (j2 >= 6) j2 -= 6;
            int j4 = i + 4;
            if (j4 >= 6) j4 -= 6;

            vec2 a1 = metaHexDir(i) * spacing;
            vec2 b2 = metaHexDir(j2) * (spacing * 2.0);
            vec2 c2 = metaHexDir(j4) * (spacing * 2.0);

            float ti = float(i) / 5.0;
            float t2 = float(j2) / 5.0;
            float t4 = float(j4) / 5.0;
            vec3 cA = mix(colR1A, colR1B, ti);
            vec3 cB = mix(colR2A, colR2B, t2);
            vec3 cC = mix(colR2A, colR2B, t4);

            col += metaDrawLine(p, a1, b2, wLine, time, b, e, cA, cB, accentCol, 1.77 + float(i) * 0.11, tex, q);
            col += metaDrawLine(p, a1, c2, wLine, time, b, e, cA, cC, accentCol, 1.89 + float(i) * 0.10, tex, q);
        }
    }

    if (detail >= 7) {

        for (int i = 0; i < 6; i++) {
            vec2 a2 = metaHexDir(i) * (spacing * 2.0);
            float t2 = float(i) / 5.0;
            vec3 c2 = mix(colR2A, colR2B, t2);
            col += metaDrawLine(p, vec2(0.0), a2, wLine, time, b, e, colCenter, c2, accentCol, 2.17 + float(i) * 0.12, tex, q);
        }
    }

    if (detail >= 8) {

        for (int i = 0; i < 3; i++) {
            int j = i + 3;
            vec2 a1 = metaHexDir(i) * spacing;
            vec2 b1 = metaHexDir(j) * spacing;
            vec2 a2 = metaHexDir(i) * (spacing * 2.0);
            vec2 b2 = metaHexDir(j) * (spacing * 2.0);

            float ti = float(i) / 5.0;
            float tj = float(j) / 5.0;
            vec3 cA1 = mix(colR1A, colR1B, ti);
            vec3 cB1 = mix(colR1A, colR1B, tj);
            vec3 cA2 = mix(colR2A, colR2B, ti);
            vec3 cB2 = mix(colR2A, colR2B, tj);

            col += metaDrawLine(p, a1, b1, wLine, time, b, e, cA1, cB1, accentCol, 2.47 + float(i) * 0.13, tex, q);
            col += metaDrawLine(p, a2, b2, wLine, time, b, e, cA2, cB2, accentCol, 2.67 + float(i) * 0.14, tex, q);
        }
    }


    float pr = length(p);
    float vign = 1.0 - smoothstep(1.25, 2.25, pr);
    col *= vign;


    float gain = intensity * (2.6 + 0.4 * e);
    return col * gain;
}
