'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Trash2, PenLine, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { LibraryItem } from '@/types';

// Helper: Extract title from content
function extractTitleFromContent(content: string): string {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Remove emoji prefix if present
    const withoutEmoji = firstLine.replace(/^[^\w\u4e00-\u9fa5]+/, '');
    if (withoutEmoji.length > 0 && withoutEmoji.length < 50) {
      return withoutEmoji;
    }
  }
  return '自定义副本';
}

// Helper: Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setItemsLoading(true);
      fetch('/api/library')
        .then((res) => res.json())
        .then((data) => setItems(data.items || []))
        .catch(() => {})
        .finally(() => setItemsLoading(false));
    } else {
      setItemsLoading(false);
    }
  }, [user]);

  async function handleRemove(scriptId: string) {
    try {
      const res = await fetch('/api/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.script_id !== scriptId));
        toast.success('已从人生库移除');
      }
    } catch {
      toast.error('操作失败');
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold mb-2">请先登录</h2>
            <p className="text-muted-foreground mb-6">
              登录后即可查看和管理你的人生库
            </p>
            <Link href="/login">
              <Button>前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">我的人生库</h1>
          <p className="text-muted-foreground mt-1">
            共 {items.length} 个人生副本
          </p>
        </div>
        <Link href="/scripts/daily">
          <Button className="gap-2">
            <BookOpen className="h-4 w-4" />
            探索更多
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">人生库还是空的</h2>
          <p className="text-muted-foreground mb-6">
            去探索每日副本，把你喜欢的人生保存下来
          </p>
          <Link href="/scripts/daily">
            <Button>开始探索</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            // 三层降级显示逻辑
            const displayTitle = item.script?.title
              || (item.custom_content && extractTitleFromContent(item.custom_content))
              || '已删除的副本';

            const displayWordCount = item.script?.word_count
              || (item.custom_content && item.custom_content.length)
              || 0;

            const displayDate = item.script?.created_at || item.saved_at;

            return (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/scripts/${item.script_id}`}>
                      <h3 className="font-semibold hover:underline truncate">
                        {displayTitle}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.is_customized && (
                        <Badge variant="secondary" className="text-xs">
                          已二次创作
                        </Badge>
                      )}
                      {item.script?.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {displayWordCount.toLocaleString()}字
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(displayDate)}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemove(item.script_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
