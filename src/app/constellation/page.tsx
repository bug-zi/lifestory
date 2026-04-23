'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { LibraryItem } from '@/types';
import { ConstellationGraph } from '@/components/constellation/ConstellationGraph';
import { EmptyConstellation } from '@/components/constellation/EmptyConstellation';

export default function ConstellationPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <LogIn className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold mb-2">请先登录</h2>
            <p className="text-sm text-muted-foreground mb-4">登录后查看你的命运星图</p>
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

  // Loading
  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">星辰排列中…</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-1">命运星图</h1>
          <p className="text-sm text-muted-foreground">你收藏的每一个人生副本，都化为星辰</p>
        </div>
        <EmptyConstellation />
      </div>
    );
  }

  // Main graph
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center mb-4">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">命运星图</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} 颗星辰，{items.length > 1 ? '彼此相连' : '孤独闪耀'}
        </p>
      </div>
      <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        <ConstellationGraph items={items} />
      </div>
    </div>
  );
}
