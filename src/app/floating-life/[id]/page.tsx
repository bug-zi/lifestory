'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ScriptReader } from '@/components/ScriptReader';
import { useAuthContext } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Archive, ArchiveRestore } from 'lucide-react';
import type { Script, FloatingLifeStory } from '@/types';

function storyToScript(story: FloatingLifeStory): Script {
  return {
    id: story.id,
    title: story.title,
    subtitle: story.subtitle,
    content: story.content,
    cover_image: story.cover_image,
    tags: story.tags,
    mood: story.mood,
    category: story.source,
    era: story.era,
    word_count: story.word_count || 0,
    author_id: null,
    is_official: true,
    view_count: story.view_count,
    rating_avg: null,
    created_at: story.created_at,
  };
}

export default function FloatingLifeReadingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const [story, setStory] = useState<FloatingLifeStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/floating-life/${id}`)
      .then((res) => res.json())
      .then((data) => setStory(data.story))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleComplete() {
    if (!story || !authUser) return;
    try {
      const res = await fetch(`/api/floating-life/${story.id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setIsCompleted(true);
      toast.success('已标记为已读');
    } catch {
      toast.error('操作失败');
    }
  }

  async function handleArchive() {
    if (!story) return;
    try {
      const res = await fetch(`/api/floating-life/${story.id}/archive`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      const { is_archived } = await res.json();
      toast.success(is_archived ? '已归档' : '已取消归档');
      if (is_archived) {
        router.push('/floating-life');
      } else {
        setStory({ ...story, is_archived: false, archived_at: null });
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

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">故事不存在</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed top-20 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          className="gap-1.5 shadow-sm"
        >
          {story.is_archived ? (
            <><ArchiveRestore className="h-3.5 w-3.5" />取消归档</>
          ) : (
            <><Archive className="h-3.5 w-3.5" />归档</>
          )}
        </Button>
      </div>
      <ScriptReader
        script={storyToScript(story)}
        onComplete={handleComplete}
        isCompleted={isCompleted}
      />
    </div>
  );
}
