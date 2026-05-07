'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, ScrollText, Heart, BookOpen, Sparkles, Brain, Clock,
  Loader2, CheckCircle2, Feather,
} from 'lucide-react';
import { useAuthContext } from '@/components/auth-provider';
import type { FloatingLifeStory } from '@/types';

const sources = [
  { value: 'all', label: '全部' },
  { value: '现代言情', label: '现代言情' },
  { value: '文学经典', label: '文学经典' },
  { value: '民间传说', label: '民间传说' },
  { value: 'AI原创', label: 'AI原创' },
];

const sourceIcons: Record<string, React.ReactNode> = {
  '现代言情': <Heart className="h-5 w-5" />,
  '文学经典': <BookOpen className="h-5 w-5" />,
  '民间传说': <Sparkles className="h-5 w-5" />,
  'AI原创': <Brain className="h-5 w-5" />,
};

const sourceGradients: Record<string, string> = {
  '现代言情': 'from-pink-500/10 to-rose-500/5',
  '文学经典': 'from-violet-500/10 to-purple-500/5',
  '民间传说': 'from-emerald-500/10 to-teal-500/5',
  'AI原创': 'from-blue-500/10 to-cyan-500/5',
};

export default function FloatingLifePage() {
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [stories, setStories] = useState<FloatingLifeStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<FloatingLifeStory[]>([]);
  const [readings, setReadings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (!authLoading) loadData(); }, [authLoading]);
  useEffect(() => { filterStories(); }, [stories, source, searchQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/floating-life');
      const data = await res.json();
      setStories(data.items || []);
      setReadings(new Set(data.readings || []));
    } catch {
      console.error('加载失败');
    } finally {
      setLoading(false);
    }
  }

  function filterStories() {
    let filtered = [...stories];
    if (source !== 'all') filtered = filtered.filter((s) => s.source === source);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q)
      );
    }
    setFilteredStories(filtered);
  }

  function stripContent(text: string): string {
    return text
      .replace(/^.{1,4}\s*/gm, '')
      .replace(/\n---\n[\s\S]*$/, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-12 md:py-16 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent)]" />
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent mb-4">
          <Feather className="h-3.5 w-3.5" />
          <span>意难平的情感故事</span>
        </div>
        <div className="ink-title-frame">
          <h1 className="text-4xl md:text-5xl font-bold font-calligraphy tracking-tight text-foreground text-glow">浮生记</h1>
        </div>
        <p className="mt-3 text-lg text-muted-foreground max-w-lg">
          浮生若梦，为欢几何。那些让人意难平的故事，每一篇都值得反复品读。
        </p>
      </section>

      {/* Search + Filters */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-sm -mx-4 px-4 pb-4 border-b mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索故事标题或作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-transparent px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ScrollText className="h-4 w-4 text-muted-foreground shrink-0" />
          {sources.map((s) => (
            <Button key={s.value} variant={source === s.value ? 'default' : 'ghost'} size="sm" className="h-7 text-xs rounded-full" onClick={() => setSource(s.value)}>
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Count + Stats */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">显示 {filteredStories.length} 篇故事</p>
        {authUser && (
          <p className="text-sm text-muted-foreground">
            已读 {readings.size}/{stories.length}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story) => {
            const isRead = readings.has(story.id);
            return (
              <Link
                key={story.id}
                href={`/floating-life/${story.id}`}
                className={`group rounded-xl border bg-gradient-to-br ${sourceGradients[story.source] || 'from-muted/50 to-transparent'} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative ${isRead ? 'ring-1 ring-violet-200 dark:ring-violet-800' : ''}`}
              >
                {isRead && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px] border-0 gap-1 px-1.5 py-0">
                      <CheckCircle2 className="h-3 w-3" />
                      已读
                    </Badge>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-accent">{sourceIcons[story.source]}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg leading-tight">{story.title}</h3>
                    {story.author && (
                      <p className="text-xs text-muted-foreground mt-0.5">{story.author}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs">{story.source}</Badge>
                  {story.era && <Badge variant="outline" className="text-xs">{story.era}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {story.subtitle || stripContent(story.content).slice(0, 120)}
                </p>
                {story.word_count && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{story.word_count} 字</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredStories.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">没有找到匹配的故事</p>
        </div>
      )}
    </div>
  );
}
