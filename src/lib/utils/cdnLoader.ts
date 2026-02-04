/**
 * CDN Loader Utility
 * Provides reusable functions for dynamically loading libraries from CDN
 * All external dependencies (Three.js, MediaPipe) are loaded from CDN at runtime
 */

/**
 * Load a library from CDN using ES module import
 * @param url CDN URL to the ES module
 * @param cacheKey Key to store in window for caching
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves with the loaded module
 */
export async function loadFromCDN<T = any>(
  url: string,
  cacheKey: string,
  timeoutMs: number = 10000
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('CDN loading can only be done in browser');
  }

  // Check cache first
  if ((window as any)[cacheKey]) {
    return (window as any)[cacheKey];
  }

  return new Promise<T>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import * as Module from '${url}';
      window['${cacheKey}'] = Module;
      window['${cacheKey}_loaded'] = true;
      if (window['${cacheKey}_resolve']) window['${cacheKey}_resolve']();
    `;

    (window as any)[`${cacheKey}_resolve`] = () => {
      const module = (window as any)[cacheKey];
      if (module) {
        resolve(module);
      } else {
        reject(new Error(`Failed to load module from ${url}`));
      }
    };

    script.onerror = (error) => {
      reject(new Error(`Failed to load script from ${url}: ${error}`));
    };

    document.head.appendChild(script);

    // Timeout
    setTimeout(() => {
      if (!(window as any)[`${cacheKey}_loaded`]) {
        reject(new Error(`Loading timeout for ${url}`));
      }
    }, timeoutMs);
  });
}

/**
 * Load a library from CDN using script tag (for non-ES modules)
 * @param url CDN URL to the script
 * @param cacheKey Key to store in window for caching
 * @param timeoutMs Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves when script is loaded
 */
export async function loadScriptFromCDN(
  url: string,
  cacheKey: string,
  timeoutMs: number = 10000
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('CDN loading can only be done in browser');
  }

  // Check cache first
  if ((window as any)[cacheKey]) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      (window as any)[`${cacheKey}_loaded`] = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script from ${url}`));
    };

    document.head.appendChild(script);

    // Timeout
    setTimeout(() => {
      if (!(window as any)[`${cacheKey}_loaded`]) {
        reject(new Error(`Loading timeout for ${url}`));
      }
    }, timeoutMs);
  });
}

/**
 * Load MediaPipe from CDN
 * @returns Promise that resolves with MediaPipe modules
 */
export async function loadMediaPipeFromCDN(): Promise<{
  FaceLandmarker: any;
  HandLandmarker: any;
  FilesetResolver: any;
}> {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe can only be loaded in browser');
  }

  // Check cache
  if ((window as any).__mediapipe_modules__) {
    return (window as any).__mediapipe_modules__;
  }

  // Load WASM internal file first
  await loadScriptFromCDN(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm/vision_wasm_internal.min.js',
    '__mediapipe_wasm_loaded',
    15000
  );

  // Then load the ES module bundle
  const dynamicImport = new Function('url', 'return import(url)');
  const mediapipe = await dynamicImport(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs'
  );

  const modules = {
    FaceLandmarker: mediapipe.FaceLandmarker,
    HandLandmarker: mediapipe.HandLandmarker,
    FilesetResolver: mediapipe.FilesetResolver
  };

  if (!modules.FaceLandmarker || !modules.HandLandmarker || !modules.FilesetResolver) {
    throw new Error('MediaPipe classes not found in vision_bundle.mjs');
  }

  (window as any).__mediapipe_modules__ = modules;
  (window as any).__mediapipe_loaded__ = true;

  return modules;
}

/**
 * Load Three.js from CDN
 * @returns Promise that resolves with Three.js module
 */
export async function loadThreeFromCDN(): Promise<any> {
  const three = await loadFromCDN(
    'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js',
    '__three_modules__',
    10000
  );
  
  // Set loaded flag for compatibility
  (window as any).__three_loaded__ = true;
  
  return three;
}
