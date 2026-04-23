'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Sparkles, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { LibraryItem } from '@/types';
import { PostcardCard } from '@/components/postcard/PostcardCard';

interface PostcardResult {
  quote: string;
  title: string;
  category: string | null;
  era: string | null;
}

export default function PostcardPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [postcard, setPostcard] = useState<PostcardResult | null>(null);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      fetch('/api/library')
        .then(res => res.json())
        .then(data => setItems(data.items || []))
        .catch(() => {})
        .finally(() => setDataLoading(false));
    } else {
      setDataLoading(false);
    }
  }, [user]);

  async function handleGenerate(scriptId: string) {
    setGenerating(true);
    setPostcard(null);
    try {
      const res = await fetch('/api/postcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '生成失败');
        return;
      }
      setPostcard(data);
    } catch {
      toast.error('网络错误');
    } finally {
      setGenerating(false);
    }
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <LogIn className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold mb-2">请先登录</h2>
            <p className="text-sm text-muted-foreground mb-4">登录后创建人生明信片</p>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              前往登录
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">加载中…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">人生明信片</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          从你体验过的人生中，提取最触动灵魂的一句话，<br />做成一张可以带走的水墨明信片。
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">人生库为空，先去体验一条人生吧</p>
          <Link href="/hall-of-fame">
            <Button variant="outline" size="sm">探索名人堂</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Script selection */}
          {!postcard && !generating && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-6">选择一条人生副本，提取它的灵魂金句</p>
              {items.map((item) => {
                const script = item.script;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleGenerate(item.script_id)}
                    className="w-full text-left p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 hover:border-border/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {script?.title || '未命名副本'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {script?.category && (
                            <span className="text-[11px] text-muted-foreground">{script.category}</span>
                          )}
                          {script?.era && (
                            <span className="text-[11px] text-muted-foreground/60">{script.era}</span>
                          )}
                        </div>
                      </div>
                      <Sparkles className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Generating */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground animate-pulse">从故事中凝练金句…</p>
            </div>
          )}

          {/* Result */}
          {postcard && (
            <div className="flex flex-col items-center">
              <PostcardCard
                quote={postcard.quote}
                title={postcard.title}
                category={postcard.category}
                era={postcard.era}
              />
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPostcard(null); }}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  重新选择
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
