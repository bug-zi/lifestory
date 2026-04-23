'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Feather } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/auth-provider';

interface LiteraryItem {
  id: string;
  content: string;
  script_id: string | null;
  script_title: string | null;
  created_at: string;
}

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

export default function LiteraryLibraryPage() {
  const { user: authUser } = useAuthContext();
  const [items, setItems] = useState<LiteraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      fetch('/api/literary-library')
        .then((res) => res.json())
        .then((data) => setItems(data.items || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [authUser]);

  async function handleRemove(id: string) {
    try {
      const res = await fetch('/api/literary-library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('已从文学库移除');
      }
    } catch {
      toast.error('操作失败');
    }
  }

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold mb-2">请先登录</h2>
            <p className="text-muted-foreground mb-6">
              登录后即可使用文学库功能
            </p>
            <Link href="/login">
              <Button>前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Feather className="h-6 w-6" />
            文学库
          </h1>
          <p className="text-muted-foreground mt-1">
            共收藏 {items.length} 段文字
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📖</div>
          <h2 className="text-xl font-semibold mb-2">文学库还是空的</h2>
          <p className="text-muted-foreground mb-6">
            阅读人生副本时，选取喜欢的句子即可添加到文学库
          </p>
          <Link href="/scripts/daily">
            <Button>去阅读副本</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-5">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 text-accent-foreground/40 text-2xl leading-none select-none">「</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base leading-[1.8] tracking-wide">
                      {item.content}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                      {item.script_title && (
                        <>
                          <span>—— 出自</span>
                          {item.script_id ? (
                            <Link
                              href={`/scripts/${item.script_id}`}
                              className="text-accent-foreground hover:underline"
                            >
                              {item.script_title}
                            </Link>
                          ) : (
                            <span>{item.script_title}</span>
                          )}
                        </>
                      )}
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <span className="mt-0.5 text-accent-foreground/40 text-2xl leading-none select-none self-end">」</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
