// ============================================================================
// LAYER: Hopalong
// Barry Martin's Hopalong Orbits Visualizer
// Creates organic fractal patterns using the classic attractor formulas:
//   x_new = y - sign(x) * sqrt(abs(b*x - c))
//   y_new = a - x
// Now with mouse reactivity!
// ============================================================================

vec3 layerHopalong(
    vec2 uv, 
    float time, 
    float beat, 
    float energy,
    vec2 mouse,
    float mouseSpeed,
    float mouseDown,
    float intensity, 
    float mouseSens,
    float theme
) {
    if (intensity <= 0.0) return vec3(0.0);
    
    // Classic Martin hopalong parameters - slowly evolving
    float a = 1.4 + 0.8 * sin(time * 0.023);
    float b = 2.3 + 0.5 * cos(time * 0.031);
    float c = 2.4 + 0.6 * sin(time * 0.017);
    
    // Audio modulation of parameters
    a += beat * 0.3;
    b += energy * 0.2;
    
    // Mouse modulation of parameters (when mouse sensitivity > 0)
    if (mouseSens > 0.0) {
        // Mouse position influences attractor shape
        a += (mouse.x - 0.0) * 0.3 * mouseSens;
        b += (mouse.y - 0.0) * 0.2 * mouseSens;
        // Mouse speed adds chaos
        c += mouseSpeed * 0.5 * mouseSens;
    }
    
    vec3 color = vec3(0.0);
    
    // Click creates a pulse effect
    float clickPulse = mouseDown * mouseSens * 0.5;
    
    // Multiple starting points create richer orbital structure
    for (int orbit = 0; orbit < 4; orbit++) {
        // Vary parameters slightly per orbit for depth
        float aO = a + float(orbit) * 0.12;
        float bO = b + float(orbit) * 0.06;
        float cO = c + float(orbit) * 0.10;
        
        // Starting position for this orbit
        float px = 0.1 + float(orbit) * 0.04;
        float py = 0.0 + float(orbit) * 0.02;
        
        // Warm-up iterations to settle into attractor
        for (int i = 0; i < 30; i++) {
            float signX = (px >= 0.0) ? 1.0 : -1.0;
            float newX = py - signX * sqrt(abs(bO * px - cO));
            float newY = aO - px;
            px = newX;
            py = newY;
        }
        
        // Render visible orbit points - more iterations for denser particles
        for (int i = 0; i < 180; i++) {
            // Hopalong iteration step
            float signX = (px >= 0.0) ? 1.0 : -1.0;
            float newX = py - signX * sqrt(abs(bO * px - cO));
            float newY = aO - px;
            px = newX;
            py = newY;
            
            // Scale attractor coordinates to screen space
            vec2 screenP = vec2(px, py) * 0.04;
            
            // Mouse attraction/repulsion effect
            if (mouseSens > 0.0) {
                vec2 toMouse = mouse - screenP;
                float distToMouse = length(toMouse);
                // Particles are attracted to mouse position
                float attractStrength = 0.1 * mouseSens / (distToMouse + 0.5);
                screenP += toMouse * attractStrength * 0.3;
            }
            
            // Distance from this pixel to the orbit point
            float d = length(uv - screenP);
            
            // Fine particle point - small size, tight falloff
            // Mouse speed increases particle size
            float speedBoost = mouseSpeed * mouseSens * 0.02;
            float pointSize = 0.012 + 0.004 * beat + speedBoost + clickPulse * 0.02;
            float glow = exp(-d * d / (pointSize * pointSize * 0.25));
            
            // Color shifts through the orbit for rainbow trail effect
            float t = float(i) / 180.0 + float(orbit) * 0.25;
            // Mouse down shifts color
            t += mouseDown * mouseSens * 0.2;
            
            color += palette(t + time * 0.02, theme) * glow * 0.12;
        }
    }
    
    return color * intensity * 1.5;
}
