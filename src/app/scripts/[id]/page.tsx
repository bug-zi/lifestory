'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ScriptReader } from '@/components/ScriptReader';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';
import type { Script } from '@/types';

export default function ScriptDetailPage() {
  const { id } = useParams();
  const { user: authUser } = useAuthContext();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/scripts/${id}`)
      .then((res) => res.json())
      .then((data) => setScript(data.script))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">副本不存在</p>
      </div>
    );
  }

  return <ScriptReader script={script} onSave={handleSave} isSaved={isSaved} />;
}
