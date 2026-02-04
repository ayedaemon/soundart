import { loadProgram } from '$lib/engine/ShaderLoader';
import type { AudioMetrics, MouseMetrics } from '$lib/types';
import type { LayerConfig } from '$lib/core/types/layer';
import { layerDefinitions } from '$lib/layers/registry';

interface UniformLocations {
  time: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  beat: WebGLUniformLocation | null;
  energy: WebGLUniformLocation | null;
  treble: WebGLUniformLocation | null;
  feedbackTexture: WebGLUniformLocation | null;
  feedbackReady: WebGLUniformLocation | null;
  qualityLevel: WebGLUniformLocation | null;
  [key: string]: WebGLUniformLocation | null;
}

interface MouseUniformLocations {
  position: WebGLUniformLocation | null;
  velocity: WebGLUniformLocation | null;
  speed: WebGLUniformLocation | null;
  down: WebGLUniformLocation | null;
  click: WebGLUniformLocation | null;
}

interface GestureUniformLocations {
  handPositions: Array<WebGLUniformLocation | null>;
  handCount: WebGLUniformLocation | null;
  faceCenter: WebGLUniformLocation | null;
  faceDetected: WebGLUniformLocation | null;
}

export class WorkerRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private uniformLocations: UniformLocations = {} as UniformLocations;
  private mouseUniformLocations: MouseUniformLocations = {} as MouseUniformLocations;
  private gestureUniformLocations: GestureUniformLocations = {} as GestureUniformLocations;
  private layerUniformLocations: Map<string, WebGLUniformLocation | null> = new Map();
  
  // Textures
  private feedbackTexture: WebGLTexture | null = null;
  private feedbackReady: boolean = false;
  private feedbackWidth: number = 0;
  private feedbackHeight: number = 0;

  // Gesture tracking data (disabled - camera UI removed, kept for potential future use)
  private gestureData: GestureData | null = null;

  // Geometry
  private positionBuffer: WebGLBuffer | null = null;
  
  // State
  private initialized: boolean = false;
  private width: number = 0;
  private height: number = 0;
  
  // Uniform Cache for Dirty Checking
  // Prevents redundant WebGL calls if the value hasn't changed
  private uniformCache: Map<string, number | boolean> = new Map();

  private qualityLevel: number = 1.0;
  private feedbackEnabled: boolean = true;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }
  
  /**
   * Initialize the renderer.
   * Compiles shaders, sets up buffers, and creates textures.
   * @returns boolean indicating success
   */
  async init(): Promise<boolean> {
    const gl = this.gl;
    
    
    try {
      
      // Load and compile the main composite shader
      this.program = await loadProgram(gl, 'quad.vert', 'composite.frag');
      if (!this.program) {
        console.error('WorkerRenderer: Failed to create shader program');
        return false;
      }

    } catch (error) {
      console.error('WorkerRenderer: Failed to load shaders:', error);
      return false;
    }
    
    // Cache locations for core uniforms to avoid lookups every frame
    this.uniformLocations = {
      time: gl.getUniformLocation(this.program, 'uTime'),
      resolution: gl.getUniformLocation(this.program, 'uResolution'),
      beat: gl.getUniformLocation(this.program, 'uBeat'),
      energy: gl.getUniformLocation(this.program, 'uEnergy'),
      treble: gl.getUniformLocation(this.program, 'uTreble'),
      feedbackTexture: gl.getUniformLocation(this.program, 'uFeedbackTex'),
      feedbackReady: gl.getUniformLocation(this.program, 'uFeedbackReady'),
      qualityLevel: gl.getUniformLocation(this.program, 'uQualityLevel'),
    };
    
    // Cache locations for mouse interaction uniforms
    this.mouseUniformLocations = {
      position: gl.getUniformLocation(this.program, 'uMouse'),
      velocity: gl.getUniformLocation(this.program, 'uMouseVelocity'),
      speed: gl.getUniformLocation(this.program, 'uMouseSpeed'),
      down: gl.getUniformLocation(this.program, 'uMouseDown'),
      click: gl.getUniformLocation(this.program, 'uMouseClick')
    };
    
    // Cache locations for gesture uniforms (disabled - camera UI removed, kept for potential future use)
    this.gestureUniformLocations = {
      handPositions: [
        gl.getUniformLocation(this.program, 'uGestureHandPositions[0]'),
        gl.getUniformLocation(this.program, 'uGestureHandPositions[1]'),
        gl.getUniformLocation(this.program, 'uGestureHandPositions[2]'),
        gl.getUniformLocation(this.program, 'uGestureHandPositions[3]')
      ],
      handCount: gl.getUniformLocation(this.program, 'uGestureHandCount'),
      faceCenter: gl.getUniformLocation(this.program, 'uFaceCenter'),
      faceDetected: gl.getUniformLocation(this.program, 'uFaceDetected')
    };
    
    // Cache locations for all layer-specific properties
    for (const layer of layerDefinitions) {
      for (const prop of layer.properties) {
        const location = gl.getUniformLocation(this.program, prop.uniform);
        this.layerUniformLocations.set(prop.uniform, location);
      }
    }
    
    // Create a full-screen quad (2 triangles) covering the clip space (-1 to 1)
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Set up vertex attribute pointer
    const positionLocation = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Initialize the feedback texture for previous-frame effects
    this.feedbackTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.feedbackTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    this.initialized = true;
    return true;
  }

  /**
   * Handle canvas resize events.
   * Updates viewport and resizes the feedback texture.
   */
  resize(width: number, height: number): void {
    if (!this.gl) return;
    
    // Ensure integer dimensions to match canvas behavior
    const w = Math.floor(width);
    const h = Math.floor(height);
    
    this.width = w;
    this.height = h;
    this.gl.viewport(0, 0, w, h);
    
    // Resize feedback texture to match new dimensions
    if (this.feedbackTexture) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.feedbackTexture);
      
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, w, h, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, null);
      this.feedbackWidth = w;
      this.feedbackHeight = h;
    }
    
    this.feedbackReady = false;
  }

  /**
   * Update uniforms for all layers.
   * Called when layer properties change in the UI.
   */
  updateLayers(layers: LayerConfig[]): void {
    if (!this.gl || !this.program) return;
    this.gl.useProgram(this.program);

    for (const layer of layers) {
      for (const [name, value] of Object.entries(layer.uniforms)) {
        this.setUniform(name, value);
      }
    }
  }
  
  updateMouse(mouse: MouseMetrics): void {
    if (!this.gl || !this.program) return;
    this.gl.useProgram(this.program);
    
    this.gl.uniform2f(this.mouseUniformLocations.position, mouse.x, mouse.y);
    this.gl.uniform2f(this.mouseUniformLocations.velocity, mouse.velocityX, mouse.velocityY);
    this.gl.uniform1f(this.mouseUniformLocations.speed, mouse.speed);
    this.gl.uniform1f(this.mouseUniformLocations.down, mouse.down);
    this.gl.uniform2f(this.mouseUniformLocations.click, mouse.clickX, mouse.clickY);
  }
  
  /**
   * Main render loop.
   * Draws the scene and captures the result for feedback.
   */
  render(time: number, audioMetrics: AudioMetrics): void {
    if (!this.gl || !this.program || !this.initialized) return;
    
    const gl = this.gl;
    
    // Clear the screen
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(this.program);
    
    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positionLocation = gl.getAttribLocation(this.program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Update global uniforms
    gl.uniform1f(this.uniformLocations.time, time);
    gl.uniform2f(this.uniformLocations.resolution, this.width, this.height);
    gl.uniform1f(this.uniformLocations.beat, audioMetrics.beat);
    gl.uniform1f(this.uniformLocations.energy, audioMetrics.energy);
    gl.uniform1f(this.uniformLocations.treble, audioMetrics.treble);
    gl.uniform1f(this.uniformLocations.qualityLevel, this.qualityLevel);
    
    // Update gesture uniforms (disabled - camera UI removed, but uniforms kept for future use)
    // Gesture data will always be null since camera is disabled
    if (this.gestureUniformLocations.handCount) {
      const handCount = this.gestureData?.hands?.length || 0;
      gl.uniform1f(this.gestureUniformLocations.handCount, Math.min(handCount, 4));
      
      // Set hand positions (default to center when no gestures)
      for (let i = 0; i < 4; i++) {
        const loc = this.gestureUniformLocations.handPositions[i];
        if (loc && this.gestureData?.hands?.[i]?.center) {
          const hand = this.gestureData.hands[i];
          gl.uniform2f(loc, hand.center.x, hand.center.y);
        } else if (loc) {
          gl.uniform2f(loc, 0.5, 0.5); // Center (invisible)
        }
      }
    }
    
    // Set face center (default to center when no face detected)
    if (this.gestureUniformLocations.faceCenter && this.gestureUniformLocations.faceDetected) {
      if (this.gestureData?.faces && this.gestureData.faces.length > 0) {
        const face = this.gestureData.faces[0];
        gl.uniform2f(this.gestureUniformLocations.faceCenter, face.center.x, face.center.y);
        gl.uniform1f(this.gestureUniformLocations.faceDetected, 1.0);
      } else {
        gl.uniform2f(this.gestureUniformLocations.faceCenter, 0.5, 0.5);
        gl.uniform1f(this.gestureUniformLocations.faceDetected, 0.0);
      }
    }
    
    // Bind feedback texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    if (this.feedbackEnabled && this.feedbackTexture && this.feedbackReady) {
      gl.bindTexture(gl.TEXTURE_2D, this.feedbackTexture);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.uniform1i(this.uniformLocations.feedbackTexture, 0);
    gl.uniform1f(this.uniformLocations.feedbackReady, (this.feedbackEnabled && this.feedbackReady) ? 1.0 : 0.0);


    // Bind vertex buffer for main program
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw the full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Capture the current frame into the feedback texture for the next frame
    if (this.feedbackEnabled && this.width > 0 && this.height > 0 && this.feedbackTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.feedbackTexture);
      
      const w = Math.min(this.feedbackWidth, gl.drawingBufferWidth, this.width);
      const h = Math.min(this.feedbackHeight, gl.drawingBufferHeight, this.height);
      if (w > 0 && h > 0) {
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, w, h);
        this.feedbackReady = true;
      }
    }
  }
  
  updateQualityLevel(quality: number): void {
    this.qualityLevel = quality;
  }

  updateFeedbackEnabled(enabled: boolean): void {
    this.feedbackEnabled = enabled;
  }


  // Gesture updates disabled - camera UI removed, but method kept for potential future use
  updateGestures(gestures: GestureData): void {
    this.gestureData = gestures;
  }

  /**
   * Helper to set a float uniform with dirty checking.
   * Avoids expensive WebGL calls if the value hasn't changed.
   */
  private setUniform(name: string, value: number): void {
    // Check cache
    if (this.uniformCache.get(name) === value) return;
    
    const location = this.layerUniformLocations.get(name);
    if (location) {
      this.gl.uniform1f(location, value);
      this.uniformCache.set(name, value);
    }
  }
}
