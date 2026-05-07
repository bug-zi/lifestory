'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ScriptReader } from '@/components/ScriptReader';
import { useAuthContext } from '@/components/auth-provider';
import { toast } from 'sonner';
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
    <ScriptReader
      script={storyToScript(story)}
      onComplete={handleComplete}
      isCompleted={isCompleted}
    />
  );
}
