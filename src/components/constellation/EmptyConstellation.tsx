'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyConstellation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Decorative circles */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-muted-foreground/15 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/40" />
          </div>
        </div>
        {/* Scattered small dots */}
        <div className="absolute top-2 right-0 w-3 h-3 rounded-full bg-primary/20" />
        <div className="absolute bottom-4 left-0 w-2 h-2 rounded-full bg-accent/20" />
        <div className="absolute top-12 left-2 w-2.5 h-2.5 rounded-full bg-muted-foreground/15" />
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
        命运星图空空如也
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        收藏人生副本到你的库中，它们将在此化为星辰，连成属于你的命运星图。
      </p>

      <div className="flex gap-3">
        <Link href="/hall-of-fame">
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-1.5" />
            探索名人堂
          </Button>
        </Link>
        <Link href="/diy">
          <Button size="sm">
            <Sparkles className="w-4 h-4 mr-1.5" />
            DIY 人生
          </Button>
        </Link>
      </div>
    </div>
  );
}
