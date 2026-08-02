import { useEffect, useRef, useState } from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (n: number) => string;
  maxBars?: number;
}

export function BarChart({ data, height = 200, formatValue, maxBars = 12 }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const visible = data.slice(0, maxBars);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {visible.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isHovered = hovered === i;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-2 group cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {isHovered && (
              <div className="text-xs font-mono text-ink-100 mb-1 animate-fade-in">
                {formatValue ? formatValue(d.value) : d.value.toLocaleString()}
              </div>
            )}
            <div
              className={`w-full rounded-t-lg transition-all duration-300 ${d.color || 'bg-brand-500'} ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-70'
              }`}
              style={{ height: `${pct}%`, minHeight: '4px' }}
            />
            <span className={`text-[10px] truncate w-full text-center transition-colors ${isHovered ? 'text-ink-100' : 'text-ink-400'}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
}

export function LineChart({ data, height = 180, color = '#10b981', formatValue }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padding.top + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]?.x || padding.left} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * t}
            y2={padding.top + innerH * t}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 5 : 3} fill={color} className="transition-all" />
            <rect
              x={p.x - innerW / data.length / 2}
              y={padding.top}
              width={innerW / data.length}
              height={innerH}
              fill="transparent"
            />
          </g>
        ))}
      </svg>
      {hovered !== null && (
        <div
          className="absolute pointer-events-none glass rounded-lg px-3 py-2 text-xs animate-fade-in z-10"
          style={{
            left: `${(points[hovered].x / width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-ink-300">{points[hovered].label}</div>
          <div className="text-ink-100 font-mono font-semibold">
            {formatValue ? formatValue(points[hovered].value) : points[hovered].value.toLocaleString()}
          </div>
        </div>
      )}
      <div className="flex justify-between px-10 mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-ink-400 truncate">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="font-display text-xl font-bold text-ink-50">{centerValue}</span>}
            {centerLabel && <span className="text-[10px] text-ink-400 uppercase tracking-wider">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
            <span className="text-ink-200">{d.label}</span>
            <span className="text-ink-400 font-mono">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  valueLabel?: string;
}

export function ProgressBar({ value, max = 100, color = 'bg-brand-500', height = 8, label, valueLabel }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-ink-300">{label}</span>}
          {valueLabel && <span className="text-xs font-mono text-ink-200">{valueLabel}</span>}
        </div>
      )}
      <div className="w-full bg-ink-700 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

interface HeatmapProps {
  data: { day: string; time: string; value: number }[];
}

export function Heatmap({ data }: HeatmapProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '19:30', '21:00'];
  const max = Math.max(...data.map(d => d.value), 1);

  const getValue = (day: string, time: string) => {
    const entry = data.find(d => d.day === day && d.time === time);
    return entry ? entry.value : 0;
  };

  const colorFor = (v: number) => {
    const pct = v / max;
    if (pct === 0) return 'bg-ink-800';
    if (pct < 0.25) return 'bg-brand-900';
    if (pct < 0.5) return 'bg-brand-700';
    if (pct < 0.75) return 'bg-brand-500';
    return 'bg-brand-400';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <div className="flex gap-1 mb-1 ml-16">
          {times.map(t => (
            <div key={t} className="flex-1 text-[10px] text-ink-400 text-center">{t}</div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <div className="w-14 text-xs text-ink-300 text-right pr-1">{day.slice(0, 3)}</div>
            {times.map(t => {
              const v = getValue(day, t);
              return (
                <div
                  key={t}
                  className={`flex-1 h-10 rounded-lg ${colorFor(v)} transition-all duration-300 hover:ring-2 hover:ring-brand-400/50 cursor-pointer group relative`}
                  title={`${day} ${t}: ${v} avg views`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
