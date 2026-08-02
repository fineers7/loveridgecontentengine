import type { PipelineConfig } from './types';

export const PIPELINE_CONFIGS: PipelineConfig[] = [
  {
    name: 'Viral Yellow',
    subtitle_style: 'Yellow bold bottom-center with black outline',
    zoom_behavior: 'Punch-in zoom on key moments (1.0x → 1.3x over 2s)',
    colour_grading: 'Warm boost — increased saturation and contrast',
    motion: 'Subtle shake on emphasis words',
    cta: 'Subscribe overlay at 80% through clip',
    progress_bar_style: 'Thin yellow progress bar at bottom edge',
    animation_style: 'Quick cuts every 2-3s with zoom punches',
  },
  {
    name: 'Cinematic Teal',
    subtitle_style: 'White clean center-positioned with subtle shadow',
    zoom_behavior: 'Slow push-in from 1.0x to 1.15x across clip duration',
    colour_grading: 'Teal-orange cinematic LUT — shadows pushed teal, highlights pushed warm',
    motion: 'Smooth stabilized — no shake',
    cta: 'Follow overlay fades in at end',
    progress_bar_style: 'Gradient teal-to-cyan progress bar at bottom',
    animation_style: 'Slow crossfade transitions with smooth zoom',
  },
  {
    name: 'Energetic Pink',
    subtitle_style: 'Pink bold with white outline, bouncy animation per word',
    zoom_behavior: 'Rapid zoom punches (1.0x → 1.5x) on every sentence',
    colour_grading: 'Vibrant pop — +20% saturation, +10% brightness',
    motion: 'Dynamic shake synced to speech rhythm',
    cta: 'Like & Follow pulsing badge at 50% through',
    progress_bar_style: 'Neon pink segmented progress bar',
    animation_style: 'Fast cuts every 1-2s with bounce transitions',
  },
  {
    name: 'Documentary Clean',
    subtitle_style: 'White minimal bottom-left, no outline, small font',
    zoom_behavior: 'Static framing — no zoom, locked composition',
    colour_grading: 'Natural grade — neutral colours, slight contrast lift',
    motion: 'No shake — smooth static',
    cta: 'Subscribe text at very end, 2s hold',
    progress_bar_style: 'Minimal thin white progress bar, bottom right',
    animation_style: 'Long takes, minimal cuts, let the content breathe',
  },
  {
    name: 'High Contrast Mono',
    subtitle_style: 'Black background strip with white text, center screen',
    zoom_behavior: 'Snap zoom to 1.4x on hook, settle to 1.1x for body',
    colour_grading: 'High contrast B&W with selective colour on subject',
    motion: 'Hard cut shake on punchy moments',
    cta: 'Full-screen CTA card at end — black bg, white text',
    progress_bar_style: 'Bold black-to-white progress bar, top edge',
    animation_style: 'Hard cuts with impact zooms, documentary-style',
  },
];

export function getPipelineConfig(index: number): PipelineConfig {
  return PIPELINE_CONFIGS[index % PIPELINE_CONFIGS.length];
}
