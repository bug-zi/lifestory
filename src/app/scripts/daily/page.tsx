'use client';

import { useState, useEffect } from 'react';
import { ScriptReader } from '@/components/ScriptReader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, RefreshCw, Lock, Inbox } from 'lucide-react';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Script } from '@/types';

export default function DailyScriptPage() {
  const { user: authUser } = useAuthContext();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsToken, setNeedsToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchDailyScript();
  }, []);

  async function fetchDailyScript() {
    setLoading(true);
    setNeedsToken(false);
    try {
      const res = await fetch('/api/scripts/daily');
      const data = await res.json();
      if (res.status === 402) {
        setNeedsToken(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setScript(data.script);
    } catch (err) {
      toast.error('获取副本失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!script) return;
    if (!authUser) {
      toast.error('请先登录');
      return;
    }
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: script.id }),
      });
      if (!res.ok) throw new Error();
      setIsSaved(true);
      toast.success('已保存到人生库');
    } catch {
      toast.error('保存失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BookOpen className="h-10 w-10 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">正在为你抽取今天的人生副本...</p>
        </div>
      </div>
    );
  }

  if (needsToken) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Lock className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">副本印记不足</h2>
            <p className="text-muted-foreground mb-6">
              阅读副本需要消耗1枚副本印记。你可以通过签到、分享或购买获取印记。
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.href = '/checkin'}>
                前往签到领取
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/tokens'}>
                购买印记
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">暂无副本</h2>
            <p className="text-muted-foreground mb-6">
              今天还没有可用的副本，请稍后再来。
            </p>
            <Button onClick={fetchDailyScript} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              重新获取
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScriptReader
      script={script}
      onSave={handleSave}
      isSaved={isSaved}
    />
  );
}
