import { useMemo } from 'react';
import { CalendarDays, Clock, Youtube, Music, Smartphone, CheckCircle2, Circle, Lightbulb } from 'lucide-react';
import type { CalendarItem } from '@/lib/types';
import { platformColor, formatDate } from '@/lib/utils';

interface CalendarViewProps {
  items: CalendarItem[];
}

const platformIcons: Record<string, typeof Youtube> = {
  YouTube: Youtube,
  TikTok: Music,
  Instagram: Smartphone,
};

export function CalendarView({ items }: CalendarViewProps) {
  const sorted = useMemo(() => [...items].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()), [items]);

  // Group by week
  const weeks = useMemo(() => {
    const groups: { weekStart: string; items: CalendarItem[] }[] = [];
    sorted.forEach(item => {
      const date = new Date(item.scheduled_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      let group = groups.find(g => g.weekStart === key);
      if (!group) {
        group = { weekStart: key, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups;
  }, [sorted]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Content Calendar</h2>
        <p className="text-sm text-ink-400 mt-1">Optimised publishing schedule based on performance data</p>
      </div>

      {/* AI insight banner */}
      <div className="card p-4 flex items-center gap-3 border-brand-500/20">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-brand-300" />
        </div>
        <div>
          <p className="text-sm text-ink-100">
            <span className="font-medium text-brand-300">Optimal schedule detected:</span> Monday & Wednesday at 7:30 PM consistently outperform other slots by 26%.
          </p>
          <p className="text-xs text-ink-400 mt-0.5">Calendar auto-generated from your best-performing posting times, platforms, and edit styles.</p>
        </div>
      </div>

      {/* Calendar weeks */}
      <div className="space-y-6">
        {weeks.map(week => (
          <div key={week.weekStart}>
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
              Week of {formatDate(week.weekStart)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const date = new Date(week.weekStart);
                date.setDate(date.getDate() + dayIdx);
                const dateStr = date.toISOString().split('T')[0];
                const dayItems = week.items.filter(item => item.scheduled_date === dateStr);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();

                return (
                  <div key={dayIdx} className={`card p-3 min-h-[120px] ${dayItems.length > 0 ? 'border-brand-500/10' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-ink-300">{dayName}</span>
                      <span className={`text-xs font-mono ${dayItems.length > 0 ? 'text-brand-300' : 'text-ink-500'}`}>{dayNum}</span>
                    </div>
                    <div className="space-y-2">
                      {dayItems.map(item => {
                        const Icon = platformIcons[item.platform] || Youtube;
                        const isPlanned = item.status === 'Planned';
                        return (
                          <div key={item.id} className={`rounded-lg p-2.5 transition-all duration-200 hover:scale-[1.02] ${
                            isPlanned ? 'bg-brand-500/10 border border-brand-500/15' : 'bg-ink-800/50 border border-white/5'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Icon className="w-3 h-3 text-ink-300" />
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${platformColor(item.platform)}`}>
                                {item.platform}
                              </span>
                              {isPlanned ? <CheckCircle2 className="w-3 h-3 text-brand-300 ml-auto" /> : <Circle className="w-3 h-3 text-ink-500 ml-auto" />}
                            </div>
                            <p className="text-xs font-medium text-ink-100 line-clamp-2 mb-1">{item.caption}</p>
                            <div className="flex items-center gap-1 text-[10px] text-ink-400">
                              <Clock className="w-2.5 h-2.5" />
                              {item.scheduled_time}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[9px] text-ink-500">{item.edit_style}</span>
                              <span className="text-[9px] text-ink-500">· {item.cta}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming list */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-brand-300" />
          <h3 className="section-title">Upcoming Schedule</h3>
        </div>
        <div className="space-y-2">
          {sorted.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="text-center w-14 shrink-0">
                <p className="text-xs text-ink-400">{new Date(item.scheduled_date).toLocaleDateString('en-US', { month: 'short' })}</p>
                <p className="font-display text-lg font-bold text-ink-100">{new Date(item.scheduled_date).getDate()}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-100 truncate">{item.caption}</p>
                <p className="text-xs text-ink-400">{item.scheduled_time} · {item.edit_style} · {item.cta}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${platformColor(item.platform)}`}>
                {item.platform}
              </span>
              <span className={`badge ${item.status === 'Planned' ? 'badge-success' : 'badge-neutral'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
