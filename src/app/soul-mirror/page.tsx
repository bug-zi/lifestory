'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, Sparkles, RotateCcw, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SoulData {
  soulTitle: string;
  soulColor: string;
  soulAnimal: string;
  coreTrait: string;
  shadow: string;
  destiny: string[];
  mirrorNarrative: string;
  advice: string;
  missingPiece: string;
}

interface Stats {
  totalLives: number;
  topCategories: [string, number][];
  topEras: [string, number][];
}

export default function SoulMirrorPage() {
  const { user, loading: authLoading } = useAuth();
  const [soul, setSoul] = useState<SoulData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function handleGenerate() {
    if (!user) return;
    setLoading(true);
    setRevealed(false);
    setSoul(null);
    try {
      const res = await fetch('/api/soul-mirror', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '生成失败');
        return;
      }
      setSoul(data.soul);
      setStats(data.stats);
      // Trigger reveal animation after a short delay
      setTimeout(() => setRevealed(true), 300);
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setLoading(false);
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
            <p className="text-sm text-muted-foreground mb-4">登录后照见你的灵魂</p>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">灵魂镜像</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          你选择体验的每一条人生，都是灵魂的一面镜子。<br />
          让我们看看，镜子里映出了什么。
        </p>
      </div>

      {/* Generate button */}
      {!soul && !loading && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleGenerate}
            className="px-8 py-6 text-base font-heading"
          >
            <Eye className="w-5 h-5 mr-2" />
            照见灵魂
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-2 border-primary/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-primary/20 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-4 rounded-full bg-primary/5" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">正在凝视你的灵魂深处…</p>
        </div>
      )}

      {/* Soul Mirror Result */}
      {soul && stats && (
        <div className={`transition-all duration-1000 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Soul Title */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 rounded-full border-2 border-primary/30 bg-primary/5 mb-4">
              <span className="font-heading text-2xl font-bold text-primary">{soul.soulTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground">{soul.soulColor}</p>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-8 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.totalLives}</div>
              <div className="text-xs text-muted-foreground">条人生</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.topCategories.length}</div>
              <div className="text-xs text-muted-foreground">个领域</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.topEras.length}</div>
              <div className="text-xs text-muted-foreground">个时代</div>
            </div>
          </div>

          {/* Main narrative */}
          <Card className="mb-6 border-border/40 bg-card/50">
            <CardContent className="py-6">
              <p className="text-base leading-relaxed text-foreground/90 font-heading whitespace-pre-line">
                {soul.mirrorNarrative}
              </p>
            </CardContent>
          </Card>

          {/* Traits grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="border-border/40">
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">核心特质</p>
                <p className="text-sm font-semibold text-foreground">{soul.coreTrait}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">暗影</p>
                <p className="text-sm font-semibold text-foreground">{soul.shadow}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">灵魂动物</p>
                <p className="text-sm font-semibold text-foreground">{soul.soulAnimal}</p>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">缺失的拼图</p>
                <p className="text-sm font-semibold text-foreground">{soul.missingPiece}</p>
              </CardContent>
            </Card>
          </div>

          {/* Destiny keywords */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">命运关键词</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(soul.destiny) ? soul.destiny : []).map((d: string) => (
                <Badge key={d} variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">
                  {d}
                </Badge>
              ))}
            </div>
          </div>

          {/* Advice */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">给你的话</p>
              <p className="text-sm font-heading font-semibold text-foreground">{soul.advice}</p>
            </CardContent>
          </Card>

          {/* Regenerate */}
          <div className="text-center mt-8">
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              重新照见
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
