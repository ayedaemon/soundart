

// ============================================================================
// LAYER: Kaleidoscope
// Sacred geometry mirroring and mandala symmetry
// OPTIMIZED: Quality-based pattern reduction, reduced feedback sampling
// Now includes 3D raymarching IFS box pattern
// ============================================================================

// Map UVs into a kaleidoscope wedge
vec2 kaleidoscopeMap(vec2 uv, float slices) {
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float slice = TAU / max(1.0, slices);
    angle = mod(angle, slice);
    angle = abs(angle - slice * 0.5);
    angle = slice * 0.5 - angle;
    return vec2(cos(angle), sin(angle)) * radius;
}

// Generate symmetric line patterns
float kaleidoscopeLines(vec2 uv, float time, float treble, float distortion, float slices) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Distortion warps the coordinates (still symmetric because we're in folded space)
    float dist = sin(r * 10.0 - time) * distortion * 0.1;
    r += dist;
    angle += sin(r * 6.0 + time * 0.7) * distortion * 0.05;

    float s = max(2.0, slices);
    float spokeCount = 3.0 + s * 0.5;

    // Quality-based pattern reduction: fewer patterns on low quality
    float q = clamp(uQualityLevel, 0.0, 1.0);
    bool skipSecondaryPatterns = q < 0.4;
    
    // Multi-frequency symmetric structure (rings + spokes + lattices + rosettes)
    float ringsA = smoothstep(0.02, 0.0, abs(sin(r * 8.0 - time * 0.6)));
    float ringsB = skipSecondaryPatterns ? 0.0 : smoothstep(0.015, 0.0, abs(sin(r * (12.0 + s * 0.2) + time * 0.35)));
    float spokesA = smoothstep(0.02, 0.0, abs(sin(angle * spokeCount + time * 0.4)));
    float spokesB = skipSecondaryPatterns ? 0.0 : smoothstep(0.02, 0.0, abs(sin(angle * spokeCount * 2.0 - r * 6.0 + time * 0.9)));
    float latticeA = smoothstep(0.02, 0.0, abs(sin((uv.x + uv.y) * (6.0 + s * 0.2) - time * 0.2)));
    float latticeB = skipSecondaryPatterns ? 0.0 : smoothstep(0.02, 0.0, abs(sin((uv.x - uv.y) * (5.0 + s * 0.18) + time * 0.27)));
    float rosette = skipSecondaryPatterns ? 0.0 : smoothstep(0.02, 0.0, abs(sin(angle * s * 1.5 + r * 10.0 - time)));

    float pulse = 0.6 + 0.4 * sin(time * 0.6 + treble * TAU);

    float structure =
      ringsA * 0.35 +
      ringsB * 0.25 +
      spokesA * 0.35 +
      spokesB * 0.25 +
      latticeA * 0.30 +
      latticeB * 0.25 +
      rosette * 0.30;

    return clamp(structure * pulse, 0.0, 1.0);
}

// ============================================================================
// 3D Raymarching Functions
// ============================================================================

// Rotation matrix helper
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
}

// Polar modulo for kaleidoscope symmetry in 3D
vec2 pmod(vec2 p, float r) {
    float a = atan(p.x, p.y) + PI / r;
    float n = TAU / r;
    a = floor(a / n) * n;
    return p * rot(-a);
}

// Box SDF (Signed Distance Function)
float box(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

// Iterated Function System box
float ifsBox(vec3 p, float time, float beat, float energy) {
    // Quality-based iteration reduction
    float q = clamp(uQualityLevel, 0.0, 1.0);
    int maxIter = int(mix(3.0, 5.0, smoothstep(0.2, 0.8, q)) + 0.5);
    if (maxIter < 3) maxIter = 3;
    if (maxIter > 5) maxIter = 5;
    
    // Audio-reactive rotation speeds
    float rotSpeed1 = (0.3 + beat * 0.2) * time;
    float rotSpeed2 = (0.1 + energy * 0.1) * time;
    float rotSpeed3 = (1.0 + beat * 0.3) * time;
    
    for (int i = 0; i < 5; i++) {
        if (i >= maxIter) break;
        p = abs(p) - 1.0;
        p.xy *= rot(rotSpeed1);
        p.xz *= rot(rotSpeed2);
    }
    p.xz *= rot(rotSpeed3);
    return box(p, vec3(0.4, 0.8, 0.3));
}

// Map function with kaleidoscope symmetry
float map(vec3 p, vec3 cPos, float slices, float time, float beat, float energy) {
    vec3 p1 = p;
    p1.x = mod(p1.x - 5.0, 10.0) - 5.0;
    p1.y = mod(p1.y - 5.0, 10.0) - 5.0;
    p1.z = mod(p1.z, 16.0) - 8.0;
    // Apply kaleidoscope symmetry using pmod
    p1.xy = pmod(p1.xy, slices);
    return ifsBox(p1, time, beat, energy);
}

// 3D Raymarching function
vec3 kaleidoscopeRaymarch(vec2 uv, float time, float beat, float energy, float treble, float slices, float theme) {
    // Quality-based step reduction
    float q = clamp(uQualityLevel, 0.0, 1.0);
    int maxSteps = int(mix(15.0, 80.0, smoothstep(0.2, 0.8, q)) + 0.5);
    if (maxSteps < 15) maxSteps = 15;
    if (maxSteps > 99) maxSteps = 99;
    
    // Audio-reactive camera position
    float e = clamp(energy, 0.0, 1.0);
    vec3 cPos = vec3(0.0, 0.0, -3.0 * time + e * 0.5);
    vec3 cDir = normalize(vec3(0.0, 0.0, -1.0));
    vec3 cUp = vec3(sin(time), 1.0, 0.0);
    vec3 cSide = cross(cDir, cUp);
    
    // Convert 2D UV to 3D ray direction
    vec3 ray = normalize(cSide * uv.x + cUp * uv.y + cDir);
    
    // Phantom Mode raymarching
    float acc = 0.0;
    float acc2 = 0.0;
    float t = 0.0;
    
    // Audio-reactive step size
    float stepScale = 0.5 + treble * 0.2;
    
    for (int i = 0; i < 99; i++) {
        if (i >= maxSteps) break;
        
        vec3 pos = cPos + ray * t;
        float dist = map(pos, cPos, slices, time, beat, energy);
        dist = max(abs(dist), 0.02);
        float a = exp(-dist * 3.0);
        
        // Audio-reactive pulsing pattern
        if (mod(length(pos) + 24.0 * time, 30.0) < 3.0) {
            a *= 2.0;
            acc2 += a;
        }
        acc += a;
        t += dist * stepScale;
    }
    
    // Map accumulation to color using theme palette
    float colorT = acc * 0.1 + time * 0.05;
    vec3 col = palette(colorT, theme);
    
    // Add accent color from acc2
    vec3 accentCol = palette(colorT + 0.3, theme);
    col = mix(col, accentCol, acc2 * 0.002);
    
    // Scale and apply audio reactivity
    float brightness = 0.01 + beat * 0.005;
    return col * acc * brightness;
}

vec3 layerKaleidoscope(vec2 uv, float time, float beat, float energy, float treble, float intensity, float theme, float slices, float feedback, float distortion, float raymarchMode, sampler2D feedbackTex) {
    if (intensity <= 0.0) return vec3(0.0);

    float tr = clamp(treble, 0.0, 1.0);
    float rm = clamp(raymarchMode, 0.0, 1.0);

    // Audio reactivity adds to slices
    float finalSlices = slices + floor(tr * 4.0);
    
    vec2 kUv = kaleidoscopeMap(uv, finalSlices);
    
    float lines;
    vec2 kUv2;
    
    // Quality-based complexity scaling
    if (uQualityLevel < 0.3) {
        // LOW QUALITY: Single pass, no nested fold
        kUv2 = kUv; // Fallback
        lines = kaleidoscopeLines(kUv, time, tr, distortion, finalSlices);
    } else if (uQualityLevel < 0.7) {
        // MEDIUM QUALITY: Nested fold but simpler calculation
        kUv2 = kaleidoscopeMap(kUv * 1.35, max(3.0, finalSlices * 0.5 + 3.0));
        lines = kaleidoscopeLines(kUv, time, tr, distortion, finalSlices) * 0.7 +
                kaleidoscopeLines(kUv2, -time * 0.7, tr, 0.0, finalSlices) * 0.3;
    } else {
        // HIGH QUALITY: Full implementation
        // Nested kaleidoscope fold adds symmetric complexity without extra params
        kUv2 = kaleidoscopeMap(kUv * 1.35, max(3.0, finalSlices * 0.5 + 3.0));
        float linesA = kaleidoscopeLines(kUv, time, tr, distortion, finalSlices);
        float linesB = kaleidoscopeLines(kUv2, -time * 0.7, tr, distortion * 0.75, finalSlices + 4.0);
        lines = clamp(linesA * 0.65 + linesB * 0.65, 0.0, 1.0);
    }

    // Feedback sampling
    // We sample the feedback texture using the kaleidoscoped UVs
    vec2 sampleUv = mix(kUv, kUv2, 0.35 + 0.25 * tr);
    vec2 rdUv = fract(sampleUv * 0.5 + 0.5); // Map to 0-1 range
    
    // Skip feedback sampling on low quality if feedback is low
    vec3 rd = vec3(0.0);
    if (uQualityLevel >= 0.3 || feedback > 0.0) {
        rd = texture2D(feedbackTex, rdUv).rgb;
    }
    
    // Use feedback green channel for organic pattern
    float organic = smoothstep(0.18, 0.75, rd.g);

    // Stronger, more readable web so it survives bright additive mixes.
    float linesSoft = pow(lines, 0.5);   // Softer falloff for more visible lines
    float linesSharp = pow(lines, 1.8);  // Less aggressive sharpening
    
    float glow = 0.7 + 1.2 * exp(-length(kUv) * 1.2);  // Stronger center glow
    float web = (linesSharp * (1.2 + tr * 0.5) + linesSoft * (0.5 + tr * 0.3)) * glow;

    vec3 webColor = palette(lines * 0.85 + time * 0.04, theme);
    // Stronger white-lift so it punches through other layers
    webColor = mix(webColor, vec3(1.0), 0.15 + 0.3 * tr);

    vec3 organicColor = palette(rd.r + time * 0.02 + tr * 0.25, theme);
    
    // Mix organic feedback based on feedback parameter
    float fill = (1.0 - linesSharp) * organic * (0.6 + tr * 0.5) * feedback;
    
    // 2D pattern result
    vec3 pattern2D = (webColor * web + organicColor * fill) * 5.5;
    
    // 3D raymarching result (only if raymarchMode > 0)
    vec3 pattern3D = vec3(0.0);
    if (rm > 0.0) {
        pattern3D = kaleidoscopeRaymarch(uv, time, beat, energy, tr, finalSlices, theme);
    }
    
    // Blend 2D and 3D patterns based on raymarchMode
    vec3 finalColor = mix(pattern2D, pattern3D, rm);
    
    // Much brighter output so it holds up against other additive layers
    return finalColor * intensity;
}
