import { useMemo } from 'react';
import { Dna, Film, Smile, Mic, Zap, Tag, BookOpen, User, Palette, Music, Camera, Target } from 'lucide-react';
import type { ContentDNA } from '@/lib/types';
import { ProgressBar } from '@/components/Charts';

interface ContentDNAViewProps {
  dna: ContentDNA[];
}

const categoryIcons: Record<string, typeof Film> = {
  Editing: Film,
  Personality: User,
  Voice: Mic,
  Content: Tag,
  Visual: Palette,
  Audio: Music,
  Strategy: Target,
};

export function ContentDNAView({ dna }: ContentDNAViewProps) {
  const grouped = useMemo(() => {
    const groups = new Map<string, ContentDNA[]>();
    dna.forEach(d => {
      (groups.get(d.category) || groups.set(d.category, []).get(d.category)!).push(d);
    });
    return Array.from(groups.entries());
  }, [dna]);

  const avgConfidence = dna.length > 0 ? dna.reduce((s, d) => s + d.confidence_score, 0) / dna.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-50">Content DNA</h2>
          <p className="text-sm text-ink-400 mt-1">Creator profile built from performance data</p>
        </div>
        <div className="card px-4 py-3 text-right">
          <p className="text-xs text-ink-400 uppercase tracking-wider">Profile Confidence</p>
          <p className="font-display text-2xl font-bold text-brand-300">{avgConfidence.toFixed(0)}%</p>
        </div>
      </div>

      {/* DNA helix visualization */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Dna className="w-5 h-5 text-brand-300" />
          <h3 className="section-title">Creator Profile</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dna.map((d, i) => {
            const Icon = categoryIcons[d.category] || BookOpen;
            return (
              <div key={d.id} className="bg-ink-800/50 rounded-xl p-4 animate-slide-up hover:bg-ink-700/50 transition-colors" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-400 uppercase tracking-wider mb-0.5">{d.field_label}</p>
                    <p className="text-sm text-ink-100 font-medium">{d.field_value}</p>
                    <div className="mt-2">
                      <ProgressBar value={d.confidence_score} max={100} height={4} color="bg-brand-500" />
                      <p className="text-[10px] text-ink-500 mt-1">{d.confidence_score.toFixed(0)}% confidence · {d.category}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {grouped.map(([cat, items]) => {
          const Icon = categoryIcons[cat] || BookOpen;
          const avg = items.reduce((s, d) => s + d.confidence_score, 0) / items.length;
          return (
            <div key={cat} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-brand-300" />
                <h4 className="text-sm font-medium text-ink-100">{cat}</h4>
              </div>
              <p className="font-display text-2xl font-bold text-ink-50">{avg.toFixed(0)}%</p>
              <p className="text-xs text-ink-400 mt-0.5">{items.length} attributes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
