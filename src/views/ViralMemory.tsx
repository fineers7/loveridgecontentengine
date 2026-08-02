import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Heart, Share2, Clock, TrendingUp, X } from 'lucide-react';
import type { Video } from '@/lib/types';
import { formatNumber, formatDate, platformColor, viralScoreColor, formatDuration, sortBy } from '@/lib/utils';
import { ProgressBar } from '@/components/Charts';

interface ViralMemoryProps {
  videos: Video[];
}

export function ViralMemory({ videos }: ViralMemoryProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sortByKey, setSortByKey] = useState<'viral_score' | 'views' | 'published_at' | 'retention'>('viral_score');
  const [selected, setSelected] = useState<Video | null>(null);

  const platforms = ['All', ...Array.from(new Set(videos.map(v => v.platform)))];

  const filtered = useMemo(() => {
    let result = videos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.topic.toLowerCase().includes(search.toLowerCase()) ||
      v.hook_style.toLowerCase().includes(search.toLowerCase())
    );
    if (platformFilter !== 'All') result = result.filter(v => v.platform === platformFilter);
    result = sortBy(result, v => {
      if (sortByKey === 'retention') return v.audience_retention_pct;
      return v[sortByKey] as number;
    }, true);
    return result;
  }, [videos, search, platformFilter, sortByKey]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">Personal Viral Memory</h2>
        <p className="text-sm text-ink-400 mt-1">Historical performance database — {videos.length} videos tracked</p>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search by title, topic, or hook style..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="input w-auto">
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sortByKey} onChange={e => setSortByKey(e.target.value as typeof sortByKey)} className="input w-auto">
          <option value="viral_score">Sort: Viral Score</option>
          <option value="views">Sort: Views</option>
          <option value="published_at">Sort: Date</option>
          <option value="retention">Sort: Retention</option>
        </select>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v, i) => (
          <button
            key={v.id}
            onClick={() => setSelected(v)}
            className="card p-4 text-left animate-slide-up hover:border-brand-500/20 transition-all duration-300 group"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(v.platform)}`}>
                {v.platform}
              </div>
              {v.is_winner && <span className="badge-success text-[10px]">Winner</span>}
            </div>
            <h3 className="text-sm font-medium text-ink-100 line-clamp-2 group-hover:text-ink-50 transition-colors mb-2">
              {v.title}
            </h3>
            <p className="text-xs text-ink-400 mb-3">{formatDate(v.published_at)} · {v.posting_day} {v.posting_time}</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Metric icon={Eye} value={formatNumber(v.views)} label="Views" />
              <Metric icon={Heart} value={formatNumber(v.likes)} label="Likes" />
              <Metric icon={Share2} value={formatNumber(v.shares)} label="Shares" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">Viral Score</span>
              <span className={`font-display font-bold text-lg ${viralScoreColor(v.viral_score)}`}>
                {v.viral_score.toFixed(0)}
              </span>
            </div>
            <ProgressBar value={v.viral_score} max={100} height={4} color={v.viral_score >= 85 ? 'bg-brand-500' : 'bg-accent-500'} />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Filter className="w-8 h-8 text-ink-500 mx-auto mb-3" />
          <p className="text-ink-400">No videos match your filters</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && <VideoDetailModal video={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Eye; value: string; label: string }) {
  return (
    <div className="bg-ink-800/50 rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-1 text-ink-400 mb-0.5">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-mono font-semibold text-ink-100">{value}</span>
    </div>
  );
}

function VideoDetailModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const fields = [
    { label: 'Platform', value: video.platform },
    { label: 'Date Published', value: formatDate(video.published_at) },
    { label: 'Video ID', value: video.video_id || 'N/A' },
    { label: 'Views', value: formatNumber(video.views) },
    { label: 'Likes', value: formatNumber(video.likes) },
    { label: 'Comments', value: formatNumber(video.comments) },
    { label: 'Shares', value: formatNumber(video.shares) },
    { label: 'Saves', value: formatNumber(video.saves) },
    { label: 'Followers Gained', value: formatNumber(video.followers_gained) },
    { label: 'Subscribers Gained', value: formatNumber(video.subscribers_gained) },
    { label: 'Watch Time', value: formatDuration(video.watch_time_seconds) },
    { label: 'Avg View Duration', value: formatDuration(video.avg_view_duration_seconds) },
    { label: 'Audience Retention', value: `${video.audience_retention_pct.toFixed(1)}%` },
    { label: 'Click Through Rate', value: `${video.ctr.toFixed(1)}%` },
    { label: 'Hook Used', value: video.hook_style },
    { label: 'Subtitle Style', value: video.subtitle_style },
    { label: 'Caption', value: video.caption },
    { label: 'Hashtags', value: video.hashtags.join(' ') },
    { label: 'Thumbnail', value: video.thumbnail_style },
    { label: 'Colour Grading', value: video.colour_grading },
    { label: 'Editing Style', value: video.editing_style },
    { label: 'CTA', value: video.cta },
    { label: 'Video Length', value: formatDuration(video.video_length_seconds) },
    { label: 'Posting Time', value: video.posting_time },
    { label: 'Posting Day', value: video.posting_day },
    { label: 'Topic', value: video.topic },
  ];

  const scores = [
    { label: 'Emotion Score', value: video.emotion_score, color: 'bg-pink-500' },
    { label: 'Energy Score', value: video.energy_score, color: 'bg-accent-500' },
    { label: 'Storytelling Score', value: video.storytelling_score, color: 'bg-electric-500' },
    { label: 'Viral Score', value: video.viral_score, color: 'bg-brand-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(video.platform)}`}>
                {video.platform}
              </div>
              {video.is_winner && <span className="badge-success">Winner</span>}
            </div>
            <h3 className="font-display text-lg font-bold text-ink-50">{video.title}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {fields.map(f => (
                <div key={f.label} className="bg-ink-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                  <p className="text-sm font-medium text-ink-100 truncate">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">Content Scores</h4>
            <div className="grid grid-cols-2 gap-3">
              {scores.map(s => (
                <div key={s.label} className="bg-ink-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ink-300">{s.label}</span>
                    <span className="font-display font-bold text-lg text-ink-50">{s.value.toFixed(0)}</span>
                  </div>
                  <ProgressBar value={s.value} max={100} color={s.color} height={6} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
