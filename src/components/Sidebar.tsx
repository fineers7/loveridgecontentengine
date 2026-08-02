import {
  LayoutDashboard,
  Database,
  Brain,
  Dna,
  Lightbulb,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Upload,
  Rocket,
  Scissors,
} from 'lucide-react';
import type { ViewKey } from '@/lib/types';

interface SidebarProps {
  active: ViewKey;
  onNavigate: (view: ViewKey) => void;
  videoCount: number;
}

const navGroups: { label: string; items: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Performance Dashboard', icon: LayoutDashboard },
      { key: 'memory', label: 'Viral Memory', icon: Database },
      { key: 'clip-generator', label: 'AI Clip Generator', icon: Scissors },
      { key: 'upload', label: 'Add Video', icon: Upload },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { key: 'learning', label: 'Learning Engine', icon: Brain },
      { key: 'dna', label: 'Content DNA', icon: Dna },
      { key: 'recommendations', label: 'Recommendations', icon: Lightbulb },
      { key: 'predictions', label: 'Viral Prediction', icon: TrendingUp },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { key: 'planner', label: 'Content Planner', icon: Sparkles },
      { key: 'calendar', label: 'Content Calendar', icon: CalendarDays },
      { key: 'evolution', label: 'AI Evolution', icon: Rocket },
    ],
  },
];

export function Sidebar({ active, onNavigate, videoCount }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-ink-900/50 backdrop-blur-xl">
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-electric-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Brain className="w-5 h-5 text-ink-950" />
        </div>
        <div>
          <h1 className="font-display font-bold text-sm text-ink-50 leading-tight">Viral Intelligence</h1>
          <p className="text-[10px] text-ink-400 uppercase tracking-wider">AI Content Engine</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-6">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-ink-500 uppercase tracking-wider px-3 mb-2">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-300' : ''}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-glow" />
          <div className="flex-1">
            <p className="text-xs font-medium text-ink-200">Engine Active</p>
            <p className="text-[10px] text-ink-400">{videoCount} videos analysed</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
