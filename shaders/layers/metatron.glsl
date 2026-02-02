// ============================================================================
// LAYER: Metatron's Cube
// Sacred geometry - nested rings of circles
// ============================================================================

// Draw a circle outline
float metatronCircle(vec2 uv, vec2 center, float radius, float width) {
    float d = length(uv - center);
    return smoothstep(width, 0.0, abs(d - radius));
}

// Draw a line segment with glow
float metatronLine(vec2 uv, vec2 a, vec2 b, float width) {
    vec2 pa = uv - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    return smoothstep(width, 0.0, d);
}

// Metatron's Cube pattern with variable rings
float metatronPattern(vec2 uv, float time, float beat, float energy, float numRings) {
    float pattern = 0.0;
    float scale = 2.5;
    vec2 p = uv * scale;
    
    // Circle radius and line width (audio reactive)
    float baseRadius = 0.4;
    float radius = baseRadius * (1.0 + beat * 0.15);
    float lineWidth = 0.012 + energy * 0.006;
    float circleWidth = 0.018 + beat * 0.008;
    
    int rings = int(numRings);
    
    // Draw center circle
    float centerPulse = 1.0 + 0.08 * sin(time * 2.0);
    pattern += metatronCircle(p, vec2(0.0), radius * centerPulse, circleWidth);
    
    // Draw nested rings
    float linePulse = 0.3 + beat * 0.5 + energy * 0.2;
    
    // Ring 1 (always drawn if rings >= 1)
    if (rings >= 1) {
        float ringDist = baseRadius * 1.0;
        for (int i = 0; i < 6; i++) {
            float angle = float(i) * TAU / 6.0 + time * 0.1;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.05 * sin(time * 2.0 + float(i) * 0.5);
            pattern += metatronCircle(p, pos, radius * pulse, circleWidth);
            // Connect to center
            pattern += metatronLine(p, vec2(0.0), pos, lineWidth) * linePulse;
            // Connect to neighbors in ring
            float nextAngle = float(i + 1) * TAU / 6.0 + time * 0.1;
            vec2 nextPos = vec2(cos(nextAngle), sin(nextAngle)) * ringDist;
            pattern += metatronLine(p, pos, nextPos, lineWidth) * linePulse * 0.8;
        }
    }
    
    // Ring 2
    if (rings >= 2) {
        float ringDist = baseRadius * 2.0;
        for (int i = 0; i < 6; i++) {
            float angle = float(i) * TAU / 6.0 + TAU / 12.0 + time * 0.1;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.05 * sin(time * 2.0 + float(i) * 0.5 + 1.0);
            pattern += metatronCircle(p, pos, radius * pulse, circleWidth);
            // Connect to inner ring
            float innerAngle1 = float(i) * TAU / 6.0 + time * 0.1;
            float innerAngle2 = float(i + 1) * TAU / 6.0 + time * 0.1;
            vec2 inner1 = vec2(cos(innerAngle1), sin(innerAngle1)) * baseRadius;
            vec2 inner2 = vec2(cos(innerAngle2), sin(innerAngle2)) * baseRadius;
            pattern += metatronLine(p, pos, inner1, lineWidth) * linePulse * 0.6;
            pattern += metatronLine(p, pos, inner2, lineWidth) * linePulse * 0.6;
        }
    }
    
    // Ring 3
    if (rings >= 3) {
        float ringDist = baseRadius * 3.0;
        for (int i = 0; i < 12; i++) {
            float angle = float(i) * TAU / 12.0 + time * 0.08;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.04 * sin(time * 2.0 + float(i) * 0.4);
            pattern += metatronCircle(p, pos, radius * 0.9 * pulse, circleWidth * 0.9);
        }
    }
    
    // Ring 4
    if (rings >= 4) {
        float ringDist = baseRadius * 4.0;
        for (int i = 0; i < 12; i++) {
            float angle = float(i) * TAU / 12.0 + TAU / 24.0 + time * 0.06;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.04 * sin(time * 2.0 + float(i) * 0.3);
            pattern += metatronCircle(p, pos, radius * 0.8 * pulse, circleWidth * 0.8);
        }
    }
    
    // Ring 5
    if (rings >= 5) {
        float ringDist = baseRadius * 5.0;
        for (int i = 0; i < 18; i++) {
            float angle = float(i) * TAU / 18.0 + time * 0.05;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.03 * sin(time * 2.0 + float(i) * 0.25);
            pattern += metatronCircle(p, pos, radius * 0.7 * pulse, circleWidth * 0.7);
        }
    }
    
    // Ring 6
    if (rings >= 6) {
        float ringDist = baseRadius * 6.0;
        for (int i = 0; i < 18; i++) {
            float angle = float(i) * TAU / 18.0 + TAU / 36.0 + time * 0.04;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.03 * sin(time * 2.0 + float(i) * 0.2);
            pattern += metatronCircle(p, pos, radius * 0.6 * pulse, circleWidth * 0.6);
        }
    }
    
    // Ring 7
    if (rings >= 7) {
        float ringDist = baseRadius * 7.0;
        for (int i = 0; i < 24; i++) {
            float angle = float(i) * TAU / 24.0 + time * 0.03;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.02 * sin(time * 2.0 + float(i) * 0.18);
            pattern += metatronCircle(p, pos, radius * 0.5 * pulse, circleWidth * 0.5);
        }
    }
    
    // Ring 8
    if (rings >= 8) {
        float ringDist = baseRadius * 8.0;
        for (int i = 0; i < 24; i++) {
            float angle = float(i) * TAU / 24.0 + TAU / 48.0 + time * 0.025;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.02 * sin(time * 2.0 + float(i) * 0.15);
            pattern += metatronCircle(p, pos, radius * 0.45 * pulse, circleWidth * 0.45);
        }
    }
    
    // Ring 9
    if (rings >= 9) {
        float ringDist = baseRadius * 9.0;
        for (int i = 0; i < 30; i++) {
            float angle = float(i) * TAU / 30.0 + time * 0.02;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.02 * sin(time * 2.0 + float(i) * 0.12);
            pattern += metatronCircle(p, pos, radius * 0.4 * pulse, circleWidth * 0.4);
        }
    }
    
    // Ring 10
    if (rings >= 10) {
        float ringDist = baseRadius * 10.0;
        for (int i = 0; i < 30; i++) {
            float angle = float(i) * TAU / 30.0 + TAU / 60.0 + time * 0.015;
            vec2 pos = vec2(cos(angle), sin(angle)) * ringDist;
            float pulse = 1.0 + 0.015 * sin(time * 2.0 + float(i) * 0.1);
            pattern += metatronCircle(p, pos, radius * 0.35 * pulse, circleWidth * 0.35);
        }
    }
    
    // Add central star pattern
    for (int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0 + time * 0.15;
        vec2 starPoint = vec2(cos(angle), sin(angle)) * radius * 0.5;
        float angle2 = angle + PI;
        vec2 starPoint2 = vec2(cos(angle2), sin(angle2)) * radius * 0.5;
        pattern += metatronLine(p, starPoint, starPoint2, lineWidth * 0.7) * (0.4 + beat * 0.3);
    }
    
    return clamp(pattern, 0.0, 1.0);
}

vec3 layerMetatron(vec2 uv, float time, float beat, float energy, float intensity, float rings, float theme) {
    if (intensity <= 0.0) return vec3(0.0);
    
    float metatron = metatronPattern(uv, time, beat, energy, rings);
    
    // Color based on theme with time-varying hue shift
    float hue = 0.5 + time * 0.02 + beat * 0.1;
    vec3 color = palette(hue, theme) * metatron;
    
    // Add subtle glow effect
    float glow = metatron * (0.3 + beat * 0.4);
    color += palette(hue + 0.1, theme) * glow * 0.3;
    
    return color * intensity * 1.5;
}
