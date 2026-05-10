'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';

interface Fortune {
  id: string;
  fortune_text: string;
  source_title: string | null;
  shared: boolean;
}

export function FortuneCard() {
  const { user } = useAuthContext();
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);

  async function drawFortune() {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/fortune', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFortune(data.fortune);
      setShared(data.fortune.shared);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '求签失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    try {
      const res = await fetch('/api/fortune', { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShared(true);
      toast.success('获得 1 枚副本印记！');

      // 尝试调用 Web Share API
      if (navigator.share && fortune) {
        await navigator.share({
          title: '今日命运签',
          text: fortune.fortune_text,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error(err.message);
      }
    }
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm text-muted-foreground">每日一签，洞见命运</span>
        </div>
        <div>
          <Link href="/checkin">
            <Button variant="outline" size="sm">登录后求签</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 有签文：展示签文卡片
  if (fortune) {
    // 解析签文格式
    const lines = fortune.fortune_text.split('\n').filter(Boolean);
    let fortuneLine = '';
    let interpretation = '';
    let source = '';

    for (const line of lines) {
      if (line.startsWith('签文：')) fortuneLine = line.replace('签文：', '');
      else if (line.startsWith('解签：')) interpretation = line.replace('解签：', '');
      else if (line.startsWith('出处：')) source = line.replace('出处：', '');
    }

    return (
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto"
        style={{
          backgroundImage: 'url(/images/UI1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        <div className="relative z-10 p-6 md:p-8 text-center">
          {/* 签文 */}
          <p className="font-heading text-xl md:text-2xl text-gray-800 leading-relaxed mb-4 tracking-wider">
            {fortuneLine || fortune.fortune_text}
          </p>

          {/* 解签 */}
          {interpretation && (
            <p className="text-sm text-gray-600/80 leading-relaxed mb-3">
              {interpretation}
            </p>
          )}

          {/* 出处 */}
          {source && (
            <p className="text-xs text-gray-500/70 italic mb-4">
              {source}
            </p>
          )}

          {/* 分享按钮 */}
          {shared ? (
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已领取分享奖励
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              分享领印记
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 未求签：显示求签按钮
  return (
    <div className="text-center py-8">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg max-w-md mx-auto cursor-pointer group"
        onClick={loading ? undefined : drawFortune}
        style={{
          backgroundImage: 'url(/images/UI1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] group-hover:bg-white/60 transition-colors" />
        <div className="relative z-10 p-8 md:p-10 text-center">
          <Sparkles className="h-8 w-8 text-accent/70 mx-auto mb-3 group-hover:text-accent transition-colors" />
          <p className="text-sm text-gray-500 mb-1">今日命运签</p>
          <p className="font-heading text-lg text-gray-700 mb-4">点击求一签</p>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-accent" />
          ) : (
            <span className="text-xs text-gray-400">AI 基于你的人生阅历生成</span>
          )}
        </div>
      </div>
    </div>
  );
}
