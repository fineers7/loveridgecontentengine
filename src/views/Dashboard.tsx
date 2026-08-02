import { useMemo } from 'react';
import {
  Eye, Heart, MessageCircle, Share2, UserPlus, TrendingUp, TrendingDown,
  Trophy, AlertTriangle, Clock, Hash, Target,
} from 'lucide-react';
import type { Video } from '@/lib/types';
import { formatNumber, formatDate, platformColor, viralScoreColor, viralScoreBg, avg, sum, sortBy, computeGroupStats, formatDuration } from '@/lib/utils';
import { BarChart, LineChart, DonutChart, ProgressBar } from '@/components/Charts';

interface DashboardProps {
  videos: Video[];
}

export function Dashboard({ videos }: DashboardProps) {
  const stats = useMemo(() => {
    const totalViews = sum(videos.map(v => v.views));
    const totalLikes = sum(videos.map(v => v.likes));
    const totalComments = sum(videos.map(v => v.comments));
    const totalShares = sum(videos.map(v => v.shares));
    const totalFollowers = sum(videos.map(v => v.followers_gained));
    const avgRetention = avg(videos.map(v => v.audience_retention_pct));
    const avgCTR = avg(videos.map(v => v.ctr));
    const avgViralScore = avg(videos.map(v => v.viral_score));
    const winners = videos.filter(v => v.is_winner);

    const byMonth: { label: string; value: number }[] = [];
    const monthMap = new Map<string, number>();
    videos.forEach(v => {
      const d = new Date(v.published_at);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      monthMap.set(key, (monthMap.get(key) || 0) + v.views);
    });
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthMap.forEach((val, key) => byMonth.push({ label: key, value: val }));
    byMonth.sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label));

    const platformStats = computeGroupStats(videos, v => v.platform);
    const platformDonut = platformStats.map((p, i) => ({
      label: p.key,
      value: p.totalViews,
      color: ['#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#6366f1'][i % 5],
    }));

    const topVideos = sortBy(videos, v => v.viral_score, true).slice(0, 5);
    const worstVideos = sortBy(videos, v => v.viral_score).slice(0, 5);

    const hookStats = computeGroupStats(videos, v => v.hook_style);
    const ctaStats = computeGroupStats(videos, v => v.cta);
    const dayStats = computeGroupStats(videos, v => v.posting_day);
    const topicStats = computeGroupStats(videos, v => v.topic);

    return {
      totalViews, totalLikes, totalComments, totalShares, totalFollowers,
      avgRetention, avgCTR, avgViralScore, winners: winners.length,
      byMonth, platformDonut, topVideos, worstVideos,
      hookStats, ctaStats, dayStats, topicStats,
    };
  }, [videos]);

  const statCards = [
    { label: 'Total Views', value: formatNumber(stats.totalViews), icon: Eye, color: 'text-electric-400', bg: 'bg-electric-500/10' },
    { label: 'Total Likes', value: formatNumber(stats.totalLikes), icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Total Comments', value: formatNumber(stats.totalComments), icon: MessageCircle, color: 'text-brand-300', bg: 'bg-brand-500/10' },
    { label: 'Total Shares', value: formatNumber(stats.totalShares), icon: Share2, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Followers Gained', value: formatNumber(stats.totalFollowers), icon: UserPlus, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Retention', value: `${stats.avgRetention.toFixed(1)}%`, icon: Target, color: 'text-brand-300', bg: 'bg-brand-500/10' },
    { label: 'Avg CTR', value: `${stats.avgCTR.toFixed(1)}%`, icon: TrendingUp, color: 'text-electric-400', bg: 'bg-electric-500/10' },
    { label: 'Avg Viral Score', value: stats.avgViralScore.toFixed(1), icon: Trophy, color: 'text-accent-400', bg: 'bg-accent-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">Performance Dashboard</h2>
        <p className="text-sm text-ink-400 mt-1">Real-time analytics across {videos.length} published videos</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="stat-value text-ink-50">{s.value}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly views + platform split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Monthly Performance</h3>
            <span className="badge-success"><TrendingUp className="w-3 h-3" /> Views</span>
          </div>
          <LineChart data={stats.byMonth} height={200} color="#10b981" formatValue={formatNumber} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">Platform Distribution</h3>
          <DonutChart data={stats.platformDonut} centerValue={formatNumber(stats.totalViews)} centerLabel="Total Views" />
        </div>
      </div>

      {/* Best / Worst videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-brand-300" />
            <h3 className="section-title">Best Performing Videos</h3>
          </div>
          <div className="space-y-2">
            {stats.topVideos.map((v, i) => (
              <VideoRow key={v.id} video={v} rank={i + 1} />
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-accent-400" />
            <h3 className="section-title">Worst Performing Videos</h3>
          </div>
          <div className="space-y-2">
            {stats.worstVideos.map((v, i) => (
              <VideoRow key={v.id} video={v} rank={videos.length - i} />
            ))}
          </div>
        </div>
      </div>

      {/* Rankings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RankingCard title="Best Hook Styles" icon={Hash} stats={stats.hookStats.slice(0, 5)} metric="avgViralScore" />
        <RankingCard title="Best CTAs" icon={Target} stats={stats.ctaStats.slice(0, 5)} metric="avgFollowers" metricLabel="avg followers" />
        <RankingCard title="Best Posting Days" icon={Clock} stats={stats.dayStats.slice(0, 5)} metric="avgViews" />
        <RankingCard title="Best Topics" icon={TrendingUp} stats={stats.topicStats.slice(0, 5)} metric="avgViralScore" />
      </div>

      {/* Retention trends bar chart */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Audience Retention by Video</h3>
        <BarChart
          data={sortBy(videos, v => v.audience_retention_pct, true).slice(0, 12).map(v => ({
            label: v.title.slice(0, 12),
            value: v.audience_retention_pct,
            color: v.audience_retention_pct > 70 ? 'bg-brand-500' : v.audience_retention_pct > 55 ? 'bg-accent-500' : 'bg-red-500',
          }))}
          height={200}
          formatValue={n => `${n.toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

function VideoRow({ video, rank }: { video: Video; rank: number }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
      <span className="text-xs font-mono text-ink-400 w-6 text-right">{rank}</span>
      <div className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(video.platform)}`}>
        {video.platform}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-100 truncate group-hover:text-ink-50 transition-colors">{video.title}</p>
        <p className="text-xs text-ink-400">{formatDate(video.published_at)} · {formatNumber(video.views)} views</p>
      </div>
      <div className="flex items-center gap-2">
        <div className={`text-right`}>
          <span className={`font-display font-bold text-lg ${viralScoreColor(video.viral_score)}`}>{video.viral_score.toFixed(0)}</span>
        </div>
        <div className="w-1.5 h-12 rounded-full bg-ink-700 overflow-hidden">
          <div className={`w-full ${viralScoreBg(video.viral_score)} rounded-full`} style={{ height: `${video.viral_score}%` }} />
        </div>
      </div>
    </div>
  );
}

function RankingCard({ title, icon: Icon, stats, metric, metricLabel }: {
  title: string;
  icon: typeof Hash;
  stats: { key: string; count: number; avgViews: number; avgRetention: number; avgViralScore: number; avgFollowers: number }[];
  metric: 'avgViews' | 'avgRetention' | 'avgViralScore' | 'avgFollowers';
  metricLabel?: string;
}) {
  const max = Math.max(...stats.map(s => s[metric]), 1);
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-brand-300" />
        <h3 className="section-title">{title}</h3>
      </div>
      <div className="space-y-3">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-ink-200">{s.key}</span>
              <span className="text-xs font-mono text-ink-300">
                {metric === 'avgViews' ? formatNumber(s[metric]) : metric === 'avgFollowers' ? formatNumber(s[metric]) : s[metric].toFixed(1)}
              </span>
            </div>
            <ProgressBar
              value={s[metric]}
              max={max}
              color={i === 0 ? 'bg-brand-500' : i === 1 ? 'bg-electric-500' : 'bg-ink-500'}
              height={6}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
