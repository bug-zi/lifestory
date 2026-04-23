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
import { useRouter } from 'next/navigation';
import type { Script } from '@/types';

interface ScriptReaderProps {
  script: Script;
  onSave?: () => void;
  onEdit?: () => void;
  isSaved?: boolean;
}

export function ScriptReader({ script, onSave, onEdit, isSaved }: ScriptReaderProps) {
  const router = useRouter();
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

  // Chinese numerals for chapter numbering
  const cnNums = ['〇','一','二','三','四','五','六','七','八','九','十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Reading progress bar */}
      <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-muted">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="gap-1 mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold font-heading">{script.title}</h1>
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
            const isLastVisible = (showFull && i === sections.length - 1) || (!showFull && i === 2 && sections.length > 3);
            return (
              <div key={i} className="mb-10">
                {section.title && (
                  <div className="flex items-center gap-3 mb-5">
                    <span className="section-number">卷{cnNums[i + 1] || i + 1}</span>
                    <h2 className="text-xl font-semibold font-heading">
                      {section.title}
                    </h2>
                  </div>
                )}
                <div className="text-base leading-[1.8] tracking-wide whitespace-pre-wrap">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className={`mb-6 indent-8 ${j === 0 && i === 0 ? 'drop-cap' : ''}`}>
                      {p}
                    </p>
                  ))}
                </div>
                {!isLastVisible && <div className="ink-divider" />}
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

        {/* Ending ornament */}
        {showFull && (
          <div className="chapter-ornament mt-4 mb-2">· · ·</div>
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
