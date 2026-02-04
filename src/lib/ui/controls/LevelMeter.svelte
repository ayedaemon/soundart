<script lang="ts">
  export let label: string;
  export let value: number = 0;
  export let max: number = 1;
  
  $: percentage = Math.min(100, (value / max) * 100);
  $: displayValue = value.toFixed(2);
</script>

<div class="level-meter">
  <span class="level-label">{label}</span>
  <div class="level-bar">
    <div class="level-fill" style="width: {percentage}%"></div>
  </div>
  <span class="level-value">{displayValue}</span>
</div>

<style>
  .level-meter {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
  }
  
  .level-label {
    color: var(--color-text-muted);
    min-width: 32px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  
  .level-bar {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  
  .level-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    border-radius: var(--radius-full);
    transition: width 50ms linear;
  }
  
  .level-value {
    color: var(--color-text-dim);
    font-variant-numeric: tabular-nums;
    min-width: 28px;
    text-align: right;
  }
</style>
