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
  const [isReadLater, setIsReadLater] = useState(false);

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
      if (isSaved) {
        const res = await fetch('/api/library', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script_id: script.id }),
        });
        if (!res.ok) throw new Error();
        setIsSaved(false);
        toast.success('已从人生库移除');
      } else {
        const res = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script_id: script.id }),
        });
        if (!res.ok) throw new Error();
        setIsSaved(true);
        toast.success('已添加到人生库');
      }
    } catch {
      toast.error('操作失败');
    }
  }

  async function handleReadLater() {
    if (!script) return;
    if (!authUser) {
      toast.error('请先登录');
      return;
    }
    try {
      if (isReadLater) {
        const res = await fetch('/api/read-later', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script_id: script.id }),
        });
        if (!res.ok) throw new Error();
        setIsReadLater(false);
        toast.success('已从待读列表移除');
      } else {
        const res = await fetch('/api/read-later', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script_id: script.id }),
        });
        if (!res.ok) throw new Error();
        setIsReadLater(true);
        toast.success('已添加到稍后再读');
      }
    } catch {
      toast.error('操作失败');
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

  return <ScriptReader script={script} onSave={handleSave} isSaved={isSaved} onReadLater={handleReadLater} isReadLater={isReadLater} />;
}
