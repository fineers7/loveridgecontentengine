import { useState } from 'react';
import { Sparkles, Youtube, Smartphone, Music, Podcast, Mail, FileText, Users, TrendingUp, Calendar } from 'lucide-react';
import type { ContentPlan } from '@/lib/types';

interface PlannerProps {
  plans: ContentPlan[];
}

const formatIcons: Record<string, typeof Youtube> = {
  YouTube: Youtube,
  Short: Youtube,
  TikTok: Music,
  Reel: Smartphone,
  Podcast: Podcast,
  Newsletter: Mail,
  Blog: FileText,
  Community: Users,
  Series: Calendar,
  Challenge: TrendingUp,
  Trending: TrendingUp,
};

const formatColors: Record<string, string> = {
  YouTube: 'text-red-400 bg-red-500/10 border-red-500/20',
  Short: 'text-red-400 bg-red-500/10 border-red-500/20',
  TikTok: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Reel: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Podcast: 'text-electric-400 bg-electric-500/10 border-electric-500/20',
  Newsletter: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
  Blog: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
  Community: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Series: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
  Challenge: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
  Trending: 'text-electric-400 bg-electric-500/10 border-electric-500/20',
};

export function Planner({ plans }: PlannerProps) {
  const [filter, setFilter] = useState('All');
  const formats = ['All', ...Array.from(new Set(plans.map(p => p.format)))];
  const filtered = filter === 'All' ? plans : plans.filter(p => p.format === filter);
  const sorted = [...filtered].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Content Planner</h2>
        <p className="text-sm text-ink-400 mt-1">Future content suggestions based on historical performance</p>
      </div>

      {/* Format filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {formats.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f ? 'bg-brand-500 text-ink-950' : 'glass-hover text-ink-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((plan, i) => {
          const Icon = formatIcons[plan.format] || Sparkles;
          return (
            <div key={plan.id} className="card p-5 animate-slide-up hover:border-brand-500/20 transition-all duration-300" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${formatColors[plan.format] || 'bg-white/5 border-white/10 text-ink-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${formatColors[plan.format] || 'bg-white/5 border-white/10 text-ink-300'}`}>
                    {plan.format}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-brand-300">{plan.priority_score.toFixed(0)}</span>
                  <p className="text-[10px] text-ink-400 uppercase tracking-wider">Priority</p>
                </div>
              </div>
              <h3 className="font-display font-semibold text-ink-50 mb-1">{plan.title}</h3>
              <p className="text-sm text-ink-300 mb-2">{plan.angle}</p>
              <div className="bg-ink-800/50 rounded-lg p-2.5 mb-3">
                <p className="text-xs text-ink-400 leading-relaxed">
                  <span className="text-ink-300 font-medium">Why: </span>{plan.rationale}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`badge ${plan.status === 'Planned' ? 'badge-success' : 'badge-neutral'}`}>{plan.status}</span>
                <div className="w-24">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-ink-400">Priority</span>
                    <span className="text-[10px] font-mono text-ink-300">{plan.priority_score.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-ink-700 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${plan.priority_score}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
