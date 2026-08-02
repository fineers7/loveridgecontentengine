import { useMemo, useState } from 'react';
import { Rocket, Youtube, Music, Smartphone, Image, Type, Hash, FileText, Mail, Users, Twitter, Linkedin, Facebook, FileVideo, ArrowRight } from 'lucide-react';
import type { Video, GeneratedAsset } from '@/lib/types';
import { platformColor, formatDate, formatNumber } from '@/lib/utils';

interface EvolutionProps {
  videos: Video[];
  assets: GeneratedAsset[];
}

const assetIcons: Record<string, typeof Youtube> = {
  Short: Youtube,
  TikTok: Music,
  Reel: Smartphone,
  Thumbnail: Image,
  Title: Type,
  Caption: FileText,
  Hashtags: Hash,
  Description: FileText,
  CommunityPost: Users,
  Blog: FileText,
  Newsletter: Mail,
  XPost: Twitter,
  LinkedIn: Linkedin,
  Facebook: Facebook,
};

const assetCategories = [
  { key: 'Video Formats', types: ['Short', 'TikTok', 'Reel'], icon: FileVideo },
  { key: 'Visual Assets', types: ['Thumbnail', 'Title'], icon: Image },
  { key: 'Text Assets', types: ['Caption', 'Hashtags', 'Description'], icon: Type },
  { key: 'Social Posts', types: ['CommunityPost', 'XPost', 'LinkedIn', 'Facebook'], icon: Users },
  { key: 'Long-form', types: ['Blog', 'Newsletter'], icon: FileText },
];

export function Evolution({ videos, assets }: EvolutionProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(videos[0] || null);

  const videoAssets = useMemo(() => {
    if (!selectedVideo) return [];
    return assets.filter(a => a.source_video_id === selectedVideo.id);
  }, [assets, selectedVideo]);

  if (!selectedVideo) {
    return (
      <div className="card p-12 text-center">
        <Rocket className="w-8 h-8 text-ink-500 mx-auto mb-3" />
        <p className="text-ink-400">No videos available for evolution analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-50">AI Evolution</h2>
        <p className="text-sm text-ink-400 mt-1">Autonomous content agency — one video becomes everything</p>
      </div>

      {/* Evolution pipeline visualization */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-brand-300" />
          <h3 className="section-title">Content Evolution Pipeline</h3>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <div className="shrink-0 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-electric-500 flex items-center justify-center mb-2">
              <Youtube className="w-7 h-7 text-ink-950" />
            </div>
            <p className="text-xs text-ink-300">1 Source Video</p>
          </div>
          <ArrowRight className="w-5 h-5 text-ink-500 shrink-0" />
          <div className="shrink-0 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-2">
              <span className="font-display text-2xl font-bold text-brand-300">{videoAssets.length}</span>
            </div>
            <p className="text-xs text-ink-300">Generated Assets</p>
          </div>
          <ArrowRight className="w-5 h-5 text-ink-500 shrink-0" />
          <div className="flex gap-2 shrink-0">
            {['YouTube', 'TikTok', 'Instagram', 'X', 'LinkedIn', 'Facebook'].map(p => (
              <div key={p} className="text-center">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-1 ${platformColor(p)}`}>
                  <span className="text-[10px] font-medium">{p.slice(0, 2)}</span>
                </div>
                <p className="text-[9px] text-ink-400">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source video selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {videos.slice(0, 10).map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVideo(v)}
            className={`shrink-0 max-w-[220px] px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
              selectedVideo.id === v.id ? 'bg-brand-500 text-ink-950' : 'glass-hover text-ink-300'
            }`}
          >
            <span className="truncate block">{v.title}</span>
          </button>
        ))}
      </div>

      {/* Generated assets by category */}
      <div className="space-y-4">
        {assetCategories.map(cat => {
          const catAssets = videoAssets.filter(a => cat.types.includes(a.asset_type));
          if (catAssets.length === 0) return null;
          const CatIcon = cat.icon;
          return (
            <div key={cat.key} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CatIcon className="w-4 h-4 text-brand-300" />
                <h3 className="section-title">{cat.key}</h3>
                <span className="ml-auto badge-neutral">{catAssets.length} generated</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {catAssets.map(asset => {
                  const Icon = assetIcons[asset.asset_type] || FileText;
                  return (
                    <div key={asset.id} className="bg-ink-800/50 rounded-xl p-4 hover:bg-ink-700/50 transition-colors group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-brand-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-100">{asset.asset_type}</p>
                          <p className="text-[10px] text-ink-400">{asset.platform}</p>
                        </div>
                        <span className={`badge ${asset.status === 'Ready' ? 'badge-success' : 'badge-warning'}`}>{asset.status}</span>
                      </div>
                      <p className="text-xs text-ink-300 leading-relaxed line-clamp-4 group-hover:text-ink-200 transition-colors">
                        {asset.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Source video stats */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Source Video Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Views', value: formatNumber(selectedVideo.views) },
            { label: 'Likes', value: formatNumber(selectedVideo.likes) },
            { label: 'Shares', value: formatNumber(selectedVideo.shares) },
            { label: 'Followers Gained', value: formatNumber(selectedVideo.followers_gained) },
          ].map(s => (
            <div key={s.label} className="bg-ink-800/50 rounded-xl p-3">
              <p className="text-[10px] text-ink-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="font-display text-lg font-bold text-ink-50">{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-400 mt-3">
          Published {formatDate(selectedVideo.published_at)} · {selectedVideo.platform} · Viral Score {selectedVideo.viral_score.toFixed(0)}
        </p>
      </div>
    </div>
  );
}
