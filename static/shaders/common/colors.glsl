



// ============================================================================
// COLOR UTILITIES
// Functions for color space conversion and procedural palette generation
// ============================================================================

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    
    return rgb + m;
}


vec3 themeLSD(float t) {

    float hue = t;

    float sat = 0.75 + 0.1 * sin(t * TAU * 6.0);
    float lum = 0.5 + 0.12 * sin(t * TAU * 3.0);
    

    if (hue > 0.15 && hue < 0.45) {
        lum += 0.08;
    }
    
    return hsl2rgb(vec3(hue, sat, lum));
}

vec3 triMix(vec3 a, vec3 b, vec3 c, float t) {
    float x = fract(t);
    if (x < 0.5) {
        return mix(a, b, smoothstep(0.0, 0.5, x));
    }
    return mix(b, c, smoothstep(0.5, 1.0, x));
}

vec3 quadMix(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    float x = fract(t) * 4.0;
    if (x < 1.0) {
        return mix(a, b, smoothstep(0.0, 1.0, x));
    }
    if (x < 2.0) {
        return mix(b, c, smoothstep(1.0, 2.0, x));
    }
    if (x < 3.0) {
        return mix(c, d, smoothstep(2.0, 3.0, x));
    }
    return mix(d, a, smoothstep(3.0, 4.0, x));
}


vec3 themeAnalog(float t) {
    vec3 a = vec3(1.0, 0.18, 0.12);
    vec3 b = vec3(1.0, 0.55, 0.12);
    vec3 c = vec3(1.0, 0.85, 0.25);
    return triMix(a, b, c, t);
}


vec3 themeComplement(float t) {
    vec3 a = vec3(0.05, 0.85, 0.7);
    vec3 b = vec3(0.1, 0.35, 1.0);
    vec3 c = vec3(0.55, 0.9, 1.0);
    return triMix(a, b, c, t);
}


vec3 themeTriad(float t) {
    vec3 a = vec3(0.55, 0.15, 1.0);
    vec3 b = vec3(1.0, 0.2, 0.75);
    vec3 c = vec3(0.2, 0.4, 1.0);
    return triMix(a, b, c, t);
}



vec3 themeNeon(float t) {
    vec3 a = vec3(0.1, 0.85, 0.4);
    vec3 b = vec3(0.9, 0.15, 0.75);

    float x = fract(t);
    float dip = 1.0 - 0.15 * sin(x * PI);
    return mix(a, b, smoothstep(0.0, 1.0, x)) * dip;
}


vec3 themeSplitComplement(float t) {
    vec3 a = vec3(0.08, 0.82, 1.0);
    vec3 b = vec3(1.0, 0.45, 0.2);
    vec3 c = vec3(0.8, 0.2, 1.0);
    return triMix(a, b, c, t);
}


vec3 themeAnalogCool(float t) {
    vec3 a = vec3(0.08, 0.9, 0.75);
    vec3 b = vec3(0.15, 0.55, 1.0);
    vec3 c = vec3(0.4, 0.25, 1.0);
    return triMix(a, b, c, t);
}


vec3 themeTetradic(float t) {
    vec3 a = vec3(1.0, 0.3, 0.35);
    vec3 b = vec3(0.2, 0.9, 0.6);
    vec3 c = vec3(0.25, 0.45, 1.0);
    vec3 d = vec3(1.0, 0.85, 0.2);
    return quadMix(a, b, c, d, t);
}


vec3 themePastelTriad(float t) {
    vec3 a = hsl2rgb(vec3(0.02, 0.5, 0.72));
    vec3 b = hsl2rgb(vec3(0.35, 0.5, 0.72));
    vec3 c = hsl2rgb(vec3(0.62, 0.5, 0.72));
    return triMix(a, b, c, t);
}







vec3 themeBioluminescent(float t) {
    vec3 a = vec3(0.0, 0.08, 0.15);
    vec3 b = vec3(0.0, 0.6, 0.8);
    vec3 c = vec3(0.3, 1.0, 0.6);
    vec3 d = vec3(0.0, 0.25, 0.4);
    return quadMix(a, b, c, d, t);
}



vec3 themeIridescent(float t) {
    float phase = t * 2.5;
    vec3 a = vec3(0.1, 0.0, 0.3);
    vec3 b = vec3(0.0, 0.5, 0.6);
    vec3 c = vec3(0.9, 0.2, 0.5);
    vec3 d = vec3(1.0, 0.8, 0.2);
    vec3 e = vec3(0.2, 0.9, 0.4);
    
    float x = fract(phase) * 5.0;
    if (x < 1.0) return mix(a, b, smoothstep(0.0, 1.0, x));
    if (x < 2.0) return mix(b, c, smoothstep(0.0, 1.0, x - 1.0));
    if (x < 3.0) return mix(c, d, smoothstep(0.0, 1.0, x - 2.0));
    if (x < 4.0) return mix(d, e, smoothstep(0.0, 1.0, x - 3.0));
    return mix(e, a, smoothstep(0.0, 1.0, x - 4.0));
}



vec3 themeChromatic(float t) {
    float r = 0.5 + 0.5 * sin(t * TAU + 0.0);
    float g = 0.5 + 0.5 * sin(t * TAU + TAU / 3.0);
    float b = 0.5 + 0.5 * sin(t * TAU + 2.0 * TAU / 3.0);

    float lum = 0.5 + 0.35 * sin(t * TAU * 2.0);

    lum *= 0.85 + 0.15 * sin(t * TAU * 0.5);
    return vec3(r, g, b) * lum;
}



vec3 themeGoldenLiminal(float t) {
    vec3 warmGold = vec3(1.0, 0.75, 0.3);
    vec3 roseDust = vec3(0.85, 0.45, 0.55);
    vec3 twilight = vec3(0.4, 0.3, 0.7);
    vec3 deepIndigo = vec3(0.15, 0.1, 0.35);
    return quadMix(warmGold, roseDust, twilight, deepIndigo, t);
}



vec3 themeOKRainbow(float t) {
    float h = t * TAU;
    float L = 0.7 + 0.1 * sin(t * TAU * 3.0);
    float C = 0.28;
    
    float a = C * cos(h);
    float b = C * sin(h);
    

    float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    
    vec3 lms = vec3(l_ * l_ * l_, m_ * m_ * m_, s_ * s_ * s_);
    
    mat3 lmsToRgb = mat3(
        4.0767416621, -3.3077115913, 0.2309699292,
        -1.2684380046, 2.6097574011, -0.3413193965,
        -0.0041960863, -0.7034186147, 1.7076147010
    );
    
    return clamp(lmsToRgb * lms, 0.0, 1.0);
}



vec3 themeSynesthetic(float t) {
    float intensity = 0.5 + 0.5 * sin(t * TAU * 2.0);
    float hueShift = intensity * 0.08;
    
    vec3 a = hsl2rgb(vec3(0.75 + hueShift, 0.9, 0.4 + intensity * 0.3));
    vec3 b = hsl2rgb(vec3(0.85 - hueShift, 0.85, 0.5 + intensity * 0.2));
    vec3 c = hsl2rgb(vec3(0.92 + hueShift, 0.8, 0.55));
    
    return triMix(a, b, c, t);
}



vec3 themeEntropy(float t) {
    vec3 electric = vec3(0.0, 1.0, 1.0);
    vec3 voidColor = vec3(0.1, 0.0, 0.2);
    vec3 plasma = vec3(1.0, 0.3, 0.0);
    vec3 matrix = vec3(0.0, 0.8, 0.2);
    return quadMix(electric, voidColor, plasma, matrix, t);
}



vec3 themeVelvet(float t) {
    vec3 a = vec3(0.12, 0.08, 0.18);
    vec3 b = vec3(0.55, 0.35, 0.65);
    vec3 c = vec3(0.9, 0.85, 0.95);
    vec3 d = vec3(0.25, 0.15, 0.35);
    return quadMix(a, b, c, d, t);
}



vec3 themeSolarFlare(float t) {
    vec3 a = vec3(0.1, 0.0, 0.0);
    vec3 b = vec3(0.8, 0.1, 0.0);
    vec3 c = vec3(1.0, 0.6, 0.0);
    vec3 d = vec3(1.0, 1.0, 0.7);
    return quadMix(a, b, c, d, t);
}







vec3 themeVoidPulse(float t) {
    vec3 void_ = vec3(0.0, 0.0, 0.0);
    vec3 ember = vec3(0.4, 0.0, 0.1);
    vec3 flash = vec3(0.8, 0.2, 0.4);
    

    float x = fract(t);
    if (x < 0.7) return mix(void_, ember, smoothstep(0.0, 0.7, x));
    return mix(ember, flash, smoothstep(0.7, 1.0, x));
}



vec3 themeStarless(float t) {
    float lum = 0.02 + 0.25 * pow(sin(t * PI), 2.0);
    float hue = 0.62 + 0.02 * sin(t * TAU);
    return hsl2rgb(vec3(hue, 0.6, lum));
}



vec3 themeEventHorizon(float t) {
    vec3 black = vec3(0.0);
    vec3 accretion = vec3(1.0, 0.4, 0.1);
    vec3 hawking = vec3(0.6, 0.8, 1.0);
    
    float x = fract(t);

    if (x < 0.4) return mix(black, vec3(0.02), x / 0.4);
    if (x < 0.6) return mix(vec3(0.02), accretion, (x - 0.4) / 0.2);
    if (x < 0.8) return mix(accretion, hawking, (x - 0.6) / 0.2);
    return mix(hawking, black, (x - 0.8) / 0.2);
}






vec3 themeCyberpunk(float t) {
    vec3 void_ = vec3(0.05, 0.01, 0.13);
    vec3 hotPink = vec3(1.0, 0.08, 0.58);
    vec3 cyan = vec3(0.0, 1.0, 1.0);
    vec3 purple = vec3(0.58, 0.0, 0.83);
    
    float x = fract(t) * 4.0;
    if (x < 1.0) return mix(void_, hotPink, smoothstep(0.0, 1.0, x));
    if (x < 2.0) return mix(hotPink, cyan, smoothstep(0.0, 1.0, x - 1.0));
    if (x < 3.0) return mix(cyan, purple, smoothstep(0.0, 1.0, x - 2.0));
    return mix(purple, void_, smoothstep(0.0, 1.0, x - 3.0));
}



vec3 themeCrimsonMono(float t) {

    float hue = 0.0 + 0.02 * sin(t * TAU);
    float sat = 0.6 + 0.2 * sin(t * TAU * 2.0);
    float lum = 0.1 + 0.4 * pow(sin(t * PI), 2.0);
    

    vec3 base = hsl2rgb(vec3(hue, sat, lum));
    vec3 cream = vec3(0.96, 0.87, 0.7);
    float accent = pow(sin(t * PI), 8.0);
    
    return mix(base, cream, accent * 0.4);
}



vec3 themeEarthTones(float t) {
    vec3 terracotta = vec3(0.8, 0.45, 0.32);
    vec3 sage = vec3(0.61, 0.69, 0.53);
    vec3 sienna = vec3(0.63, 0.32, 0.18);
    vec3 clay = vec3(0.72, 0.45, 0.2);
    
    return quadMix(terracotta, sage, sienna, clay, t);
}



vec3 themeTrueComplement(float t) {
    vec3 blue = vec3(0.0, 0.4, 1.0);
    vec3 orange = vec3(1.0, 0.4, 0.0);
    

    float x = fract(t);

    float energy = 1.0 + 0.15 * sin(t * TAU * 4.0);
    
    if (x < 0.45) return blue * energy;
    if (x < 0.55) return mix(blue, orange, smoothstep(0.45, 0.55, x)) * energy;
    return orange * energy;
}



vec3 themeNoir(float t) {

    float lum = 0.05 + 0.5 * pow(sin(t * PI), 1.5);
    vec3 gray = vec3(lum);
    

    vec3 accent = vec3(0.0, 1.0, 1.0);
    float accentStrength = pow(sin(t * PI), 6.0) * 0.6;
    
    return mix(gray, accent, accentStrength);
}



vec3 themeSepia(float t) {
    vec3 darkBrown = vec3(0.24, 0.14, 0.08);
    vec3 sepia = vec3(0.44, 0.26, 0.08);
    vec3 cream = vec3(0.96, 0.87, 0.7);
    vec3 antique = vec3(0.98, 0.92, 0.84);
    
    return quadMix(darkBrown, sepia, cream, antique, t);
}


vec3 palette(float t, float theme) {
    t = fract(t);
    float clampedTheme = clamp(theme, 0.0, 26.0);
    int themeIndex = int(floor(clampedTheme + 0.5));
    

    if (themeIndex == 1) return themeAnalog(t);
    if (themeIndex == 2) return themeComplement(t);
    if (themeIndex == 3) return themeTriad(t);
    if (themeIndex == 4) return themeNeon(t);
    if (themeIndex == 5) return themeSplitComplement(t);
    if (themeIndex == 6) return themeAnalogCool(t);
    if (themeIndex == 7) return themeTetradic(t);
    if (themeIndex == 8) return themePastelTriad(t);
    

    if (themeIndex == 9) return themeBioluminescent(t);
    if (themeIndex == 10) return themeIridescent(t);
    if (themeIndex == 11) return themeChromatic(t);
    if (themeIndex == 12) return themeGoldenLiminal(t);
    if (themeIndex == 13) return themeOKRainbow(t);
    if (themeIndex == 14) return themeSynesthetic(t);
    if (themeIndex == 15) return themeEntropy(t);
    if (themeIndex == 16) return themeVelvet(t);
    if (themeIndex == 17) return themeSolarFlare(t);
    

    if (themeIndex == 18) return themeVoidPulse(t);
    if (themeIndex == 19) return themeStarless(t);
    if (themeIndex == 20) return themeEventHorizon(t);
    

    if (themeIndex == 21) return themeCyberpunk(t);
    if (themeIndex == 22) return themeCrimsonMono(t);
    if (themeIndex == 23) return themeEarthTones(t);
    if (themeIndex == 24) return themeTrueComplement(t);
    if (themeIndex == 25) return themeNoir(t);
    if (themeIndex == 26) return themeSepia(t);
    
    return themeLSD(t);
}
