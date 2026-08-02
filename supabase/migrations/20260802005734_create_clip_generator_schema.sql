/*
# AI Clip Generator Schema

1. Overview
Stores clip generation projects, detected clips, and their 5 edited versions
for the AI Clip Generator feature.

2. New Tables
- `clip_projects`: One per uploaded video. Stores filename, duration, transcript.
- `clips`: Individual clip recommendations detected from the transcript.
- `clip_versions`: The 5 FFmpeg-pipeline edited versions per clip.

3. Columns
`clip_projects`:
  id, filename, file_size, duration_seconds, platform, status, transcript (jsonb),
  clip_count, created_at.

`clips`:
  id, project_id (fk -> clip_projects), title, start_time, end_time, length_seconds,
  reason, viral_confidence, tags (text[]), status, order_index, created_at.

`clip_versions`:
  id, clip_id (fk -> clips), pipeline_name, subtitle_style, zoom_behavior,
  colour_grading, motion, cta, progress_bar_style, animation_style, status,
  output_filename, created_at.

4. Security
- RLS enabled on all tables.
- Single-tenant app: TO anon, authenticated with USING (true) / WITH CHECK (true).

5. Indexes
- clips: project_id
- clip_versions: clip_id
*/

CREATE TABLE IF NOT EXISTS clip_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  duration_seconds numeric NOT NULL DEFAULT 0,
  platform text NOT NULL DEFAULT 'YouTube',
  status text NOT NULL DEFAULT 'uploaded',
  transcript jsonb,
  clip_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clip_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clip_projects" ON clip_projects;
CREATE POLICY "anon_select_clip_projects" ON clip_projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clip_projects" ON clip_projects;
CREATE POLICY "anon_insert_clip_projects" ON clip_projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clip_projects" ON clip_projects;
CREATE POLICY "anon_update_clip_projects" ON clip_projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clip_projects" ON clip_projects;
CREATE POLICY "anon_delete_clip_projects" ON clip_projects FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES clip_projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Clip',
  start_time numeric NOT NULL DEFAULT 0,
  end_time numeric NOT NULL DEFAULT 0,
  length_seconds numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  viral_confidence numeric NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'recommended',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clips" ON clips;
CREATE POLICY "anon_select_clips" ON clips FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clips" ON clips;
CREATE POLICY "anon_insert_clips" ON clips FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clips" ON clips;
CREATE POLICY "anon_update_clips" ON clips FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clips" ON clips;
CREATE POLICY "anon_delete_clips" ON clips FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_clips_project ON clips (project_id);

CREATE TABLE IF NOT EXISTS clip_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid REFERENCES clips(id) ON DELETE CASCADE,
  pipeline_name text NOT NULL,
  subtitle_style text NOT NULL DEFAULT '',
  zoom_behavior text NOT NULL DEFAULT '',
  colour_grading text NOT NULL DEFAULT '',
  motion text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT '',
  progress_bar_style text NOT NULL DEFAULT '',
  animation_style text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  output_filename text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clip_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clip_versions" ON clip_versions;
CREATE POLICY "anon_select_clip_versions" ON clip_versions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clip_versions" ON clip_versions;
CREATE POLICY "anon_insert_clip_versions" ON clip_versions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clip_versions" ON clip_versions;
CREATE POLICY "anon_update_clip_versions" ON clip_versions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clip_versions" ON clip_versions;
CREATE POLICY "anon_delete_clip_versions" ON clip_versions FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_clip_versions_clip ON clip_versions (clip_id);
