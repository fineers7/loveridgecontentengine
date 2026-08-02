import { useMemo } from 'react';
import { Brain, Zap, TrendingUp, TrendingDown, Hash, Type, Target, Palette, Film, Clock, Calendar, Tag, Heart } from 'lucide-react';
import type { Video, LearningInsight } from '@/lib/types';
import { computeGroupStats, formatNumber } from '@/lib/utils';
import { BarChart, ProgressBar } from '@/components/Charts';

interface LearningEngineProps {
  videos: Video[];
  insights: LearningInsight[];
}

const dimensionConfig: Record<string, { label: string; icon: typeof Hash; color: string }> = {
  hook: { label: 'Hook Style', icon: Hash, color: 'text-brand-300' },
  subtitle: { label: 'Subtitle Style', icon: Type, color: 'text-electric-400' },
  cta: { label: 'CTA', icon: Target, color: 'text-accent-400' },
  colour: { label: 'Colour Grading', icon: Palette, color: 'text-purple-400' },
  editing: { label: 'Editing Style', icon: Film, color: 'text-pink-400' },
  length: { label: 'Video Length', icon: Zap, color: 'text-brand-300' },
  time: { label: 'Posting Time', icon: Clock, color: 'text-electric-400' },
  day: { label: 'Posting Day', icon: Calendar, color: 'text-accent-400' },
  topic: { label: 'Topic', icon: Tag, color: 'text-brand-300' },
  emotion: { label: 'Emotion', icon: Heart, color: 'text-pink-400' },
};

export function LearningEngine({ videos, insights }: LearningEngineProps) {
  const dimensions = useMemo(() => {
    const dims = ['hook', 'subtitle', 'cta', 'colour', 'editing', 'length', 'time', 'day', 'topic', 'emotion'];
    return dims.map(dim => {
      const dimInsights = insights.filter(i => i.dimension === dim);
      const dimVideos = videos.filter(v => {
        switch (dim) {
          case 'hook': return v.hook_style;
          case 'subtitle': return v.subtitle_style;
          case 'cta': return v.cta;
          case 'colour': return v.colour_grading;
          case 'editing': return v.editing_style;
          case 'time': return v.posting_time;
          case 'day': return v.posting_day;
          case 'topic': return v.topic;
          default: return true;
        }
      });
      let groupStats: ReturnType<typeof computeGroupStats> = [];
      switch (dim) {
        case 'hook': groupStats = computeGroupStats(dimVideos, v => v.hook_style); break;
        case 'subtitle': groupStats = computeGroupStats(dimVideos, v => v.subtitle_style); break;
        case 'cta': groupStats = computeGroupStats(dimVideos, v => v.cta); break;
        case 'colour': groupStats = computeGroupStats(dimVideos, v => v.colour_grading); break;
        case 'editing': groupStats = computeGroupStats(dimVideos, v => v.editing_style); break;
        case 'time': groupStats = computeGroupStats(dimVideos, v => v.posting_time); break;
        case 'day': groupStats = computeGroupStats(dimVideos, v => v.posting_day); break;
        case 'topic': groupStats = computeGroupStats(dimVideos, v => v.topic); break;
        case 'length': {
          const buckets = new Map<string, typeof dimVideos>();
          dimVideos.forEach(v => {
            const len = v.video_length_seconds;
            const bucket = len <= 30 ? '25-30s' : len <= 40 ? '31-40s' : len <= 55 ? '41-55s' : '56+s';
            (buckets.get(bucket) || buckets.set(bucket, []).get(bucket)!).push(v);
          });
          groupStats = Array.from(buckets.entries()).map(([key, vids]) => ({
            key, count: vids.length,
            avgViews: Math.round(vids.reduce((s, v) => s + v.views, 0) / vids.length),
            avgRetention: Math.round(vids.reduce((s, v) => s + v.audience_retention_pct, 0) / vids.length * 10) / 10,
            avgViralScore: Math.round(vids.reduce((s, v) => s + v.viral_score, 0) / vids.length * 10) / 10,
            avgWatchTime: 0, avgFollowers: 0, avgCTR: 0, totalViews: 0,
          })).sort((a, b) => b.avgRetention - a.avgRetention);
          break;
        }
        case 'emotion': {
          const buckets = new Map<string, typeof dimVideos>();
          dimVideos.forEach(v => {
            const bucket = v.emotion_score >= 85 ? 'High (85+)' : v.emotion_score >= 60 ? 'Medium (60-80)' : 'Low (<60)';
            (buckets.get(bucket) || buckets.set(bucket, []).get(bucket)!).push(v);
          });
          groupStats = Array.from(buckets.entries()).map(([key, vids]) => ({
            key, count: vids.length,
            avgViews: Math.round(vids.reduce((s, v) => s + v.views, 0) / vids.length),
            avgRetention: Math.round(vids.reduce((s, v) => s + v.audience_retention_pct, 0) / vids.length * 10) / 10,
            avgViralScore: Math.round(vids.reduce((s, v) => s + v.viral_score, 0) / vids.length * 10) / 10,
            avgWatchTime: 0, avgFollowers: 0, avgCTR: 0, totalViews: 0,
          })).sort((a, b) => b.avgViralScore - a.avgViralScore);
          break;
        }
      }
      return { dim, insights: dimInsights, groupStats };
    });
  }, [videos, insights]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Learning Engine</h2>
        <p className="text-sm text-ink-400 mt-1">Automatically discovered patterns from {videos.length} videos</p>
      </div>

      {/* Top insights */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-brand-300" />
          <h3 className="section-title">Discovered Patterns</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights
            .filter(i => Math.abs(i.performance_lift_pct) > 5)
            .sort((a, b) => Math.abs(b.performance_lift_pct) - Math.abs(a.performance_lift_pct))
            .slice(0, 8)
            .map((insight, i) => {
              const config = dimensionConfig[insight.dimension];
              const Icon = config?.icon || Hash;
              const isPositive = insight.performance_lift_pct > 0;
              return (
                <div key={insight.id} className="bg-ink-800/50 rounded-xl p-3 flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPositive ? 'bg-brand-500/10' : 'bg-red-500/10'}`}>
                    <Icon className={`w-4 h-4 ${isPositive ? 'text-brand-300' : 'text-red-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-100">
                      <span className="font-medium">{insight.value}</span> achieves{' '}
                      <span className={`font-mono font-semibold ${isPositive ? 'text-brand-300' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{insight.performance_lift_pct.toFixed(1)}%
                      </span>{' '}
                      {insight.metric.replace('avg_', '').replace('_', ' ')}
                    </p>
                    <p className="text-xs text-ink-400">
                      {config?.label} · {insight.sample_size} samples · {insight.confidence} confidence
                    </p>
                  </div>
                  {isPositive ? <TrendingUp className="w-4 h-4 text-brand-300" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
              );
            })}
        </div>
      </div>

      {/* Dimension breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dimensions.map(({ dim, groupStats }) => {
          const config = dimensionConfig[dim];
          if (!config || groupStats.length === 0) return null;
          const Icon = config.icon;
          const topMetric = dim === 'cta' ? 'avgFollowers' : dim === 'time' || dim === 'day' ? 'avgViews' : 'avgViralScore';
          const metricLabel = dim === 'cta' ? 'Avg Followers' : dim === 'time' || dim === 'day' ? 'Avg Views' : 'Avg Viral Score';
          const formatMetric = (n: number) => topMetric === 'avgViews' || topMetric === 'avgFollowers' ? formatNumber(n) : n.toFixed(1);

          return (
            <div key={dim} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <h3 className="section-title">{config.label} Performance</h3>
              </div>
              <div className="space-y-3">
                {groupStats.slice(0, 5).map((s, i) => {
                  const max = Math.max(...groupStats.map(g => g[topMetric]), 1);
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-ink-200">{s.key} <span className="text-xs text-ink-500">({s.count})</span></span>
                        <span className="text-xs font-mono text-ink-300">{formatMetric(s[topMetric])}</span>
                      </div>
                      <ProgressBar
                        value={s[topMetric]}
                        max={max}
                        color={i === 0 ? 'bg-brand-500' : i === 1 ? 'bg-electric-500' : 'bg-ink-500'}
                        height={6}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Video length retention chart */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-brand-300" />
          <h3 className="section-title">Retention by Video Length</h3>
        </div>
        <BarChart
          data={(() => {
            const buckets = new Map<string, number[]>();
            videos.forEach(v => {
              const len = v.video_length_seconds;
              const bucket = len <= 30 ? '25-30s' : len <= 40 ? '31-40s' : len <= 55 ? '41-55s' : '56+s';
              (buckets.get(bucket) || buckets.set(bucket, []).get(bucket)!).push(v.audience_retention_pct);
            });
            return Array.from(buckets.entries()).map(([label, rets]) => ({
              label,
              value: rets.reduce((s, r) => s + r, 0) / rets.length,
              color: 'bg-brand-500',
            })).sort((a, b) => parseInt(a.label) - parseInt(b.label));
          })()}
          height={180}
          formatValue={n => `${n.toFixed(1)}%`}
        />
      </div>
    </div>
  );
}
