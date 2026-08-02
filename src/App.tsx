import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Video, ContentDNA, Recommendation, Prediction, CalendarItem, ContentPlan, GeneratedAsset, LearningInsight, ViewKey } from '@/lib/types';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { ViralMemory } from '@/views/ViralMemory';
import { LearningEngine } from '@/views/LearningEngine';
import { ContentDNAView } from '@/views/ContentDNAView';
import { Recommendations } from '@/views/Recommendations';
import { Predictions } from '@/views/Predictions';
import { Planner } from '@/views/Planner';
import { CalendarView } from '@/views/CalendarView';
import { Evolution } from '@/views/Evolution';
import { UploadView } from '@/views/UploadView';
import { ClipGenerator } from '@/views/ClipGenerator';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [dna, setDna] = useState<ContentDNA[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [insights, setInsights] = useState<LearningInsight[]>([]);

  const loadData = useCallback(async () => {
    const [videosRes, dnaRes, recsRes, predsRes, calRes, plansRes, assetsRes, insightsRes] = await Promise.all([
      supabase.from('videos').select('*').order('published_at', { ascending: true }),
      supabase.from('content_dna').select('*').order('category'),
      supabase.from('recommendations').select('*').order('impact_pct', { ascending: false }),
      supabase.from('predictions').select('*').order('viral_score', { ascending: false }),
      supabase.from('calendar_items').select('*').order('scheduled_date'),
      supabase.from('content_plans').select('*').order('priority_score', { ascending: false }),
      supabase.from('generated_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('learning_insights').select('*'),
    ]);

    if (videosRes.data) setVideos(videosRes.data as Video[]);
    if (dnaRes.data) setDna(dnaRes.data as ContentDNA[]);
    if (recsRes.data) setRecommendations(recsRes.data as Recommendation[]);
    if (predsRes.data) setPredictions(predsRes.data as Prediction[]);
    if (calRes.data) setCalendar(calRes.data as CalendarItem[]);
    if (plansRes.data) setPlans(plansRes.data as ContentPlan[]);
    if (assetsRes.data) setAssets(assetsRes.data as GeneratedAsset[]);
    if (insightsRes.data) setInsights(insightsRes.data as LearningInsight[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismissRec = async (id: string) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, dismissed: true } : r));
    await supabase.from('recommendations').update({ dismissed: true }).eq('id', id);
  };

  const handleUpload = (v: Video) => {
    setVideos(prev => [...prev, v]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-ink-400">Loading viral intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar active={view} onNavigate={setView} videoCount={videos.length} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {view === 'dashboard' && <Dashboard videos={videos} />}
          {view === 'memory' && <ViralMemory videos={videos} />}
          {view === 'upload' && <UploadView onUploaded={handleUpload} />}
          {view === 'clip-generator' && <ClipGenerator />}
          {view === 'learning' && <LearningEngine videos={videos} insights={insights} />}
          {view === 'dna' && <ContentDNAView dna={dna} />}
          {view === 'recommendations' && <Recommendations recommendations={recommendations} onDismiss={handleDismissRec} />}
          {view === 'predictions' && <Predictions predictions={predictions} />}
          {view === 'planner' && <Planner plans={plans} />}
          {view === 'calendar' && <CalendarView items={calendar} />}
          {view === 'evolution' && <Evolution videos={videos} assets={assets} />}
        </div>
      </main>
    </div>
  );
}
