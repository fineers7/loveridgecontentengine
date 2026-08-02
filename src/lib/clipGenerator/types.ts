export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface ClipProject {
  id: string;
  filename: string;
  file_size: number;
  duration_seconds: number;
  platform: string;
  status: string;
  transcript: TranscriptSegment[] | null;
  clip_count: number;
  created_at: string;
}

export interface Clip {
  id: string;
  project_id: string;
  title: string;
  start_time: number;
  end_time: number;
  length_seconds: number;
  reason: string;
  viral_confidence: number;
  tags: string[];
  status: string;
  order_index: number;
  created_at: string;
}

export interface ClipVersion {
  id: string;
  clip_id: string;
  pipeline_name: string;
  subtitle_style: string;
  zoom_behavior: string;
  colour_grading: string;
  motion: string;
  cta: string;
  progress_bar_style: string;
  animation_style: string;
  status: string;
  output_filename: string | null;
  created_at: string;
}

export interface PipelineConfig {
  name: string;
  subtitle_style: string;
  zoom_behavior: string;
  colour_grading: string;
  motion: string;
  cta: string;
  progress_bar_style: string;
  animation_style: string;
}

export interface DetectedMoment {
  start: number;
  end: number;
  text: string;
  tags: string[];
  score: number;
}

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'extracting_audio'
  | 'transcribing'
  | 'analyzing'
  | 'detecting_clips'
  | 'ready'
  | 'processing_clip'
  | 'exporting'
  | 'done'
  | 'error';

export interface ProcessingProgress {
  stage: ProcessingStage;
  progress: number;
  message: string;
}
