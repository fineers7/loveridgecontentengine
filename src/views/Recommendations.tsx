import { Lightbulb, TrendingUp, X, Check } from 'lucide-react';
import type { Recommendation } from '@/lib/types';

interface RecommendationsProps {
  recommendations: Recommendation[];
  onDismiss: (id: string) => void;
}

export function Recommendations({ recommendations, onDismiss }: RecommendationsProps) {
  const active = recommendations.filter(r => !r.dismissed);
  const dismissed = recommendations.filter(r => r.dismissed);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Recommendation Engine</h2>
        <p className="text-sm text-ink-400 mt-1">Data-driven recommendations to maximise growth</p>
      </div>

      {/* Active recommendations */}
      <div className="space-y-3">
        {active.map((r, i) => (
          <div key={r.id} className="card p-5 animate-slide-up hover:border-brand-500/20 transition-all duration-300" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-brand-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-display font-semibold text-ink-50">{r.headline}</h3>
                  <button onClick={() => onDismiss(r.id)} className="btn-ghost p-1.5 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-ink-300 leading-relaxed mb-3">{r.detail}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="badge-success">
                    <TrendingUp className="w-3 h-3" />
                    +{r.impact_pct}% impact
                  </span>
                  <span className={`badge ${r.confidence === 'High' ? 'badge-success' : r.confidence === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>
                    {r.confidence} confidence
                  </span>
                  <span className="badge-neutral">{r.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {active.length === 0 && (
        <div className="card p-12 text-center">
          <Lightbulb className="w-8 h-8 text-ink-500 mx-auto mb-3" />
          <p className="text-ink-400">All recommendations have been addressed</p>
        </div>
      )}

      {/* Dismissed */}
      {dismissed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">Dismissed ({dismissed.length})</h3>
          <div className="space-y-2">
            {dismissed.map(r => (
              <div key={r.id} className="card p-3 flex items-center gap-3 opacity-50">
                <Check className="w-4 h-4 text-ink-400" />
                <span className="text-sm text-ink-300">{r.headline}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
