/*
# Audio Chunks Storage Bucket

1. Creates a storage bucket for audio chunks that need to be transcribed by Whisper.
2. Adds policies allowing anon + authenticated to upload, read, and delete audio chunks.
3. This bucket is used by the AI Clip Generator to upload extracted audio segments for transcription.
*/

INSERT INTO storage.buckets (id, name, public) VALUES ('audio-chunks', 'audio-chunks', false) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_audio_chunks" ON storage.objects;
CREATE POLICY "anon_upload_audio_chunks" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'audio-chunks');

DROP POLICY IF EXISTS "anon_read_audio_chunks" ON storage.objects;
CREATE POLICY "anon_read_audio_chunks" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'audio-chunks');

DROP POLICY IF EXISTS "anon_delete_audio_chunks" ON storage.objects;
CREATE POLICY "anon_delete_audio_chunks" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'audio-chunks');
