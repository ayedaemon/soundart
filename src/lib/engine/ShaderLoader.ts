
import { base } from '$app/paths';

const shaderCache = new Map<string, string>();

/**
 * Fetch shader source from URL.
 * Uses a memory cache to prevent redundant network requests.
 * @param url - The URL of the shader file
 * @returns The raw shader source code
 */
async function fetchShader(url: string): Promise<string> {
  if (shaderCache.has(url)) {
    return shaderCache.get(url)!;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader: ${url}`);
  }
  
  const source = await response.text();
  shaderCache.set(url, source);
  return source;
}

/**
 * Recursively process #include directives in shader source.
 * Handles circular dependency detection.
 * @param source - The raw shader source containing #include directives
 * @param basePath - The base path for resolving relative includes
 * @param visited - Set of visited paths to detect cycles
 * @returns The fully expanded shader source
 */
async function processIncludes(source: string, basePath: string, visited = new Set<string>()): Promise<string> {
  const includeRegex = /#include\s+"([^"]+)"/g;
  let result = source;
  let match;
  
  const includes: { full: string; path: string }[] = [];
  while ((match = includeRegex.exec(source)) !== null) {
    includes.push({ full: match[0], path: match[1] });
  }
  
  for (const { full, path } of includes) {
    const fullPath = basePath + path;
    
    if (visited.has(fullPath)) {
      console.warn(`Circular include detected: ${fullPath}`);
      result = result.replace(full, '');
      continue;
    }
    
    visited.add(fullPath);
    
    try {
      let includedSource = await fetchShader(fullPath);
      includedSource = await processIncludes(includedSource, basePath, visited);
      result = result.replace(full, includedSource);
    } catch (error) {
      console.error(`Failed to include shader: ${fullPath}`, error);
      result = result.replace(full, `// Failed to include: ${path}`);
    }
  }
  
  return result;
}

/**
 * Load and process a shader file.
 * @param path - Relative path to the shader file
 * @param basePath - Base path for shader assets
 * @returns The processed shader source code
 */
export async function loadShader(path: string, basePath: string = `${base}/shaders/`): Promise<string> {
  const source = await fetchShader(basePath + path);
  return processIncludes(source, basePath);
}

/**
 * Compile a WebGL shader.
 * Logs detailed error messages with line numbers on failure.
 * @param gl - WebGL rendering context
 * @param type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
 * @param source - Shader source code
 * @returns The compiled WebGLShader or null on failure
 */
export function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader');
    return null;
  }
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    console.error('Shader compilation error:', error);
    
    // Log source with line numbers for easier debugging
    const lines = source.split('\n');
    const numberedLines = lines.map((line, i) => `${i + 1}: ${line}`);
    console.error('Shader source:\n' + numberedLines.join('\n'));
    
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

/**
 * Create and link a WebGL program from vertex and fragment sources.
 * @param gl - WebGL rendering context
 * @param vertexSource - Vertex shader source code
 * @param fragmentSource - Fragment shader source code
 * @returns The linked WebGLProgram or null on failure
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  
  const program = gl.createProgram();
  if (!program) {
    console.error('Failed to create program');
    return null;
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    console.error('Program linking error:', error);
    gl.deleteProgram(program);
    return null;
  }
  
  // Clean up shaders after linking
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  
  return program;
}

/**
 * High-level utility to load, compile, and link a shader program from files.
 * @param gl - WebGL rendering context
 * @param vertexPath - Path to vertex shader file
 * @param fragmentPath - Path to fragment shader file
 * @param basePath - Base path for shader assets
 * @returns The ready-to-use WebGLProgram or null on failure
 */
export async function loadProgram(
  gl: WebGLRenderingContext,
  vertexPath: string,
  fragmentPath: string,
  basePath: string = `${base}/shaders/`
): Promise<WebGLProgram | null> {
  const [vertexSource, fragmentSource] = await Promise.all([
    loadShader(vertexPath, basePath),
    loadShader(fragmentPath, basePath)
  ]);
  
  return createProgram(gl, vertexSource, fragmentSource);
}
