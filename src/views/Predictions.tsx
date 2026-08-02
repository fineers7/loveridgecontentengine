import { useState } from 'react';
import { TrendingUp, Eye, Heart, Share2, MessageCircle, Clock, UserPlus, Target, Zap, Sparkles } from 'lucide-react';
import type { Prediction } from '@/lib/types';
import { formatNumber, platformColor, viralScoreColor } from '@/lib/utils';
import { ProgressBar } from '@/components/Charts';

interface PredictionsProps {
  predictions: Prediction[];
}

export function Predictions({ predictions }: PredictionsProps) {
  const [selected, setSelected] = useState<Prediction | null>(predictions[0] || null);

  if (!selected) {
    return (
      <div className="card p-12 text-center">
        <TrendingUp className="w-8 h-8 text-ink-500 mx-auto mb-3" />
        <p className="text-ink-400">No predictions yet. Add videos to generate predictions.</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Predicted Views', value: formatNumber(selected.predicted_views), icon: Eye, color: 'text-electric-400' },
    { label: 'Predicted Likes', value: formatNumber(selected.predicted_likes), icon: Heart, color: 'text-red-400' },
    { label: 'Predicted Shares', value: formatNumber(selected.predicted_shares), icon: Share2, color: 'text-accent-400' },
    { label: 'Predicted Comments', value: formatNumber(selected.predicted_comments), icon: MessageCircle, color: 'text-brand-300' },
    { label: 'Predicted Watch Time', value: formatNumber(selected.predicted_watch_time), icon: Clock, color: 'text-purple-400' },
    { label: 'Predicted Followers', value: formatNumber(selected.predicted_followers), icon: UserPlus, color: 'text-pink-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Viral Prediction</h2>
        <p className="text-sm text-ink-400 mt-1">Pre-export performance estimates with confidence levels</p>
      </div>

      {/* Project selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {predictions.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              selected.id === p.id
                ? 'bg-brand-500 text-ink-950'
                : 'glass-hover text-ink-300'
            }`}
          >
            {p.project_name}
          </button>
        ))}
      </div>

      {/* Main prediction card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Viral score gauge */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-4">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="68" fill="none"
                stroke={selected.viral_score >= 90 ? '#10b981' : selected.viral_score >= 75 ? '#0ea5e9' : '#f59e0b'}
                strokeWidth="10"
                strokeDasharray={`${(selected.viral_score / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display text-4xl font-bold ${viralScoreColor(selected.viral_score)}`}>
                {selected.viral_score.toFixed(0)}
              </span>
              <span className="text-[10px] text-ink-400 uppercase tracking-wider">Viral Score</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-300" />
            <span className={`badge ${selected.confidence_level === 'High' ? 'badge-success' : 'badge-warning'}`}>
              {selected.confidence_level} confidence
            </span>
          </div>
          <div className="w-full mt-4">
            <ProgressBar
              value={selected.confidence_pct}
              max={100}
              height={6}
              color="bg-brand-500"
              label="Confidence Level"
              valueLabel={`${selected.confidence_pct.toFixed(0)}%`}
            />
          </div>
        </div>

        {/* Predicted metrics */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-brand-300" />
            <h3 className="section-title">Predicted Performance</h3>
            <span className={`ml-auto px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(selected.platform)}`}>
              {selected.platform}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-ink-800/50 rounded-xl p-3 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="text-[10px] text-ink-400 uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className="font-display text-xl font-bold text-ink-50">{m.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 bg-ink-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span className="text-xs text-ink-300">Predicted Retention Rate</span>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={selected.predicted_retention} max={100} height={8} color="bg-brand-500" />
              <span className="font-mono text-sm font-semibold text-ink-100">{selected.predicted_retention.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* All predictions table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">All Predictions</h3>
        <div className="space-y-2">
          {predictions.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left ${
                selected.id === p.id ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-white/5'
              }`}
            >
              <div className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(p.platform)}`}>
                {p.platform}
              </div>
              <span className="flex-1 text-sm font-medium text-ink-100 truncate">{p.project_name}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ink-300"><Eye className="w-3 h-3 inline mr-1" />{formatNumber(p.predicted_views)}</span>
                <span className={`font-display font-bold text-base ${viralScoreColor(p.viral_score)}`}>{p.viral_score.toFixed(0)}</span>
                <span className={`badge ${p.confidence_level === 'High' ? 'badge-success' : 'badge-warning'}`}>{p.confidence_level}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
