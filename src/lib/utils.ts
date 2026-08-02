import type { Video } from './types';

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function platformColor(platform: string): string {
  switch (platform) {
    case 'YouTube': return 'text-red-400 bg-red-500/10 border-red-500/20';
    case 'TikTok': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    case 'Instagram': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'X': return 'text-ink-100 bg-white/10 border-white/20';
    case 'LinkedIn': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'Facebook': return 'text-blue-500 bg-blue-600/10 border-blue-600/20';
    default: return 'text-ink-200 bg-white/5 border-white/10';
  }
}

export function viralScoreColor(score: number): string {
  if (score >= 90) return 'text-brand-300';
  if (score >= 75) return 'text-electric-400';
  if (score >= 60) return 'text-accent-400';
  if (score >= 40) return 'text-ink-200';
  return 'text-red-400';
}

export function viralScoreBg(score: number): string {
  if (score >= 90) return 'bg-brand-500';
  if (score >= 75) return 'bg-electric-500';
  if (score >= 60) return 'bg-accent-500';
  if (score >= 40) return 'bg-ink-400';
  return 'bg-red-500';
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function groupBy<T, K extends string>(arr: T[], fn: (item: T) => K): Record<K, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(arr: T[], fn: (item: T) => number, desc = false): T[] {
  const sorted = [...arr].sort((a, b) => fn(a) - fn(b));
  return desc ? sorted.reverse() : sorted;
}

export interface GroupStat {
  key: string;
  count: number;
  avgViews: number;
  avgRetention: number;
  avgViralScore: number;
  avgWatchTime: number;
  avgFollowers: number;
  avgCTR: number;
  totalViews: number;
}

export function computeGroupStats(videos: Video[], groupFn: (v: Video) => string): GroupStat[] {
  const groups = groupBy(videos, groupFn);
  return Object.entries(groups).map(([key, vids]) => ({
    key,
    count: vids.length,
    avgViews: Math.round(avg(vids.map(v => v.views))),
    avgRetention: Math.round(avg(vids.map(v => v.audience_retention_pct)) * 10) / 10,
    avgViralScore: Math.round(avg(vids.map(v => v.viral_score)) * 10) / 10,
    avgWatchTime: Math.round(avg(vids.map(v => v.avg_view_duration_seconds)) * 10) / 10,
    avgFollowers: Math.round(avg(vids.map(v => v.followers_gained))),
    avgCTR: Math.round(avg(vids.map(v => v.ctr)) * 100) / 100,
    totalViews: sum(vids.map(v => v.views)),
  })).sort((a, b) => b.avgViralScore - a.avgViralScore);
}
