# SoundArt: Architecture & Plumbing Guide

A single guide for newcomers to understand how components and stores connect, and how to add your own layers, panels, or features.

---

## 1. High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MAIN THREAD (Svelte)                                                     │
│                                                                          │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐   │
│  │ UI Panels    │────▶│  STORES (single source of truth)             │   │
│  │ (Layers,    │     │  audio, layers, settings, mouse, device, etc.  │   │
│  │  Controls,  │◀────│                                               │   │
│  │  Audio…)    │     └───────────────────┬────────────────────────────┘   │
│  └──────────────┘                        │                               │
│         │                                │ subscriptions / get()         │
│         │                                ▼                               │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐   │
│  │ Visualizer   │────▶│  RenderEngine                                 │   │
│  │ Canvas       │     │  (subscribes to processedAudio, processedMouse,│   │
│  │              │     │   layerUniforms; sends updates to worker)      │   │
│  │ - mouse      │     └───────────────────┬────────────────────────────┘   │
│  │ - audio     │                          │ postMessage                   │
│  │ - animate() │     ┌───────────────────▼────────────────────────────┐   │
│  └──────────────┘     │  WorkerBridge  ──▶  render.worker.ts             │   │
│                       │  (WorkerRenderer: WebGL, composite shader)     │   │
│                       └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Stores** hold all app state. UI and engine **read** and **write** them; nothing holds a duplicate source of truth.
- **VisualizerCanvas** drives the loop: each frame it updates audio, runs the randomizer, and tells **RenderEngine** what to send to the worker.
- **RenderEngine** subscribes to processed stores and forwards audio, mouse, and gestures to the worker; **layer config** (with uniforms) is sent each frame from the canvas’s `animate()`.

---

## 2. Stores Overview

| Store | Purpose | Who writes | Who reads |
|-------|---------|------------|-----------|
| **audioMetrics** | Raw FFT/beat from AudioAnalyzer | VisualizerCanvas (from AudioEngine) | processedAudio (derived) |
| **audioSettings** | Sensitivity, boosts, auto-envelope, etc. | AudioTuningPanel, settings (presets) | processedAudio, AudioTuningPanel |
| **processedAudio** | Metrics after sensitivity/boosts/min motion | Derived from audioMetrics + audioSettings + autoEnvelope | RenderEngine (→ worker), layers (layerUniforms) |
| **micEnabled** | Microphone on/off | VisualizerCanvas (enable/disable mic) | ControlsPanel, +page |
| **layerStates** | Per-layer enabled, properties, randomizer/strobe flags | LayersPanel, randomizer, toggleLayer, updateLayerProperty | LayersPanel, layerConfig/layerUniforms, VisualizerCanvas |
| **layerConfig** | Array of { id, enabled, uniforms } for engine | Derived from layerStates | (internal to layers) |
| **layerUniforms** | Flattened uniform map (all layers, with global zoom/speed) | Derived from layerStates + processedAudio + globalZoom + globalSpeed | RenderEngine (subscription), VisualizerCanvas (updateConfig) |
| **appSettings** | Panels visible, FPS, resolution, max layers, presets, power saver, etc. | ControlsPanel, +page, settings helpers | VisualizerCanvas, panels, randomizer, RenderEngine |
| **globalZoom** / **globalSpeed** | Global modifiers for layer zoom/speed | Settings helpers, +page (keys) | layerUniforms (derived) |
| **deviceCapabilities** | Detected device (mobile/laptop/desktop), preset | detectDeviceCapabilities() on mount | +page (auto preset), applyDevicePreset |
| **mouseState** | Raw position, velocity, click, inside | VisualizerCanvas (mouse handlers) | processedMouse (derived) |
| **processedMouse** | Smoothed mouse metrics | Derived from mouseState | RenderEngine (→ worker) |
| **performanceStats** | FPS, frame time, target FPS | RenderEngine (from worker STATS) | PerformancePanel |
| **themes** (themeDefinitions, getTheme) | Theme list and lookup | — | LayersPanel, randomizer |
| **randomizer** (updateRandomizer, randomizeLayerNow) | — | VisualizerCanvas (on beat), LayersPanel (per-layer randomize) | Reads layerStates, appSettings, themeDefinitions |
| **sensorRegistryState** | Which sensors are registered/enabled | updateSensorRegistryState() | UI that shows sensor status |
| **camera** / **gestures** / **processedGestures** | Camera and gesture data | (Camera/gesture code; currently disabled) | RenderEngine (subscription; currently no-op) |
| **profiling** | Layer profiler progress | VisualizerCanvas, layerProfiler | PerformancePanel / profiler UI |

**Important:** Prefer **processed** stores (`processedAudio`, `processedMouse`) for driving the worker and derived logic; raw stores (`audioMetrics`, `mouseState`) are for internal or UI use.

---

## 3. Components Overview

### 3.1 Engine (`src/lib/engine/`)

- **AudioEngine** – Wraps **AudioAnalyzer**, manages mic and optional SharedArrayBuffer. **Writes** `audioMetrics` from `update()` (called from VisualizerCanvas). Does not use other stores directly.
- **RenderEngine** – Owns **WorkerBridge** and OffscreenCanvas. **Subscribes** to `processedAudio`, `processedMouse`, `processedGestures`, and (for compatibility) `layerUniforms`. Sends INIT, RESIZE, UPDATE_AUDIO, UPDATE_MOUSE, UPDATE_GESTURES, UPDATE_QUALITY, UPDATE_FEEDBACK; **receives** STATS and forwards to `performanceStats`. Layer config is sent from VisualizerCanvas via `updateConfig(layers)` each frame.
- **WorkerBridge** – Thin wrapper around the worker; `postMessage` / `onMessage`.
- **WorkerRenderer** (in worker) – WebGL, composite shader, uniform updates. Receives layer config, mouse, audio, quality, feedback; runs the render loop and reports FPS/frame time.

### 3.2 Sensors (`src/lib/sensors/`)

- **BaseSensor** – Abstract base: `id`, `enabled`, `initialize()`, `process()`, `getDataStore()`, `getSettingsStore()`, `enable()`/`disable()`.
- **AudioSensor**, **MouseSensor**, **CameraSensor**, **GestureSensor** – Implementations (camera/gesture currently unused).
- **SensorRegistry** – Registers sensors; **sensorRegistryState** store is updated via `updateSensorRegistryState()`.

Sensors expose **data** and **settings** as Svelte stores; the rest of the app can subscribe. Today, audio and mouse are driven by AudioEngine and VisualizerCanvas rather than by sensor instances in the registry.

### 3.3 Features (`src/lib/features/`)

- **Feature** – Optional extension point (e.g. GestureControlFeature). **FeatureRegistry** runs `updateAll(deltaTime)` from VisualizerCanvas each frame. Currently no features are enabled (camera UI removed).

### 3.4 Layers (`src/lib/layers/`)

- **registry** – `layerDefinitions`: array of layer defs (id, label, properties, shaderPath, randomizable). Each property has id, label, type, uniform name, min/max/default, optional randomMin/randomMax.
- **layerStates** is initialized from `layerDefinitions`. **layerUniforms** is derived from layerStates + processedAudio + globalZoom + globalSpeed; it applies global zoom/speed and feeds the worker.

### 3.5 UI

- **+page.svelte** – Mounts VisualizerCanvas, ControlsPanel, LayersPanel, AudioLevelsPanel, AudioTuningPanel, PerformancePanel, InfoPanel. Handles keys (zoom, speed, mic, fullscreen, panels, R/S/P, etc.), fullscreen state, device preset auto-apply, and mic auto-enable. **Reads** `appSettings`, `deviceCapabilities`, `micEnabled`; **writes** `appSettings` (fullscreen, etc.) and calls settings helpers.
- **VisualizerCanvas** – Creates RenderEngine and AudioEngine, runs `animate()`. **Reads** `appSettings`, `layerStates`, `layerUniforms`, `audioSettings`, `deviceCapabilities`; **writes** `audioMetrics`, `micEnabled`, `autoEnvelope`, `performanceStats`, and calls `updateRandomizer(beat)`. Builds `LayerConfig[]` from `layerDefinitions` + `layerStates` + `$layerUniforms` and calls `renderEngine.updateConfig(layers)` every frame. Handles mouse events and updates mouse store helpers.
- **ControlsPanel** – Mic, fullscreen, device preset, randomizer/strobe mode, panels toggle, info. **Reads** `micEnabled`, `appSettings`; **writes** `appSettings`; calls parent for mic enable/disable and show info.
- **LayersPanel** – Lists layers from `layerDefinitions` + `layerStates`. **Reads** `layerStates`, `appSettings`, `themeDefinitions`; **writes** `layerStates` via `toggleLayer`, `updateLayerProperty`, `toggleRandomizerInclusion`, `toggleStrobeInclusion`, `setAllIncludeInRandomizer`, `setAllIncludeInStrobe`, `setAllLayersEnabled`, and `randomizeLayerNow`.
- **AudioLevelsPanel** – Level meters. **Reads** `processedAudio` (or raw audio stores).
- **AudioTuningPanel** – **Reads** `audioSettings`; **writes** `audioSettings`.
- **PerformancePanel** – **Reads** `performanceStats`, `appSettings`.
- **InfoPanel** – Static copy of controls/layers shortcuts; **reads** nothing; visibility from parent.

Shared controls (Slider, Select, Toggle, Accordion, etc.) are in `src/lib/ui/controls/` and are used by the panels; they receive values and callbacks, often backed by stores.

---

## 4. How to Add Your Own

### 4.1 Adding a New Layer

1. **Shader** – Add `static/shaders/layers/yourlayer.glsl` with a function `vec3 layerYourlayer(...)` and the uniforms it needs.
2. **Composite** – In `static/shaders/composite.frag`, add uniforms for your layer, `#include "layers/yourlayer.glsl"`, and in `main()` an `if (uLayerYourlayer > 0.001)` block that calls `layerYourlayer(...)` and adds to `finalColor`.
3. **Registry** – In `src/lib/layers/registry.ts`, add a new entry to `layerDefinitions`: `id`, `label`, `description`, `properties` (use `createStandardParams('yourlayer', 'Your Layer')` plus `createFloat`/`createInt`/etc. with the same uniform names as in the shader), `shaderPath: 'layers/yourlayer.glsl'`, and `randomizable` if desired.

No new store is required: **layerStates** and **layerUniforms** are built from the registry, so your new layer is included automatically. The worker receives all uniforms from the main thread each frame.

### 4.2 Adding a New Store

1. Create `src/lib/stores/yourStore.ts`: use `writable` or `derived` from `svelte/store`, and export the store and any update helpers.
2. Re-export from `src/lib/stores/index.ts`.
3. In components that need it: `import { yourStore } from '$lib/stores';` and use `$yourStore` or `.subscribe()`.

If the worker needs the data, either (a) subscribe in **RenderEngine** and postMessage in the subscription, or (b) pass it inside the existing payload (e.g. extend layer config or a new message type in WorkerBridge / render.worker).

### 4.3 Adding a New Panel

1. Add a Svelte component under `src/lib/ui/panels/` (e.g. `YourPanel.svelte`).
2. In `+page.svelte`, import it and render it next to the other panels; pass `visible={$appSettings.panelsVisible}` (or your own visibility).
3. In the panel, import the stores it needs and bind UI to them (or to callbacks that update stores). Prefer existing stores (e.g. `appSettings`, `layerStates`) over new ones unless you have new global state.

### 4.4 Adding a New Control (e.g. global “blur” or “saturation”)

1. If it’s global and affects the composite, add a setting to **appSettings** (or a dedicated store), then:
   - Either add a uniform in the composite shader and pass it from the worker (extend layer config or add a new message type), or
   - If it’s a simple global, you can add a new message type (e.g. `UPDATE_GLOBAL_PARAMS`) and subscribe in RenderEngine to the store that holds the value.
2. Add UI in **ControlsPanel** or a new panel: read the store, call an update function that writes the store.

---

## 5. Quick Reference: Where Things Live

- **Layer definitions** → `src/lib/layers/registry.ts`
- **Layer state & uniforms** → `src/lib/stores/layers.ts`
- **Audio pipeline** → `src/lib/stores/audio.ts` (raw + processed), `src/lib/engine/AudioEngine.ts` + `AudioAnalyzer.ts`
- **Mouse pipeline** → `src/lib/stores/mouse.ts`, VisualizerCanvas mouse handlers → RenderEngine → worker
- **App settings & device** → `src/lib/stores/settings.ts`, `src/lib/stores/device.ts`
- **Worker messaging** → `src/lib/engine/WorkerBridge.ts` (types), `src/lib/engine/RenderEngine.ts` (subscriptions + updateConfig), `src/lib/workers/render.worker.ts` (message handling), `src/lib/engine/WorkerRenderer.ts` (WebGL + uniforms)
- **Main loop** → `VisualizerCanvas.svelte` `animate()`: audio update, randomizer, updateConfig, favicon, profiler

Use this doc as the map: follow stores from UI → engine → worker, and add new pieces by extending the same patterns (stores for state, RenderEngine subscriptions or updateConfig for worker input).
