'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Share2,
  PenLine,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import type { Script } from '@/types';

interface ScriptReaderProps {
  script: Script;
  onSave?: () => void;
  onEdit?: () => void;
  isSaved?: boolean;
}

export function ScriptReader({ script, onSave, onEdit, isSaved }: ScriptReaderProps) {
  const [showFull, setShowFull] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split content into sections by emoji headers (e.g. "🥀 童年：xxx")
  const sections = splitIntoSections(script.content);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Reading progress bar */}
      <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link href="/scripts/daily">
          <Button variant="ghost" size="sm" className="gap-1 mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold">{script.title}</h1>
        {script.subtitle && (
          <p className="mt-2 text-lg text-muted-foreground">{script.subtitle}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {script.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {script.word_count && (
            <span className="text-sm text-muted-foreground">
              {script.word_count} 字
            </span>
          )}
          {script.mood && (
            <Badge variant="outline">{script.mood}</Badge>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Content */}
      <div ref={contentRef} className="prose prose-neutral max-w-none">
        {sections.map((section, i) => {
          if (showFull || i < 3) {
            return (
              <div key={i} className="mb-8">
                {section.title && (
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {section.title}
                  </h2>
                )}
                <div className="text-base leading-relaxed whitespace-pre-wrap">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="mb-4 indent-8">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}

        {!showFull && sections.length > 3 && (
          <div className="text-center py-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFull(true)}
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              继续阅读
            </Button>
          </div>
        )}
        {showFull && sections.length > 3 && (
          <div className="text-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFull(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="gap-1"
            >
              <ChevronUp className="h-4 w-4" />
              收起
            </Button>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <Separator className="my-8" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={onSave}
          >
            <Bookmark className="h-4 w-4" />
            {isSaved ? '已保存' : '保存到人生库'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
            <PenLine className="h-4 w-4" />
            二次创作
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          分享
        </Button>
      </div>
    </div>
  );
}

function splitIntoSections(content: string) {
  const lines = content.split('\n').filter((l) => l.trim());
  const sections: { title: string | null; paragraphs: string[] }[] = [];
  let current: { title: string | null; paragraphs: string[] } = {
    title: null,
    paragraphs: [],
  };

  for (const line of lines) {
    // Detect emoji headers like "🥀 童年：在暴力中觉醒" or "🎮 觉醒：从..."
    const emojiHeaderMatch = line.match(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*.+$/u);
    if (emojiHeaderMatch && current.paragraphs.length > 0) {
      sections.push(current);
      current = { title: line.trim(), paragraphs: [] };
    } else if (emojiHeaderMatch && current.paragraphs.length === 0) {
      current.title = line.trim();
    } else {
      current.paragraphs.push(line.trim());
    }
  }
  if (current.paragraphs.length > 0 || current.title) {
    sections.push(current);
  }

  return sections;
}
