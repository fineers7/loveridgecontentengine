import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  UploadCloud, FileVideo, X, Play, Pause, Loader2,
  Scissors, Download, Trash2, Edit2, Check, ChevronRight,
  Sparkles, Clock, TrendingUp, Film, Wand2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import type {
  ClipProject, Clip, ClipVersion, TranscriptSegment,
  ProcessingStage, ProcessingProgress, PipelineConfig,
} from '@/lib/clipGenerator/types';
import {
  analyzeTranscript, detectClips, generateClipTitle, generateClipReason,
} from '@/lib/clipGenerator/analysis';
import {
  getVideoDuration, extractAudioChunk, exportClipWithPipeline, getFFmpeg,
} from '@/lib/clipGenerator/ffmpegProcessor';
import {
  transcribeAudioChunk, generateFallbackTranscript,
} from '@/lib/clipGenerator/transcription';
import { PIPELINE_CONFIGS } from '@/lib/clipGenerator/pipelines';
import { formatDuration } from '@/lib/utils';

const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime'];
const ACCEPTED_EXTS = ['.mp4', '.mov'];
const MAX_DURATION = 4 * 3600;
const CHUNK_DURATION = 600;

interface ClipGeneratorProps {}

export function ClipGenerator({}: ClipGeneratorProps) {
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [project, setProject] = useState<ClipProject | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [versions, setVersions] = useState<Record<string, ClipVersion[]>>({});
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [exportingClips, setExportingClips] = useState<Set<string>>(new Set());
  const [exportProgress, setExportProgress] = useState<Record<string, number>>({});
  const [exportedBlobs, setExportedBlobs] = useState<Record<string, Blob>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingClip, setEditingClip] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', start: '', end: '' });

  const updateProgress = useCallback((p: number, msg: string, st: ProcessingStage) => {
    setProgress(p);
    setStatusMessage(msg);
    setStage(st);
  }, []);

  const handleFile = useCallback(async (selectedFile: File) => {
    setError(null);

    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext) && !ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please upload an MP4 or MOV file');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File exceeds 20GB limit');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);

    updateProgress(5, 'Reading video metadata...', 'uploading');

    try {
      const dur = await getVideoDuration(selectedFile);
      setDuration(dur);

      if (dur > MAX_DURATION) {
        setError('Video exceeds 4 hour limit');
        setStage('idle');
        return;
      }

      updateProgress(15, 'Creating project...', 'uploading');

      const { data: projData, error: projError } = await supabase
        .from('clip_projects')
        .insert({
          filename: selectedFile.name,
          file_size: selectedFile.size,
          duration_seconds: dur,
          platform: 'YouTube',
          status: 'processing',
        })
        .select()
        .single();

      if (projError) throw projError;
      setProject(projData as ClipProject);

      updateProgress(25, 'Loading FFmpeg engine...', 'extracting_audio');
      await getFFmpeg();

      await processTranscription(selectedFile, dur, projData.id);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setStage('error');
    }
  }, [updateProgress]);

  const processTranscription = async (vidFile: File, dur: number, projId: string) => {
    const numChunks = Math.ceil(dur / CHUNK_DURATION);
    const allSegments: TranscriptSegment[] = [];

    for (let i = 0; i < numChunks; i++) {
      const chunkStart = i * CHUNK_DURATION;
      const chunkEnd = Math.min((i + 1) * CHUNK_DURATION, dur);

      const chunkProgress = 30 + (i / numChunks) * 30;
      updateProgress(chunkProgress, `Extracting audio chunk ${i + 1}/${numChunks}...`, 'extracting_audio');

      try {
        const audioData = await extractAudioChunk(vidFile, chunkStart, chunkEnd);

        updateProgress(chunkProgress + 5, `Transcribing chunk ${i + 1}/${numChunks} with Whisper...`, 'transcribing');

        const segments = await transcribeAudioChunk(audioData, i, numChunks, chunkStart);
        allSegments.push(...segments);
      } catch (err) {
        console.warn(`Chunk ${i} transcription failed, using fallback:`, err);
      }
    }

    let finalTranscript = allSegments;
    if (finalTranscript.length === 0) {
      updateProgress(60, 'Generating fallback transcript...', 'transcribing');
      finalTranscript = generateFallbackTranscript(dur);
    }

    setTranscript(finalTranscript);

    await supabase.from('clip_projects').update({
      transcript: finalTranscript as any,
      status: 'analyzing',
    }).eq('id', projId);

    updateProgress(70, 'Analyzing transcript for viral moments...', 'analyzing');
    await new Promise(r => setTimeout(r, 500));

    const moments = analyzeTranscript(finalTranscript);

    updateProgress(80, 'Detecting clip recommendations...', 'detecting_clips');
    await new Promise(r => setTimeout(r, 500));

    const detectedClips = detectClips(moments, finalTranscript, 35);

    const clipRows: Omit<Clip, 'id' | 'created_at'>[] = detectedClips.map((m, i) => ({
      project_id: projId,
      title: generateClipTitle(m, i),
      start_time: m.start,
      end_time: m.end,
      length_seconds: m.end - m.start,
      reason: generateClipReason(m.tags, m.score),
      viral_confidence: Math.round(m.score),
      tags: m.tags,
      status: 'recommended',
      order_index: i,
    }));

    const { data: insertedClips, error: clipsError } = await supabase
      .from('clips')
      .insert(clipRows)
      .select();

    if (clipsError) throw clipsError;

    const clipData = insertedClips as Clip[];
    setClips(clipData);

    const versionRows: Omit<ClipVersion, 'id' | 'created_at' | 'output_filename'>[] = [];
    for (const clip of clipData) {
      for (let p = 0; p < PIPELINE_CONFIGS.length; p++) {
        const config = PIPELINE_CONFIGS[p];
        versionRows.push({
          clip_id: clip.id,
          pipeline_name: config.name,
          subtitle_style: config.subtitle_style,
          zoom_behavior: config.zoom_behavior,
          colour_grading: config.colour_grading,
          motion: config.motion,
          cta: config.cta,
          progress_bar_style: config.progress_bar_style,
          animation_style: config.animation_style,
          status: 'pending',
        });
      }
    }

    const { data: insertedVersions, error: versionsError } = await supabase
      .from('clip_versions')
      .insert(versionRows)
      .select();

    if (versionsError) throw versionsError;

    const versionMap: Record<string, ClipVersion[]> = {};
    for (const v of insertedVersions as ClipVersion[]) {
      (versionMap[v.clip_id] ||= []).push(v);
    }
    setVersions(versionMap);

    await supabase.from('clip_projects').update({
      status: 'ready',
      clip_count: clipData.length,
    }).eq('id', projId);

    updateProgress(100, `Detected ${clipData.length} clips ready for editing`, 'ready');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const handleDeleteClip = async (clipId: string) => {
    await supabase.from('clips').delete().eq('id', clipId);
    setClips(prev => prev.filter(c => c.id !== clipId));
    setVersions(prev => {
      const next = { ...prev };
      delete next[clipId];
      return next;
    });
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const startEdit = (clip: Clip) => {
    setEditingClip(clip.id);
    setEditForm({
      title: clip.title,
      start: clip.start_time.toFixed(1),
      end: clip.end_time.toFixed(1),
    });
  };

  const saveEdit = async (clipId: string) => {
    const newStart = parseFloat(editForm.start);
    const newEnd = parseFloat(editForm.end);
    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) return;

    const newLength = newEnd - newStart;
    await supabase.from('clips').update({
      title: editForm.title,
      start_time: newStart,
      end_time: newEnd,
      length_seconds: newLength,
    }).eq('id', clipId);

    setClips(prev => prev.map(c => c.id === clipId ? {
      ...c, title: editForm.title, start_time: newStart, end_time: newEnd, length_seconds: newLength,
    } : c));
    setEditingClip(null);
  };

  const handleExportClip = async (clipId: string) => {
    if (!file) return;
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    setExportingClips(prev => new Set(prev).add(clipId));

    const clipVersions = versions[clipId] || [];
    const updatedVersions: Record<string, ClipVersion> = {};

    for (let p = 0; p < clipVersions.length; p++) {
      const version = clipVersions[p];
      const progressKey = `${clipId}_${p}`;
      setExportProgress(prev => ({ ...prev, [progressKey]: 0 }));

      try {
        const result = await exportClipWithPipeline({
          file,
          startTime: clip.start_time,
          endTime: clip.end_time,
          pipelineIndex: p,
          clipTitle: clip.title,
          onProgress: (prog) => {
            setExportProgress(prev => ({ ...prev, [progressKey]: Math.round(prog * 100) }));
          },
        });

        const blobKey = `${clipId}_${p}`;
        setExportedBlobs(prev => ({ ...prev, [blobKey]: result.blob }));

        updatedVersions[version.id] = { ...version, status: 'exported', output_filename: result.filename };

        await supabase.from('clip_versions').update({
          status: 'exported',
          output_filename: result.filename,
        }).eq('id', version.id);

      } catch (err) {
        console.error(`Export pipeline ${p} failed:`, err);
        updatedVersions[version.id] = { ...version, status: 'failed' };
        await supabase.from('clip_versions').update({ status: 'failed' }).eq('id', version.id);
      }
    }

    setVersions(prev => ({
      ...prev,
      [clipId]: (prev[clipId] || []).map(v => updatedVersions[v.id] || v),
    }));

    await supabase.from('clips').update({ status: 'exported' }).eq('id', clipId);
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, status: 'exported' } : c));

    setExportingClips(prev => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setFile(null);
    setVideoUrl(null);
    setDuration(0);
    setProject(null);
    setClips([]);
    setVersions({});
    setTranscript([]);
    setError(null);
    setSelectedClipId(null);
    setExportingClips(new Set());
    setExportProgress({});
    setExportedBlobs({});
    setStage('idle');
    setProgress(0);
    setStatusMessage('');
  };

  const isProcessing = stage !== 'idle' && stage !== 'ready' && stage !== 'error' && stage !== 'done';
  const selectedClip = clips.find(c => c.id === selectedClipId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-50">AI Clip Generator</h2>
          <p className="text-sm text-ink-400 mt-1">Upload a long-form video and auto-generate viral short clips</p>
        </div>
        {file && (
          <button onClick={resetAll} className="btn-ghost">
            <X className="w-4 h-4" /> New Video
          </button>
        )}
      </div>

      {/* Upload zone */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`card p-12 border-2 border-dashed transition-all duration-300 ${
            dragActive ? 'border-brand-500 bg-brand-500/5' : 'border-white/10'
          }`}
        >
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
              dragActive ? 'bg-brand-500/20 scale-110' : 'bg-ink-800'
            }`}>
              <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-brand-300' : 'text-ink-400'}`} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-50 mb-2">Drag and drop your video</h3>
            <p className="text-sm text-ink-400 mb-4">MP4 or MOV · Up to 4 hours · Up to 20GB</p>
            <button onClick={handleBrowse} className="btn-primary">
              <FileVideo className="w-4 h-4" /> Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,video/mp4,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 flex items-center gap-3 border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Processing status */}
      {file && isProcessing && (
        <ProcessingStatus stage={stage} progress={progress} message={statusMessage} />
      )}

      {/* Video preview + results */}
      {file && videoUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video preview */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-4">
              <h3 className="section-title mb-3">Video Preview</h3>
              <VideoPreview src={videoUrl} />
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-400">Filename</span>
                  <span className="text-ink-200 truncate ml-2 max-w-[180px]">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Duration</span>
                  <span className="text-ink-200 font-mono">{formatDuration(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Size</span>
                  <span className="text-ink-200 font-mono">{(file.size / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Clips Found</span>
                  <span className="text-ink-200 font-mono">{clips.length}</span>
                </div>
              </div>
            </div>

            {selectedClip && (
              <ClipPreviewCard
                clip={selectedClip}
                videoUrl={videoUrl}
                versions={versions[selectedClip.id] || []}
                exportProgress={exportProgress}
                exportedBlobs={exportedBlobs}
                onDownload={downloadBlob}
              />
            )}
          </div>

          {/* Timeline + clips */}
          <div className="lg:col-span-2 space-y-4">
            {stage === 'ready' && clips.length > 0 && (
              <>
                <Timeline clips={clips} duration={duration} onSelect={setSelectedClipId} selectedId={selectedClipId} />

                <div className="flex items-center justify-between">
                  <h3 className="section-title">Recommended Clips ({clips.length})</h3>
                  <span className="text-xs text-ink-400">Click a clip to preview · Export to generate 5 versions</span>
                </div>

                <div className="space-y-3">
                  {clips.map((clip, i) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      index={i}
                      isSelected={selectedClipId === clip.id}
                      onSelect={() => setSelectedClipId(clip.id)}
                      onDelete={() => handleDeleteClip(clip.id)}
                      onEdit={() => startEdit(clip)}
                      onSaveEdit={() => saveEdit(clip.id)}
                      editing={editingClip === clip.id}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      onExport={() => handleExportClip(clip.id)}
                      exporting={exportingClips.has(clip.id)}
                      versions={versions[clip.id] || []}
                      exportProgress={exportProgress}
                      exportedBlobs={exportedBlobs}
                      onDownload={downloadBlob}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessingStatus({ stage, progress, message }: { stage: ProcessingStage; progress: number; message: string }) {
  const stages: { key: ProcessingStage; label: string; icon: typeof UploadCloud }[] = [
    { key: 'uploading', label: 'Uploading', icon: UploadCloud },
    { key: 'extracting_audio', label: 'Extracting Audio', icon: Film },
    { key: 'transcribing', label: 'Whisper Transcription', icon: Wand2 },
    { key: 'analyzing', label: 'AI Analysis', icon: Sparkles },
    { key: 'detecting_clips', label: 'Detecting Clips', icon: Scissors },
  ];

  const currentIdx = stages.findIndex(s => s.key === stage);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 text-brand-300 animate-spin" />
        <h3 className="section-title">{message}</h3>
      </div>

      <div className="w-full bg-ink-700 rounded-full h-2 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-electric-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={s.key} className="flex items-center">
              <div className={`flex flex-col items-center gap-1.5 ${i > 0 ? 'ml-3' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isDone ? 'bg-brand-500/20 text-brand-300' :
                  isActive ? 'bg-brand-500 text-ink-950 animate-pulse-glow' :
                  'bg-ink-800 text-ink-500'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[10px] ${isActive || isDone ? 'text-ink-200' : 'text-ink-500'}`}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < currentIdx ? 'bg-brand-500/50' : 'bg-ink-700'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideoPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current?.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-ink-950 group">
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        controls
      />
    </div>
  );
}

function Timeline({ clips, duration, onSelect, selectedId }: {
  clips: Clip[];
  duration: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-brand-300" />
        <h3 className="section-title">Clip Timeline</h3>
        <span className="ml-auto text-xs text-ink-400 font-mono">{formatDuration(duration)}</span>
      </div>

      <div
        className="relative h-16 bg-ink-800 rounded-xl overflow-hidden"
      >
        {clips.map((clip, i) => {
          const leftPct = (clip.start_time / duration) * 100;
          const widthPct = (clip.length_seconds / duration) * 100;
          const isSelected = selectedId === clip.id;
          const isHovered = hovered === i;
          return (
            <button
              key={clip.id}
              onClick={() => onSelect(clip.id)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`absolute top-1 bottom-1 rounded-lg transition-all duration-200 cursor-pointer ${
                isSelected ? 'ring-2 ring-brand-400 z-10' : ''
              } ${
                clip.viral_confidence >= 70 ? 'bg-brand-500/60 hover:bg-brand-500/80' :
                clip.viral_confidence >= 50 ? 'bg-electric-500/60 hover:bg-electric-500/80' :
                'bg-accent-500/60 hover:bg-accent-500/80'
              }`}
              style={{
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 1)}%`,
              }}
              title={`${clip.title} (${formatDuration(clip.length_seconds)})`}
            />
          );
        })}

        {hovered !== null && (
          <div
            className="absolute -top-8 glass rounded-lg px-2 py-1 text-[10px] text-ink-100 pointer-events-none whitespace-nowrap z-20"
            style={{ left: `${(clips[hovered].start_time / duration) * 100}%` }}
          >
            {formatDuration(clips[hovered].start_time)} - {formatDuration(clips[hovered].end_time)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-ink-400">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-brand-500/60" /> High confidence</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-electric-500/60" /> Medium</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-accent-500/60" /> Lower</div>
      </div>
    </div>
  );
}

function ClipCard({ clip, index, isSelected, onSelect, onDelete, onEdit, onSaveEdit, editing, editForm, setEditForm, onExport, exporting, versions, exportProgress, exportedBlobs, onDownload }: {
  clip: Clip;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  editing: boolean;
  editForm: { title: string; start: string; end: string };
  setEditForm: (f: { title: string; start: string; end: string }) => void;
  onExport: () => void;
  exporting: boolean;
  versions: ClipVersion[];
  exportProgress: Record<string, number>;
  exportedBlobs: Record<string, Blob>;
  onDownload: (blob: Blob, filename: string) => void;
}) {
  const confidenceColor = clip.viral_confidence >= 70 ? 'text-brand-300' : clip.viral_confidence >= 50 ? 'text-electric-400' : 'text-accent-400';
  const confidenceBg = clip.viral_confidence >= 70 ? 'bg-brand-500' : clip.viral_confidence >= 50 ? 'bg-electric-500' : 'bg-accent-500';

  return (
    <div className={`card p-4 transition-all duration-300 ${isSelected ? 'border-brand-500/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confidenceBg}/10`}>
            <span className={`font-display font-bold text-sm ${confidenceColor}`}>{clip.viral_confidence}</span>
          </div>
          <span className="text-[10px] text-ink-500">#{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                className="input"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Clip title"
              />
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="number"
                  step="0.1"
                  value={editForm.start}
                  onChange={e => setEditForm({ ...editForm, start: e.target.value })}
                  placeholder="Start (s)"
                />
                <input
                  className="input flex-1"
                  type="number"
                  step="0.1"
                  value={editForm.end}
                  onChange={e => setEditForm({ ...editForm, end: e.target.value })}
                  placeholder="End (s)"
                />
              </div>
              <button onClick={onSaveEdit} className="btn-primary text-xs px-3 py-1.5">
                <Check className="w-3 h-3" /> Save
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-ink-100 truncate">{clip.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={onEdit} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={onDelete} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-400 mb-2">
                <span className="font-mono">{formatDuration(clip.start_time)} - {formatDuration(clip.end_time)}</span>
                <span>·</span>
                <span className="font-mono">{formatDuration(clip.length_seconds)}</span>
                <span>·</span>
                <span className={confidenceColor}>{clip.viral_confidence}% viral</span>
              </div>

              <p className="text-xs text-ink-300 mb-2">{clip.reason}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {clip.tags.map(tag => (
                  <span key={tag} className="badge-neutral text-[10px]">{tag}</span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={onSelect} className="btn-ghost text-xs px-3 py-1.5">
                  <Play className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={onExport}
                  disabled={exporting}
                  className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {exporting ? 'Exporting...' : 'Export 5 Versions'}
                </button>
                {clip.status === 'exported' && (
                  <span className="badge-success text-[10px]"><CheckCircle2 className="w-3 h-3" /> Exported</span>
                )}
              </div>

              {/* Pipeline versions */}
              {(exporting || versions.some(v => v.status === 'exported' || v.status === 'failed')) && (
                <div className="mt-3 space-y-1.5">
                  {versions.map((v, p) => {
                    const progressKey = `${clip.id}_${p}`;
                    const prog = exportProgress[progressKey] || 0;
                    const blobKey = `${clip.id}_${p}`;
                    const hasBlob = !!exportedBlobs[blobKey];
                    return (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          v.status === 'exported' ? 'bg-brand-400' :
                          v.status === 'failed' ? 'bg-red-400' :
                          prog > 0 ? 'bg-electric-400 animate-pulse' : 'bg-ink-600'
                        }`} />
                        <span className="text-ink-300 w-28 truncate">{v.pipeline_name}</span>
                        {v.status === 'exported' && hasBlob ? (
                          <button
                            onClick={() => onDownload(exportedBlobs[blobKey], v.output_filename || `${v.pipeline_name}.mp4`)}
                            className="btn-ghost text-[10px] px-2 py-0.5"
                          >
                            <Download className="w-2.5 h-2.5" /> Download
                          </button>
                        ) : prog > 0 ? (
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 bg-ink-700 rounded-full h-1 overflow-hidden">
                              <div className="h-full bg-electric-500 rounded-full transition-all duration-300" style={{ width: `${prog}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-ink-400">{prog}%</span>
                          </div>
                        ) : (
                          <span className="text-ink-500 text-[10px]">Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ClipPreviewCard({ clip, videoUrl, versions, exportProgress, exportedBlobs, onDownload }: {
  clip: Clip;
  videoUrl: string;
  versions: ClipVersion[];
  exportProgress: Record<string, number>;
  exportedBlobs: Record<string, Blob>;
  onDownload: (blob: Blob, filename: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const playClip = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start_time;
      videoRef.current.play();
      setPlaying(true);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start_time;
    }
  }, [clip.id, clip.start_time]);

  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">Clip Preview</h3>
      <div className="relative rounded-xl overflow-hidden bg-ink-950">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video object-contain"
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= clip.end_time) {
              e.currentTarget.pause();
              setPlaying(false);
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {!playing && (
          <button
            onClick={playClip}
            className="absolute inset-0 flex items-center justify-center bg-ink-950/40 hover:bg-ink-950/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-brand-500/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-ink-950 ml-0.5" />
            </div>
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-400">Clip</span>
          <span className="text-ink-200 truncate ml-2 max-w-[180px]">{clip.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">Time Range</span>
          <span className="text-ink-200 font-mono">{formatDuration(clip.start_time)} - {formatDuration(clip.end_time)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">Length</span>
          <span className="text-ink-200 font-mono">{formatDuration(clip.length_seconds)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-400">Viral Confidence</span>
          <span className="text-brand-300 font-mono">{clip.viral_confidence}%</span>
        </div>
      </div>

      {clip.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {clip.tags.map(tag => (
            <span key={tag} className="badge-neutral text-[10px]">{tag}</span>
          ))}
        </div>
      )}

      {/* Pipeline configs */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">5 Pipeline Configs</p>
        <div className="space-y-2">
          {versions.map((v, p) => {
            const blobKey = `${clip.id}_${p}`;
            const hasBlob = !!exportedBlobs[blobKey];
            return (
              <div key={v.id} className="bg-ink-800/50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-ink-100">{v.pipeline_name}</span>
                  {v.status === 'exported' && hasBlob ? (
                    <button
                      onClick={() => onDownload(exportedBlobs[blobKey], v.output_filename || `${v.pipeline_name}.mp4`)}
                      className="btn-ghost text-[10px] px-2 py-0.5"
                    >
                      <Download className="w-2.5 h-2.5" /> Download
                    </button>
                  ) : (
                    <span className={`text-[10px] ${v.status === 'exported' ? 'text-brand-300' : v.status === 'failed' ? 'text-red-400' : 'text-ink-500'}`}>
                      {v.status}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-ink-400">
                  <span>Subtitles: <span className="text-ink-300">{v.subtitle_style.split(' ').slice(0, 3).join(' ')}</span></span>
                  <span>Zoom: <span className="text-ink-300">{v.zoom_behavior.split(' ').slice(0, 3).join(' ')}</span></span>
                  <span>Colour: <span className="text-ink-300">{v.colour_grading.split(' ').slice(0, 3).join(' ')}</span></span>
                  <span>Motion: <span className="text-ink-300">{v.motion.split(' ').slice(0, 3).join(' ')}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
