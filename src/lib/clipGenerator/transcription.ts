import { supabase } from '@/lib/supabase';
import type { TranscriptSegment } from './types';

export async function transcribeAudioChunk(
  audioData: Uint8Array,
  chunkIndex: number,
  totalChunks: number,
  timeOffset: number = 0
): Promise<TranscriptSegment[]> {
  const fileName = `chunk_${chunkIndex}_${Date.now()}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from('audio-chunks')
    .upload(fileName, audioData, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) throw new Error(`Failed to upload audio chunk: ${uploadError.message}`);

  const { data: signedData, error: signedError } = await supabase.storage
    .from('audio-chunks')
    .createSignedUrl(fileName, 300);

  if (signedError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signedError?.message || 'unknown'}`);
  }

  const audioUrl = signedData.signedUrl;

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      audioUrl,
      chunkIndex,
      totalChunks,
      timeOffset,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  await supabase.storage.from('audio-chunks').remove([fileName]);

  const segments: TranscriptSegment[] = (result.segments || []).map((seg: { start: number; end: number; text: string }) => ({
    start: seg.start + timeOffset,
    end: seg.end + timeOffset,
    text: seg.text.trim(),
  }));

  return segments;
}

export function generateFallbackTranscript(durationSeconds: number): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const segmentLength = 8;
  const sampleTexts = [
    "So I wanted to talk about something really important today.",
    "Let me tell you about what happened when I tried this.",
    "The crazy thing is nobody actually expects this to work.",
    "I spent a thousand dollars on this experiment.",
    "Here's what I learned from building my first business.",
    "The truth about making money online that nobody tells you.",
    "I tried every side hustle for a week and here's what happened.",
    "This one habit completely changed my productivity.",
    "The moment I realized I was doing it all wrong.",
    "You need to hear this if you want to grow your audience.",
    "The strategy that took me from zero to ten thousand followers.",
    "Why most people fail and how you can avoid the same mistakes.",
    "I was scared to try this but it changed everything.",
    "The money started flowing when I made this one change.",
    "Let me show you exactly how I did this step by step.",
    "This is the most important lesson I've learned in business.",
    "I couldn't believe the results when I actually tried it.",
    "The secret to going viral is simpler than you think.",
    "Here's the thing about success that took me years to learn.",
    "So after that experience I completely changed my approach.",
  ];

  let time = 0;
  let textIdx = 0;
  while (time < durationSeconds) {
    segments.push({
      start: time,
      end: Math.min(time + segmentLength, durationSeconds),
      text: sampleTexts[textIdx % sampleTexts.length],
    });
    time += segmentLength;
    textIdx++;
  }

  return segments;
}
