'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Clock,
  BookmarkPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Script } from '@/types';

import { CheckCircle2 } from 'lucide-react';

interface ScriptReaderProps {
  script: Script;
  onSave?: () => void;
  isSaved?: boolean;
  onReadLater?: () => void;
  isReadLater?: boolean;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export function ScriptReader({ script, onSave, isSaved, onReadLater, isReadLater, onComplete, isCompleted }: ScriptReaderProps) {
  const router = useRouter();
  const [showFull, setShowFull] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect text selection for "add to literary library"
  // Uses selectionchange (works on both desktop & mobile touch selection)
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    function handleSelectionChange() {
      clearTimeout(hideTimer);
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 0 && contentRef.current?.contains(sel!.anchorNode)) {
        const range = sel!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Clamp position to keep button visible on small screens
        const vw = window.innerWidth;
        const btnW = 160; // approximate button width
        const x = Math.max(btnW / 2 + 8, Math.min(rect.left + rect.width / 2, vw - btnW / 2 - 8));
        const y = Math.max(60, rect.top - 8);
        setSelection({ text, x, y });
      } else {
        // Small delay to prevent flicker when clicking the add button
        hideTimer = setTimeout(() => setSelection(null), 150);
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    // Also listen mouseup for immediate response on desktop
    document.addEventListener('mouseup', handleSelectionChange);
    // touchend for mobile — wait a tick for selection to finalize
    document.addEventListener('touchend', () => setTimeout(handleSelectionChange, 300));

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleAddToLiteraryLibrary = useCallback(async () => {
    if (!selection) return;
    try {
      const res = await fetch('/api/literary-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: selection.text,
          script_id: script.id,
          script_title: script.title,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('已添加到文学库');
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch {
      toast.error('添加失败');
    }
  }, [selection, script]);

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

  // Split content into sections by emoji headers, then extract summary & highlights
  const { storySections, summary, highlights } = parseContent(script.content);
  const sections = storySections;

  // Chinese numerals for chapter numbering
  const cnNums = ['〇','一','二','三','四','五','六','七','八','九','十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
      {/* Reading progress bar */}
      <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-muted">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Floating "add to literary library" button on text selection */}
      {selection && (
        <button
          onClick={handleAddToLiteraryLibrary}
          className="fixed z-50 flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm shadow-lg transition-opacity hover:bg-accent active:bg-accent"
          style={{ left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)' }}
        >
          <BookmarkPlus className="h-4 w-4" />
          添加到文学库
        </button>
      )}

      {/* Right sidebar — desktop */}
      <aside className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-3 w-36">
        <Button
          variant={isSaved ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 w-full justify-start"
          onClick={onSave}
        >
          <Bookmark className="h-4 w-4" />
          {isSaved ? '从人生库移除' : '添加到人生库'}
        </Button>
        {onReadLater && (
          <Button
            variant={isReadLater ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 w-full justify-start"
            onClick={onReadLater}
          >
            <Clock className="h-4 w-4" />
            {isReadLater ? '已在待读' : '稍后再读'}
          </Button>
        )}
      </aside>

      {/* Mobile bottom action bar — save & read-later */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t px-4 py-2 gap-2 safe-area-bottom">
        <Button
          variant={isSaved ? 'default' : 'outline'}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onSave}
        >
          <Bookmark className="h-4 w-4" />
          {isSaved ? '已收藏' : '收藏'}
        </Button>
        {onReadLater && (
          <Button
            variant={isReadLater ? 'default' : 'outline'}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onReadLater}
          >
            <Clock className="h-4 w-4" />
            {isReadLater ? '已待读' : '稍后读'}
          </Button>
        )}
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
          {(showFull || sections.length <= 3) && (
            <div className="chapter-ornament mt-4 mb-2">· · ·</div>
          )}

          {/* Final Summary */}
          {(showFull || sections.length <= 3) && summary && (
            <div
              className="mt-8 mb-10 rounded-2xl overflow-hidden shadow-lg relative"
              style={{
                backgroundImage: 'url(/images/UI1.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
              <div className="relative z-10 p-6 md:p-8">
                <h3 className="text-lg font-semibold font-heading mb-3 text-gray-800/90 tracking-wider">
                  ✦ 最终总结
                </h3>
                <p className="text-base leading-[1.8] tracking-wide text-gray-700/90 italic">
                  {summary}
                </p>
              </div>
            </div>
          )}

          {/* Highlight Sentences */}
          {(showFull || sections.length <= 3) && highlights.length > 0 && (
            <div className="mt-4 mb-10">
              <h3 className="text-lg font-semibold font-heading mb-4 text-accent-foreground tracking-wider">
                ✦ 高光句子
              </h3>
              <div className="space-y-4">
                {highlights.map((sentence, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden shadow-lg relative"
                    style={{
                      backgroundImage: 'url(/images/UI1.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
                    <div className="relative z-10 flex items-start gap-3 px-5 py-4 md:px-6 md:py-5">
                      <span className="mt-0.5 text-gray-400 text-xl leading-none select-none font-serif">「</span>
                      <p className="text-base leading-[1.8] tracking-wide flex-1 text-gray-700/90">
                        {sentence}
                      </p>
                      <span className="mt-0.5 text-gray-400 text-xl leading-none select-none font-serif">」</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Complete Reading Button */}
          {onComplete && (showFull || sections.length <= 3) && (
            <div className="text-center mt-12 mb-8">
              <Button
                variant={isCompleted ? 'default' : 'outline'}
                size="lg"
                onClick={onComplete}
                disabled={isCompleted}
                className="gap-2 min-w-[200px]"
              >
                <CheckCircle2 className="h-5 w-5" />
                {isCompleted ? '已完成阅读' : '完成阅读'}
              </Button>
            </div>
          )}
        </div>
      </div>
  );
}

function parseContent(content: string) {
  // Split by "---" separator to separate story from summary/highlights
  const parts = content.split(/\n---\n/);
  // If no separator, use full content as both story and extra text
  const hasSeparator = parts.length > 1;
  const storyText = parts[0];
  const extraText = hasSeparator ? parts.slice(1).join('\n---\n') : content;

  // Parse story sections — strip summary/highlights from story portion
  let storyOnly = storyText;
  if (!hasSeparator) {
    const cutIdx = storyText.search(/\n##\s*最终总结/);
    if (cutIdx > 0) storyOnly = storyText.slice(0, cutIdx);
  }
  const storySections = splitIntoSections(storyOnly);

  // Parse summary and highlights from extra text
  let summary = '';
  const highlights: string[] = [];

  if (extraText) {
    const summaryMatch = extraText.match(/##\s*最终总结\s*\n([\s\S]*?)(?=\n##\s*高光句子|$)/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    const highlightsMatch = extraText.match(/##\s*高光句子\s*\n([\s\S]*?)$/);
    if (highlightsMatch) {
      const lines = highlightsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const bracketMatch = line.match(/「(.+?)」/);
        if (bracketMatch) {
          highlights.push(bracketMatch[1]);
        } else if (!line.startsWith('#') && !line.startsWith('-')) {
          highlights.push(line);
        }
      }
    }
  }

  return { storySections, summary, highlights };
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
