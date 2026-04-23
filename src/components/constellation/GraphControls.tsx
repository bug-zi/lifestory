'use client';

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onZoom: (delta: number) => void;
  onReset: () => void;
  scale: number;
}

export function GraphControls({ onZoom, onReset, scale }: Props) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg bg-card/80 backdrop-blur border-border/50"
        onClick={() => onZoom(0.2)}
        title="放大"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg bg-card/80 backdrop-blur border-border/50"
        onClick={() => onZoom(-0.2)}
        title="缩小"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-lg bg-card/80 backdrop-blur border-border/50"
        onClick={onReset}
        title="重置"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <div className="text-[10px] text-center text-muted-foreground mt-0.5">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
