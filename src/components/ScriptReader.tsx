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
  List,
  X,
  ScrollText,
  Sparkles,
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
  const [showOutline, setShowOutline] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect text selection for "add to literary library"
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    function handleSelectionChange() {
      clearTimeout(hideTimer);
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 0 && contentRef.current?.contains(sel!.anchorNode)) {
        const range = sel!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const vw = window.innerWidth;
        const btnW = 160;
        const x = Math.max(btnW / 2 + 8, Math.min(rect.left + rect.width / 2, vw - btnW / 2 - 8));
        const y = Math.max(60, rect.top - 8);
        setSelection({ text, x, y });
      } else {
        hideTimer = setTimeout(() => setSelection(null), 150);
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
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

  // Track active section with IntersectionObserver
  useEffect(() => {
    const ids: string[] = [];
    sections.forEach((_, i) => {
      if (showFull || i < 3) ids.push(`section-${i}`);
    });
    if (showFull || sections.length <= 3) {
      if (summary) ids.push('section-summary');
      if (highlights.length > 0) ids.push('section-highlights');
    }

    const elements = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === 'section-summary') {
              setActiveSection(sections.length);
            } else if (id === 'section-highlights') {
              setActiveSection(sections.length + 1);
            } else {
              setActiveSection(parseInt(id.replace('section-', '')));
            }
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px' }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections.length, showFull, summary, highlights.length]);

  // Outline click handler
  const handleOutlineClick = useCallback((index: number) => {
    if (index < sections.length) {
      if (!showFull && index >= 3) {
        setShowFull(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      } else {
        document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const id = index === sections.length ? 'section-summary' : 'section-highlights';
      // Ensure full view for summary/highlights
      if (!showFull && sections.length > 3) {
        setShowFull(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setShowOutline(false);
  }, [showFull, sections.length]);

  // Build outline items
  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + '...' : str;

  type OutlineType = 'section' | 'summary' | 'highlights';
  const outlineItems: { label: string; shortLabel: string; type: OutlineType }[] = sections.map((s, i) => {
    const raw = s.title
      ? s.title.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim()
      : `卷${cnNums[i + 1] || i + 1}`;
    return { label: raw, shortLabel: truncate(raw, 15), type: 'section' as const };
  });
  if (summary) outlineItems.push({ label: '最终总结', shortLabel: '总结', type: 'summary' });
  if (highlights.length > 0) outlineItems.push({ label: '高光句子', shortLabel: '金句', type: 'highlights' });

  // Shared outline nav content
  const outlineNav = (
    <nav className="space-y-0.5">
      {outlineItems.map((item, i) => (
        <button
          key={i}
          onClick={() => handleOutlineClick(i)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
            activeSection === i
              ? 'bg-accent/10 text-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          {item.type === 'summary' ? (
            <ScrollText className={`h-3.5 w-3.5 shrink-0 transition-colors ${activeSection === i ? 'text-accent' : 'text-muted-foreground/40'}`} />
          ) : item.type === 'highlights' ? (
            <Sparkles className={`h-3.5 w-3.5 shrink-0 transition-colors ${activeSection === i ? 'text-accent' : 'text-muted-foreground/40'}`} />
          ) : (
            <span className={`text-xs leading-none shrink-0 transition-colors ${activeSection === i ? 'text-accent' : 'text-muted-foreground/30'}`}>
              {activeSection === i ? '◆' : '◇'}
            </span>
          )}
          <span className="truncate">{item.shortLabel}</span>
        </button>
      ))}
    </nav>
  );

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

      {/* Outline sidebar — Desktop */}
      <aside className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 w-52 flex-col">
        <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-3 shadow-sm max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 px-3 mb-2">
            <List className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground tracking-wider">大纲导航</span>
          </div>
          {outlineNav}
        </div>
      </aside>

      {/* Outline toggle button — Mobile/Tablet */}
      <button
        onClick={() => setShowOutline(true)}
        className="lg:hidden fixed left-4 bottom-20 md:bottom-4 z-30 flex items-center justify-center w-10 h-10 rounded-full border bg-background/90 backdrop-blur-sm shadow-md hover:bg-accent/10 transition-colors"
        aria-label="打开大纲导航"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Outline drawer — Mobile/Tablet */}
      {showOutline && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowOutline(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-background border-r shadow-xl p-5 pt-16 overflow-y-auto animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setShowOutline(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="关闭大纲"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">大纲导航</span>
            </div>
            {outlineNav}
          </div>
        </>
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
          <h1 className="text-3xl md:text-4xl font-heading text-foreground">{script.title}</h1>
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
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <div ref={contentRef} className="prose prose-neutral max-w-none font-heading">
          {sections.map((section, i) => {
            if (showFull || i < 3) {
              const isLastVisible = (showFull && i === sections.length - 1) || (!showFull && i === 2 && sections.length > 3);
              return (
                <div key={i} id={`section-${i}`} className="mb-10 scroll-mt-16">
                  {section.title && (
                    <div className="flex items-center gap-3 mb-5">
                      <span className="section-number">卷{cnNums[i + 1] || i + 1}</span>
                      <h2 className="text-xl font-heading text-foreground/90">
                        {section.title}
                      </h2>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
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
              id="section-summary"
              className="mt-8 mb-10 rounded-2xl overflow-hidden shadow-lg relative scroll-mt-16"
              style={{
                backgroundImage: 'url(/images/UI1.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
              <div className="relative z-10 p-6 md:p-8">
                <h3 className="text-lg font-heading mb-3 text-gray-800/90 tracking-wider">
                  ✦ 最终总结
                </h3>
                <p className="text-gray-700/90 italic">
                  {summary}
                </p>
              </div>
            </div>
          )}

          {/* Highlight Sentences */}
          {(showFull || sections.length <= 3) && highlights.length > 0 && (
            <div id="section-highlights" className="mt-4 mb-10 scroll-mt-16">
              <h3 className="text-lg font-heading mb-4 text-accent-foreground tracking-wider">
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
                      <p className="flex-1 text-gray-700/90">
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
  const parts = content.split(/\n---\n/);
  const hasSeparator = parts.length > 1;
  const storyText = parts[0];
  const extraText = hasSeparator ? parts.slice(1).join('\n---\n') : content;

  let storyOnly = storyText;
  if (!hasSeparator) {
    const cutIdx = storyText.search(/\n##\s*最终总结/);
    if (cutIdx > 0) storyOnly = storyText.slice(0, cutIdx);
  }
  const storySections = splitIntoSections(storyOnly);

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
