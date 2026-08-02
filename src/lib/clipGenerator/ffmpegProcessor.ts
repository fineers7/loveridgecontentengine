import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadPromise;
}

export interface FFmpegProgressCallback {
  (progress: number, time: number): void;
}

export async function extractAudio(
  file: File,
  onProgress?: FFmpegProgressCallback
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input_video';
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  await ffmpeg.writeFile(`${inputName}.${ext}`, await fetchFile(file));

  const outputName = 'output_audio.mp3';

  ffmpeg.on('progress', ({ progress, time }) => {
    onProgress?.(progress, time);
  });

  try {
    await ffmpeg.exec([
      '-i', `${inputName}.${ext}`,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '64k',
      '-ac', '1',
      '-ar', '16000',
      outputName,
    ]);
  } finally {
    ffmpeg.off('progress', () => {});
  }

  const data = await ffmpeg.readFile(outputName);

  try { await ffmpeg.deleteFile(`${inputName}.${ext}`); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  return data as Uint8Array;
}

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    video.src = URL.createObjectURL(file);
  });
}

export interface ClipExportParams {
  file: File;
  startTime: number;
  endTime: number;
  pipelineIndex: number;
  clipTitle: string;
  onProgress?: FFmpegProgressCallback;
}

export interface ClipExportResult {
  blob: Blob;
  filename: string;
  pipelineName: string;
  duration: number;
}

export async function exportClipWithPipeline(params: ClipExportParams): Promise<ClipExportResult> {
  const { file, startTime, endTime, pipelineIndex, clipTitle, onProgress } = params;
  const ffmpeg = await getFFmpeg();

  const inputName = 'source_video';
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  await ffmpeg.writeFile(`${inputName}.${ext}`, await fetchFile(file));

  const pipelineNames = ['Viral Yellow', 'Cinematic Teal', 'Energetic Pink', 'Documentary Clean', 'High Contrast Mono'];
  const pipelineName = pipelineNames[pipelineIndex % pipelineNames.length];
  const outputName = `clip_${pipelineIndex}_${Date.now()}.mp4`;

  const duration = endTime - startTime;
  const safeTitle = clipTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);

  const filters = buildFFmpegFilter(pipelineIndex, duration);

  ffmpeg.on('progress', ({ progress, time }) => {
    onProgress?.(progress, time);
  });

  try {
    const args = [
      '-i', `${inputName}.${ext}`,
      '-ss', startTime.toFixed(2),
      '-t', duration.toFixed(2),
      ...filters,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputName,
    ];

    await ffmpeg.exec(args);
  } finally {
    ffmpeg.off('progress', () => {});
  }

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data as Uint8Array], { type: 'video/mp4' });

  try { await ffmpeg.deleteFile(`${inputName}.${ext}`); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  return {
    blob,
    filename: `${safeTitle}_${pipelineName.replace(/\s/g, '_')}.mp4`,
    pipelineName,
    duration,
  };
}

function buildFFmpegFilter(pipelineIndex: number, duration: number): string[] {
  const filters: string[] = ['-vf'];

  switch (pipelineIndex % 5) {
    case 0: // Viral Yellow — warm boost + zoompan
      filters.push(`eq=saturation=1.3:contrast=1.1:brightness=0.05,zoompan=z='min(zoom+0.0015,1.3)':d=1:s=960x1706`);
      break;
    case 1: // Cinematic Teal — teal-orange
      filters.push(`curves=r='0 0.1 0.5 0.9 1':g='0 0.05 0.5 0.95 1':b='0 0.2 0.5 0.8 1',eq=saturation=1.1:contrast=1.05,zoompan=z='min(zoom+0.0008,1.15)':d=1:s=960x1706`);
      break;
    case 2: // Energetic Pink — vibrant pop
      filters.push(`eq=saturation=1.5:brightness=0.1:contrast=1.15,zoompan=z='if(lte(on,1),1.0,max(1.5,zoom-0.05))':d=1:s=960x1706`);
      break;
    case 3: // Documentary Clean — natural
      filters.push(`eq=saturation=1.0:contrast=1.05,scale=960:1706:force_original_aspect_ratio=increase,crop=960:1706`);
      break;
    case 4: // High Contrast Mono
      filters.push(`hue=s=0:u=0,eq=contrast=1.3:brightness=0.02,zoompan=z='if(lte(on,1),1.4,1.1)':d=1:s=960x1706`);
      break;
  }

  return filters;
}

export async function extractAudioChunk(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: FFmpegProgressCallback
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputName = 'source_for_audio';
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  await ffmpeg.writeFile(`${inputName}.${ext}`, await fetchFile(file));

  const outputName = 'audio_chunk.mp3';
  const duration = endTime - startTime;

  ffmpeg.on('progress', ({ progress, time }) => {
    onProgress?.(progress, time);
  });

  try {
    await ffmpeg.exec([
      '-i', `${inputName}.${ext}`,
      '-ss', startTime.toFixed(2),
      '-t', duration.toFixed(2),
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '64k',
      '-ac', '1',
      '-ar', '16000',
      outputName,
    ]);
  } finally {
    ffmpeg.off('progress', () => {});
  }

  const data = await ffmpeg.readFile(outputName);

  try { await ffmpeg.deleteFile(`${inputName}.${ext}`); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  return data as Uint8Array;
}
