<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  export let visible: boolean = false;
  export let onClose: () => void;
  
  const STORAGE_KEY = 'soundart-seen-info';
  
  
  export function shouldShowOnFirstVisit(): boolean {
    if (!browser) return false;
    return !localStorage.getItem(STORAGE_KEY);
  }
  
  
  function markAsSeen() {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }
  
  function handleClose() {
    markAsSeen();
    onClose();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible) {
      handleClose();
    }
  }
  
  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="overlay" on:click={handleOverlayClick}>
  <div class="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
    <button class="close-btn" on:click={handleClose} aria-label="Close">✕</button>
    
    <header class="info-header">
      <h1 id="info-title">SOUNDART</h1>
      <p class="tagline">Audio-reactive WebGL visualizer that transforms sound into mesmerizing visuals in real-time.</p>
    </header>
    
    <div class="info-content">
      <section>
        <h2>🎤 Getting Started</h2>
        <ol>
          <li>Click <strong>MIC ON</strong> to enable microphone</li>
          <li>Play music or make sounds</li>
          <li>Watch the visuals react!</li>
        </ol>
      </section>
      
      <section>
        <h2>⌨️ Keyboard Shortcuts</h2>
        <div class="shortcuts">
          <div class="shortcut"><kbd>↑</kbd><span>Zoom in</span></div>
          <div class="shortcut"><kbd>↓</kbd><span>Zoom out</span></div>
          <div class="shortcut"><kbd>→</kbd><span>Speed up</span></div>
          <div class="shortcut"><kbd>←</kbd><span>Speed down</span></div>
          <div class="shortcut"><kbd>M</kbd><span>Toggle microphone</span></div>
          <div class="shortcut"><kbd>F</kbd><span>Toggle fullscreen</span></div>
          <div class="shortcut"><kbd>H</kbd><span>Hide/show all panels</span></div>
          <div class="shortcut"><kbd>?</kbd><span>Show/hide this help</span></div>
          <div class="shortcut"><kbd>R</kbd><span>Cycle randomizer modes</span></div>
          <div class="shortcut"><kbd>S</kbd><span>Cycle strobe modes</span></div>
          <div class="shortcut"><kbd>P</kbd><span>Cycle device presets</span></div>
        </div>
      </section>
      
      <section>
        <h2>📱 Touch Controls</h2>
        <div class="shortcuts">
          <div class="shortcut"><span class="gesture">Single tap</span><span>Toggle panels</span></div>
          <div class="shortcut"><span class="gesture">Double tap</span><span>Toggle fullscreen</span></div>
        </div>
      </section>
      
      <section>
        <h2>🎨 Layers</h2>
        <ul>
          <li>Toggle layers on/off with the indicator dot</li>
          <li>Click <strong>+</strong> to expand and adjust settings</li>
          <li>Adjust <strong>intensity</strong>, <strong>zoom</strong>, <strong>theme</strong>, and <strong>sensitivity</strong></li>
        </ul>
        <h3>Global (Layers panel)</h3>
        <ul>
          <li><strong>All R</strong> – Include or exclude all layers from randomizer</li>
          <li><strong>All S</strong> – Include or exclude all layers from strobe</li>
        </ul>
        <h3>Per-layer buttons</h3>
        <div class="button-legend">
          <div class="legend-item"><span class="legend-btn">&#x2684;</span><span>Randomize this layer's parameters now</span></div>
          <div class="legend-item"><span class="legend-btn r">R</span><span>Include in randomizer (auto parameter changes on beat)</span></div>
          <div class="legend-item"><span class="legend-btn s">S</span><span>Include in strobe (layer flashes on/off with beat)</span></div>
        </div>
      </section>
      
      <section>
        <h2>🎲 Randomizer Modes</h2>
        <p class="mode-intro">Press <kbd>R</kbd> to cycle through modes:</p>
        <div class="mode-list">
          <div class="mode-item">
            <span class="mode-name">FLOW</span>
            <span class="mode-desc">Balanced changes — moderate timing, up to 30% parameter shifts, 50% change chance</span>
          </div>
          <div class="mode-item">
            <span class="mode-name">CHAOS</span>
            <span class="mode-desc">Aggressive — 4× faster, full range jumps, 100% change chance on every beat</span>
          </div>
          <div class="mode-item">
            <span class="mode-name">SUBTLE</span>
            <span class="mode-desc">Gentle nudges — 2.5× slower, up to 10% shifts, 20% change chance, keeps themes stable</span>
          </div>
        </div>
      </section>
      
      <section>
        <h2>⚡ Strobe Modes</h2>
        <p class="mode-intro">Press <kbd>S</kbd> to cycle through modes:</p>
        <div class="mode-list">
          <div class="mode-item">
            <span class="mode-name">FLASH</span>
            <span class="mode-desc">Standard flashing — 30% toggle chance on beat</span>
          </div>
          <div class="mode-item">
            <span class="mode-name">PULSE</span>
            <span class="mode-desc">Rapid pulsing — 80% toggle chance, layers flash frequently</span>
          </div>
          <div class="mode-item">
            <span class="mode-name">DRIFT</span>
            <span class="mode-desc">Slow transitions — 5% toggle chance, gradual layer changes</span>
          </div>
        </div>
      </section>
      
      <section>
        <h2>🎚️ Audio Tuning</h2>
        <ul>
          <li><strong>Global sensitivity</strong>: overall audio reactivity</li>
          <li><strong>Frequency boosts</strong>: enhance specific ranges</li>
          <li><strong>Beat gate</strong>: threshold for beat detection</li>
          <li><strong>Auto-suggest</strong>: automatic sensitivity adjustment</li>
        </ul>
      </section>
      
      <section>
        <h2>💡 Tips</h2>
        <ul>
          <li>Use <strong>fullscreen</strong> for best experience</li>
          <li>Try different <strong>themes</strong> on each layer</li>
          <li>Adjust <strong>sensitivity</strong> if visuals are too subtle or intense</li>
          <li>Enable <strong>Power Saver</strong> on laptops to save battery</li>
        </ul>
      </section>
    </div>
    
    <footer class="info-footer">
      <span>Press <kbd>?</kbd> or tap the help button to reopen</span>
    </footer>
  </div>
</div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    padding: 16px;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .info-panel {
    position: relative;
    max-width: 420px;
    max-height: 85vh;
    overflow-y: auto;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.2s ease;
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--color-text);
  }
  
  .info-header {
    padding: 16px 16px 12px;
    text-align: center;
    border-bottom: 1px solid var(--color-border);
  }
  
  .info-header h1 {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    color: var(--color-accent);
    margin-bottom: 8px;
  }
  
  .tagline {
    font-size: 11px;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
  
  .info-content {
    padding: 12px 16px;
  }
  
  section {
    margin-bottom: 14px;
  }
  
  section:last-child {
    margin-bottom: 0;
  }
  
  section h2 {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 8px;
    text-transform: none;
    letter-spacing: 0;
  }
  
  section h3 {
    font-size: 10px;
    font-weight: 500;
    color: var(--color-text-muted);
    margin-top: 10px;
    margin-bottom: 6px;
    text-transform: none;
    letter-spacing: 0;
  }
  
  section ul,
  section ol {
    padding-left: 16px;
    font-size: 10px;
    color: var(--color-text-muted);
    line-height: 1.6;
  }
  
  section li {
    margin-bottom: 4px;
  }
  
  section strong {
    color: var(--color-text);
  }
  
  .shortcuts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .shortcut {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    color: var(--color-text-muted);
  }
  
  .shortcut kbd,
  .shortcut .gesture {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    padding: 3px 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 9px;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .button-legend {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    color: var(--color-text-muted);
  }
  
  .legend-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-sm);
    font-size: 10px;
    font-weight: 600;
  }
  
  .legend-btn.r {
    background: rgba(99, 102, 241, 0.3);
    border: 1px solid var(--color-primary);
    color: var(--color-text);
  }
  
  .legend-btn.s {
    background: rgba(236, 72, 153, 0.3);
    border: 1px solid #ec4899;
    color: var(--color-text);
  }
  
  .mode-intro {
    font-size: 10px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }
  
  .mode-intro kbd {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 9px;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .mode-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .mode-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 10px;
  }
  
  .mode-name {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    padding: 3px 8px;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: 9px;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .mode-desc {
    color: var(--color-text-muted);
    line-height: 1.5;
    padding-top: 2px;
  }
  
  .info-footer {
    padding: 10px 16px;
    border-top: 1px solid var(--color-border);
    text-align: center;
    font-size: 9px;
    color: var(--color-text-dim);
  }
  
  .info-footer kbd {
    display: inline-block;
    padding: 2px 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    font-size: 9px;
  }
  
  
  @media (max-width: 767px) {
    .info-panel {
      max-width: 380px;
    }
  }
  
  
  @media (max-width: 480px) {
    .overlay {
      padding: 8px;
    }
    
    .info-panel {
      max-width: 100%;
      max-height: 90vh;
    }
    
    .info-header {
      padding: 12px 12px 10px;
    }
    
    .info-header h1 {
      font-size: 14px;
    }
    
    .tagline {
      font-size: 10px;
    }
    
    .info-content {
      padding: 10px 12px;
    }
    
    section h2 {
      font-size: 12px;
    }
    
    section ul,
    section ol {
      font-size: 11px;
    }
    
    .shortcut {
      font-size: 11px;
      padding: 4px 0;
    }
    
    .shortcut kbd,
    .shortcut .gesture {
      min-width: 40px;
      padding: 6px 10px;
      font-size: 10px;
    }
    
    .close-btn {
      width: 32px;
      height: 32px;
      font-size: 16px;
    }
    
    .legend-btn {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }
  }
</style>
