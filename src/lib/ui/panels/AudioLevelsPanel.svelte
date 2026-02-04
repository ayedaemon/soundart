<script lang="ts">
  import { processedAudio } from '$lib/stores/audio';
  import LevelMeter from '$lib/ui/controls/LevelMeter.svelte';
  
  export let visible: boolean = true;
</script>

{#if visible}
<div class="panel levels-panel">
  <div class="panel-header" title="Real-time audio levels from your microphone">
    <span class="panel-title">LEVELS</span>
  </div>
  
  <div class="levels-grid">
    <div title="High frequencies - cymbals, hi-hats, bright sounds">
      <LevelMeter label="HI" value={$processedAudio.raw.highs} />
    </div>
    <div title="Mid frequencies - vocals, guitars, main melody">
      <LevelMeter label="MD" value={$processedAudio.raw.mids} />
    </div>
    <div title="Low frequencies - bass, kick drum, rumble">
      <LevelMeter label="LO" value={$processedAudio.raw.lows} />
    </div>
    <div title="Treble - combined high-pitched sounds">
      <LevelMeter label="TR" value={$processedAudio.raw.treble} />
    </div>
    <div title="Bass - combined low-pitched sounds">
      <LevelMeter label="BS" value={$processedAudio.raw.bass} />
    </div>
    <div title="Beat detection - pulses when drums or strong beats hit">
      <LevelMeter label="BT" value={$processedAudio.raw.beat} />
    </div>
  </div>
</div>
{/if}

<style>
  .panel {
    position: fixed;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-panel);
  }
  
  .levels-panel {
    bottom: 8px;
    left: 8px;
    width: 160px;
    padding: 6px 8px;
  }
  
  .panel-header {
    display: flex;
    justify-content: center;
    margin-bottom: 6px;
  }
  
  .panel-title {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--color-accent);
  }
  
  .levels-grid {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  
  /* Hide on screens smaller than 1024px (low priority panel) */
  @media (max-width: 1023px) {
    .levels-panel {
      display: none;
    }
  }
</style>
