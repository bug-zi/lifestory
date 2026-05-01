'use client';

import React, { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  quote: string;
  title: string;
  category?: string | null;
  era?: string | null;
}

export function PostcardCard({ quote, title, category, era }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `人生明信片-${title}.png`;
      link.href = dataUrl;
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Fallback: just show the card for screenshot
    }
  }, [title]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The postcard itself */}
      <div
        ref={cardRef}
        className="relative w-[360px] h-[480px] rounded-lg overflow-hidden select-none"
        style={{
          background: 'linear-gradient(145deg, #1a1612 0%, #2a2420 40%, #1e1a16 100%)',
          fontFamily: 'var(--font-calligraphy), var(--font-heading), cursive',
        }}
      >
        {/* Subtle ink wash texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(ellipse at 20% 50%, oklch(0.7 0.02 80) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, oklch(0.6 0.02 200) 0%, transparent 40%),
              radial-gradient(ellipse at 60% 80%, oklch(0.5 0.02 30) 0%, transparent 45%)`,
          }}
        />

        {/* Top decoration line */}
        <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />

        {/* Category badge */}
        {(category || era) && (
          <div className="absolute top-12 left-8 flex gap-2">
            {category && (
              <span className="text-[10px] tracking-widest text-amber-600/50 uppercase">
                {category}
              </span>
            )}
            {era && (
              <span className="text-[10px] tracking-widest text-amber-600/30">
                {era}
              </span>
            )}
          </div>
        )}

        {/* Main quote */}
        <div className="absolute inset-0 flex items-center justify-center px-12">
          <p
            className="text-center text-xl leading-loose text-amber-50/85"
            style={{ letterSpacing: '0.05em' }}
          >
            {quote}
          </p>
        </div>

        {/* Title at bottom */}
        <div className="absolute bottom-10 left-8 right-8">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700/20 to-transparent mb-3" />
          <p className="text-xs text-amber-600/40 text-center tracking-[0.3em]">
            人生副本 · {title}
          </p>
        </div>

        {/* Corner seal */}
        <div className="absolute bottom-8 right-8 w-6 h-6 rounded-full border border-red-900/30 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-red-900/20" />
        </div>
      </div>

      {/* Save button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        className="gap-1.5"
      >
        {saved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        {saved ? '已保存' : '保存图片'}
      </Button>
    </div>
  );
}
