/*
# AI Viral Intelligence — Core Schema

1. Overview
This migration creates the complete data layer for an AI Viral Intelligence platform.
It is a single-tenant app (no sign-in screen), so all policies use `TO anon, authenticated`
and the data is intentionally shared within the workspace.

2. New Tables
- `videos`: Personal Viral Memory — one row per published video with full performance + creative metadata.
- `content_dna`: Creator profile describing editing style, humour, energy, topics, brand colours, etc.
- `recommendations`: AI-generated, data-driven recommendations derived from video performance.
- `predictions`: Pre-export viral predictions for upcoming content.
- `calendar_items`: AI-built publishing calendar (day, time, platform, style, assets).
- `content_plans`: AI-suggested future content ideas across platforms and formats.
- `generated_assets`: Autonomous agency output — shorts, tiktoks, reels, thumbnails, captions, etc. derived from a source video.
- `learning_insights`: Discovered patterns from the learning engine (hook performance, subtitle performance, etc.).

3. Columns (key tables)
`videos`:
  id, video_id (platform id), title, platform, published_at, views, likes, comments,
  shares, saves, followers_gained, subscribers_gained, watch_time_seconds,
  avg_view_duration_seconds, audience_retention_pct, ctr, hook_style, subtitle_style,
  caption, hashtags (text[]), thumbnail_style, colour_grading, editing_style, cta,
  video_length_seconds, posting_time, posting_day, topic, emotion_score, energy_score,
  storytelling_score, viral_score, is_winner, created_at.

`content_dna`:
  id, field_key, field_label, field_value, category, confidence_score, updated_at.
  Stores the creator's evolving profile as flexible key/value rows.

`recommendations`:
  id, category, headline, detail, impact_pct, confidence, supporting_video_ids (uuid[]),
  created_at, dismissed.

`predictions`:
  id, project_name, platform, predicted_views, predicted_retention, predicted_shares,
  predicted_likes, predicted_comments, predicted_watch_time, predicted_followers,
  viral_score, confidence_level, confidence_pct, created_at.

`calendar_items`:
  id, scheduled_date, scheduled_time, platform, edit_style, thumbnail_style,
  caption, hashtags (text[]), cta, status, notes, created_at.

`content_plans`:
  id, format (YouTube/Short/TikTok/Reel/Podcast/Blog/Newsletter/etc.), title, angle,
  rationale, priority_score, status, created_at.

`generated_assets`:
  id, source_video_id (fk -> videos), asset_type (Short/TikTok/Reel/Thumbnail/Title/
  Caption/Hashtags/Description/CommunityPost/Blog/Newsletter/XPost/LinkedIn/Facebook),
  platform, content, status, created_at.

`learning_insights`:
  id, dimension (hook/subtitle/cta/colour/editing/length/time/day/topic/emotion),
  value, metric, performance_lift_pct, sample_size, confidence, created_at.

4. Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant workspace app with no sign-in screen — the data is
  intentionally shared/public within the workspace.

5. Indexes
- videos: platform, published_at, viral_score, is_winner.
- recommendations: category, dismissed.
- calendar_items: scheduled_date.
- content_plans: format, status, priority_score.
- generated_assets: source_video_id, asset_type.
- learning_insights: dimension.
*/

-- ===== videos =====
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text,
  title text NOT NULL DEFAULT 'Untitled',
  platform text NOT NULL DEFAULT 'YouTube',
  published_at date NOT NULL DEFAULT CURRENT_DATE,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  followers_gained integer NOT NULL DEFAULT 0,
  subscribers_gained integer NOT NULL DEFAULT 0,
  watch_time_seconds bigint NOT NULL DEFAULT 0,
  avg_view_duration_seconds numeric NOT NULL DEFAULT 0,
  audience_retention_pct numeric NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  hook_style text NOT NULL DEFAULT 'Direct',
  subtitle_style text NOT NULL DEFAULT 'White',
  caption text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  thumbnail_style text NOT NULL DEFAULT 'Standard',
  colour_grading text NOT NULL DEFAULT 'Natural',
  editing_style text NOT NULL DEFAULT 'Standard',
  cta text NOT NULL DEFAULT 'Subscribe',
  video_length_seconds integer NOT NULL DEFAULT 0,
  posting_time text NOT NULL DEFAULT '12:00',
  posting_day text NOT NULL DEFAULT 'Monday',
  topic text NOT NULL DEFAULT 'General',
  emotion_score numeric NOT NULL DEFAULT 50,
  energy_score numeric NOT NULL DEFAULT 50,
  storytelling_score numeric NOT NULL DEFAULT 50,
  viral_score numeric NOT NULL DEFAULT 0,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_videos" ON videos;
CREATE POLICY "anon_select_videos" ON videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_videos" ON videos;
CREATE POLICY "anon_insert_videos" ON videos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_videos" ON videos;
CREATE POLICY "anon_update_videos" ON videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_videos" ON videos;
CREATE POLICY "anon_delete_videos" ON videos FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_videos_platform ON videos (platform);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_viral ON videos (viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_winner ON videos (is_winner);

-- ===== content_dna =====
CREATE TABLE IF NOT EXISTS content_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL UNIQUE,
  field_label text NOT NULL,
  field_value text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  confidence_score numeric NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_dna ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dna" ON content_dna;
CREATE POLICY "anon_select_dna" ON content_dna FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dna" ON content_dna;
CREATE POLICY "anon_insert_dna" ON content_dna FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dna" ON content_dna;
CREATE POLICY "anon_update_dna" ON content_dna FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dna" ON content_dna;
CREATE POLICY "anon_delete_dna" ON content_dna FOR DELETE TO anon, authenticated USING (true);

-- ===== recommendations =====
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'General',
  headline text NOT NULL,
  detail text NOT NULL DEFAULT '',
  impact_pct numeric NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'Medium',
  supporting_video_ids uuid[] NOT NULL DEFAULT '{}',
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_recs" ON recommendations;
CREATE POLICY "anon_select_recs" ON recommendations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_recs" ON recommendations;
CREATE POLICY "anon_insert_recs" ON recommendations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_recs" ON recommendations;
CREATE POLICY "anon_update_recs" ON recommendations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_recs" ON recommendations;
CREATE POLICY "anon_delete_recs" ON recommendations FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_recs_category ON recommendations (category);
CREATE INDEX IF NOT EXISTS idx_recs_dismissed ON recommendations (dismissed);

-- ===== predictions =====
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL DEFAULT 'Untitled Project',
  platform text NOT NULL DEFAULT 'YouTube',
  predicted_views integer NOT NULL DEFAULT 0,
  predicted_retention numeric NOT NULL DEFAULT 0,
  predicted_shares integer NOT NULL DEFAULT 0,
  predicted_likes integer NOT NULL DEFAULT 0,
  predicted_comments integer NOT NULL DEFAULT 0,
  predicted_watch_time bigint NOT NULL DEFAULT 0,
  predicted_followers integer NOT NULL DEFAULT 0,
  viral_score numeric NOT NULL DEFAULT 0,
  confidence_level text NOT NULL DEFAULT 'Medium',
  confidence_pct numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_preds" ON predictions;
CREATE POLICY "anon_select_preds" ON predictions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_preds" ON predictions;
CREATE POLICY "anon_insert_preds" ON predictions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_preds" ON predictions;
CREATE POLICY "anon_update_preds" ON predictions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_preds" ON predictions;
CREATE POLICY "anon_delete_preds" ON predictions FOR DELETE TO anon, authenticated USING (true);

-- ===== calendar_items =====
CREATE TABLE IF NOT EXISTS calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  scheduled_time text NOT NULL DEFAULT '12:00',
  platform text NOT NULL DEFAULT 'YouTube',
  edit_style text NOT NULL DEFAULT 'Standard',
  thumbnail_style text NOT NULL DEFAULT 'Standard',
  caption text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  cta text NOT NULL DEFAULT 'Subscribe',
  status text NOT NULL DEFAULT 'Planned',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cal" ON calendar_items;
CREATE POLICY "anon_select_cal" ON calendar_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cal" ON calendar_items;
CREATE POLICY "anon_insert_cal" ON calendar_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cal" ON calendar_items;
CREATE POLICY "anon_update_cal" ON calendar_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cal" ON calendar_items;
CREATE POLICY "anon_delete_cal" ON calendar_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cal_date ON calendar_items (scheduled_date);

-- ===== content_plans =====
CREATE TABLE IF NOT EXISTS content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format text NOT NULL DEFAULT 'YouTube',
  title text NOT NULL,
  angle text NOT NULL DEFAULT '',
  rationale text NOT NULL DEFAULT '',
  priority_score numeric NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'Idea',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_plans" ON content_plans;
CREATE POLICY "anon_select_plans" ON content_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_plans" ON content_plans;
CREATE POLICY "anon_insert_plans" ON content_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_plans" ON content_plans;
CREATE POLICY "anon_update_plans" ON content_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_plans" ON content_plans;
CREATE POLICY "anon_delete_plans" ON content_plans FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_plans_format ON content_plans (format);
CREATE INDEX IF NOT EXISTS idx_plans_status ON content_plans (status);
CREATE INDEX IF NOT EXISTS idx_plans_priority ON content_plans (priority_score DESC);

-- ===== generated_assets =====
CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  asset_type text NOT NULL DEFAULT 'Short',
  platform text NOT NULL DEFAULT 'YouTube',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_assets" ON generated_assets;
CREATE POLICY "anon_select_assets" ON generated_assets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assets" ON generated_assets;
CREATE POLICY "anon_insert_assets" ON generated_assets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assets" ON generated_assets;
CREATE POLICY "anon_update_assets" ON generated_assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assets" ON generated_assets;
CREATE POLICY "anon_delete_assets" ON generated_assets FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_assets_source ON generated_assets (source_video_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON generated_assets (asset_type);

-- ===== learning_insights =====
CREATE TABLE IF NOT EXISTS learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension text NOT NULL DEFAULT 'hook',
  value text NOT NULL,
  metric text NOT NULL DEFAULT 'avg_retention',
  performance_lift_pct numeric NOT NULL DEFAULT 0,
  sample_size integer NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'Medium',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_insights" ON learning_insights;
CREATE POLICY "anon_select_insights" ON learning_insights FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_insights" ON learning_insights;
CREATE POLICY "anon_insert_insights" ON learning_insights FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_insights" ON learning_insights;
CREATE POLICY "anon_update_insights" ON learning_insights FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_insights" ON learning_insights;
CREATE POLICY "anon_delete_insights" ON learning_insights FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_insights_dimension ON learning_insights (dimension);
