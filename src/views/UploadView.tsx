import { useState } from 'react';
import { Upload, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Video } from '@/lib/types';

interface UploadViewProps {
  onUploaded: (v: Video) => void;
}

const platforms = ['YouTube', 'TikTok', 'Instagram', 'X', 'LinkedIn', 'Facebook'];
const hookStyles = ['POV', 'Statement', 'Question', 'List', 'Direct', 'Story'];
const subtitleStyles = ['Yellow', 'White', 'None', 'Karaoke'];
const thumbnailStyles = ['Bold Text', 'Face Closeup', 'Standard', 'Minimal', 'Before/After'];
const colourGradings = ['Teal', 'Warm', 'Vibrant', 'Natural', 'Moody'];
const editingStyles = ['Documentary', 'Energetic', 'Standard', 'Cinematic', 'Fast-paced'];
const ctas = ['Subscribe', 'Follow', 'Like & Comment', 'Share', 'Link in Bio'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const topics = ['Business', 'Motivation', 'Lifestyle', 'Education', 'Tech', 'Mindset', 'YouTube Growth', 'Marketing'];

export function UploadView({ onUploaded }: UploadViewProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    platform: 'YouTube',
    published_at: new Date().toISOString().split('T')[0],
    views: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    followers_gained: '',
    subscribers_gained: '',
    avg_view_duration_seconds: '',
    audience_retention_pct: '',
    ctr: '',
    hook_style: 'POV',
    subtitle_style: 'Yellow',
    caption: '',
    hashtags: '',
    thumbnail_style: 'Bold Text',
    colour_grading: 'Teal',
    editing_style: 'Documentary',
    cta: 'Subscribe',
    video_length_seconds: '',
    posting_time: '19:30',
    posting_day: 'Monday',
    topic: 'Business',
    emotion_score: '75',
    energy_score: '70',
    storytelling_score: '80',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setSuccess(false);

    const num = (v: string) => parseInt(v) || 0;
    const dec = (v: string) => parseFloat(v) || 0;
    const watchTime = num(form.views) * dec(form.avg_view_duration_seconds);
    const viralScore = Math.min(100, Math.round(
      dec(form.audience_retention_pct) * 0.3 +
      (num(form.views) > 1000000 ? 30 : num(form.views) > 500000 ? 20 : num(form.views) > 100000 ? 10 : 5) +
      (num(form.followers_gained) / Math.max(num(form.views), 1) * 100 * 0.2) +
      dec(form.emotion_score) * 0.1 +
      dec(form.storytelling_score) * 0.1
    ));

    const insertData = {
      title: form.title,
      platform: form.platform,
      published_at: form.published_at,
      views: num(form.views),
      likes: num(form.likes),
      comments: num(form.comments),
      shares: num(form.shares),
      saves: num(form.saves),
      followers_gained: num(form.followers_gained),
      subscribers_gained: num(form.subscribers_gained),
      watch_time_seconds: watchTime,
      avg_view_duration_seconds: dec(form.avg_view_duration_seconds),
      audience_retention_pct: dec(form.audience_retention_pct),
      ctr: dec(form.ctr),
      hook_style: form.hook_style,
      subtitle_style: form.subtitle_style,
      caption: form.caption,
      hashtags: form.hashtags.split(/[\s,]+/).filter(Boolean),
      thumbnail_style: form.thumbnail_style,
      colour_grading: form.colour_grading,
      editing_style: form.editing_style,
      cta: form.cta,
      video_length_seconds: num(form.video_length_seconds),
      posting_time: form.posting_time,
      posting_day: form.posting_day,
      topic: form.topic,
      emotion_score: dec(form.emotion_score),
      energy_score: dec(form.energy_score),
      storytelling_score: dec(form.storytelling_score),
      viral_score: viralScore,
      is_winner: viralScore >= 85,
    };

    const { data, error } = await supabase
      .from('videos')
      .insert(insertData)
      .select()
      .single();

    setSaving(false);
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    if (data) {
      onUploaded(data as Video);
      setSuccess(true);
      setForm(prev => ({ ...prev, title: '', views: '', likes: '', comments: '', shares: '', saves: '', followers_gained: '', subscribers_gained: '', avg_view_duration_seconds: '', audience_retention_pct: '', ctr: '', caption: '', hashtags: '', video_length_seconds: '' }));
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">Add Video to Viral Memory</h2>
        <p className="text-sm text-ink-400 mt-1">Every video added makes the AI smarter</p>
      </div>

      {success && (
        <div className="card p-4 flex items-center gap-3 border-brand-500/20 bg-brand-500/5 animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <Check className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-100">Video added to viral memory</p>
            <p className="text-xs text-ink-400">The AI learning engine has been updated with this data</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Basic info */}
        <div>
          <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Video Title</label>
              <input className="input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="I Tried Making $10k in 24 Hours" required />
            </div>
            <div>
              <label className="label">Platform</label>
              <select className="input" value={form.platform} onChange={e => update('platform', e.target.value)}>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date Published</label>
              <input type="date" className="input" value={form.published_at} onChange={e => update('published_at', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Performance metrics */}
        <div>
          <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Views" value={form.views} onChange={v => update('views', v)} placeholder="842000" />
            <Field label="Likes" value={form.likes} onChange={v => update('likes', v)} placeholder="51000" />
            <Field label="Comments" value={form.comments} onChange={v => update('comments', v)} placeholder="3200" />
            <Field label="Shares" value={form.shares} onChange={v => update('shares', v)} placeholder="8400" />
            <Field label="Saves" value={form.saves} onChange={v => update('saves', v)} placeholder="12000" />
            <Field label="Followers Gained" value={form.followers_gained} onChange={v => update('followers_gained', v)} placeholder="4200" />
            <Field label="Subscribers Gained" value={form.subscribers_gained} onChange={v => update('subscribers_gained', v)} placeholder="3800" />
            <Field label="CTR %" value={form.ctr} onChange={v => update('ctr', v)} placeholder="9.2" />
            <Field label="Avg View Duration (s)" value={form.avg_view_duration_seconds} onChange={v => update('avg_view_duration_seconds', v)} placeholder="22" />
            <Field label="Audience Retention %" value={form.audience_retention_pct} onChange={v => update('audience_retention_pct', v)} placeholder="68.5" />
            <Field label="Video Length (s)" value={form.video_length_seconds} onChange={v => update('video_length_seconds', v)} placeholder="48" />
          </div>
        </div>

        {/* Creative details */}
        <div>
          <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Creative Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SelectField label="Hook Style" value={form.hook_style} options={hookStyles} onChange={v => update('hook_style', v)} />
            <SelectField label="Subtitle Style" value={form.subtitle_style} options={subtitleStyles} onChange={v => update('subtitle_style', v)} />
            <SelectField label="Thumbnail" value={form.thumbnail_style} options={thumbnailStyles} onChange={v => update('thumbnail_style', v)} />
            <SelectField label="Colour Grading" value={form.colour_grading} options={colourGradings} onChange={v => update('colour_grading', v)} />
            <SelectField label="Editing Style" value={form.editing_style} options={editingStyles} onChange={v => update('editing_style', v)} />
            <SelectField label="CTA" value={form.cta} options={ctas} onChange={v => update('cta', v)} />
            <SelectField label="Posting Day" value={form.posting_day} options={days} onChange={v => update('posting_day', v)} />
            <div>
              <label className="label">Posting Time</label>
              <input type="time" className="input" value={form.posting_time} onChange={e => update('posting_time', e.target.value)} />
            </div>
            <SelectField label="Topic" value={form.topic} options={topics} onChange={v => update('topic', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">Caption</label>
              <textarea className="input min-h-[80px] resize-none" value={form.caption} onChange={e => update('caption', e.target.value)} placeholder="Day 1 of the $10k challenge..." />
            </div>
            <div>
              <label className="label">Hashtags (space or comma separated)</label>
              <textarea className="input min-h-[80px] resize-none" value={form.hashtags} onChange={e => update('hashtags', e.target.value)} placeholder="#challenge #money #sidehustle" />
            </div>
          </div>
        </div>

        {/* Content scores */}
        <div>
          <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3">Content Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreSlider label="Emotion Score" value={form.emotion_score} onChange={v => update('emotion_score', v)} color="bg-pink-500" />
            <ScoreSlider label="Energy Score" value={form.energy_score} onChange={v => update('energy_score', v)} color="bg-accent-500" />
            <ScoreSlider label="Storytelling Score" value={form.storytelling_score} onChange={v => update('storytelling_score', v)} color="bg-electric-500" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving || !form.title.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {saving ? 'Adding to Memory...' : 'Add to Viral Memory'}
          </button>
          <p className="text-xs text-ink-400">The AI will analyse this video and update all recommendations</p>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ScoreSlider({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label mb-0">{label}</label>
        <span className="text-xs font-mono text-ink-200">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full accent-brand-500"
      />
      <div className="w-full bg-ink-700 rounded-full h-1.5 mt-1 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-200`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
