export interface Video {
  id: string;
  video_id: string | null;
  title: string;
  platform: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  subscribers_gained: number;
  watch_time_seconds: number;
  avg_view_duration_seconds: number;
  audience_retention_pct: number;
  ctr: number;
  hook_style: string;
  subtitle_style: string;
  caption: string;
  hashtags: string[];
  thumbnail_style: string;
  colour_grading: string;
  editing_style: string;
  cta: string;
  video_length_seconds: number;
  posting_time: string;
  posting_day: string;
  topic: string;
  emotion_score: number;
  energy_score: number;
  storytelling_score: number;
  viral_score: number;
  is_winner: boolean;
  created_at: string;
}

export interface ContentDNA {
  id: string;
  field_key: string;
  field_label: string;
  field_value: string;
  category: string;
  confidence_score: number;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  category: string;
  headline: string;
  detail: string;
  impact_pct: number;
  confidence: string;
  supporting_video_ids: string[];
  dismissed: boolean;
  created_at: string;
}

export interface Prediction {
  id: string;
  project_name: string;
  platform: string;
  predicted_views: number;
  predicted_retention: number;
  predicted_shares: number;
  predicted_likes: number;
  predicted_comments: number;
  predicted_watch_time: number;
  predicted_followers: number;
  viral_score: number;
  confidence_level: string;
  confidence_pct: number;
  created_at: string;
}

export interface CalendarItem {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  platform: string;
  edit_style: string;
  thumbnail_style: string;
  caption: string;
  hashtags: string[];
  cta: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface ContentPlan {
  id: string;
  format: string;
  title: string;
  angle: string;
  rationale: string;
  priority_score: number;
  status: string;
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  source_video_id: string | null;
  asset_type: string;
  platform: string;
  content: string;
  status: string;
  created_at: string;
}

export interface LearningInsight {
  id: string;
  dimension: string;
  value: string;
  metric: string;
  performance_lift_pct: number;
  sample_size: number;
  confidence: string;
  created_at: string;
}

export type ViewKey =
  | 'dashboard'
  | 'memory'
  | 'upload'
  | 'clip-generator'
  | 'learning'
  | 'dna'
  | 'recommendations'
  | 'predictions'
  | 'planner'
  | 'calendar'
  | 'evolution';
