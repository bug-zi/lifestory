'use client';

import React from 'react';
import Link from 'next/link';
import { X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GraphNode } from '@/lib/graph-utils';

interface Props {
  node: GraphNode;
  onClose: () => void;
}

export function BubbleDetailPanel({ node, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/40 backdrop-blur-sm">
      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl max-w-sm w-[90vw] p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Color accent bar */}
        <div className="w-full h-1 rounded-full mb-4" style={{ backgroundColor: node.color }} />

        <h3 className="font-heading text-lg font-bold text-foreground mb-1">{node.title}</h3>
        {node.subtitle && (
          <p className="text-sm text-muted-foreground mb-3">{node.subtitle}</p>
        )}

        <div className="space-y-2 mb-4">
          {node.category && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">类别</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                {node.category}
              </span>
            </div>
          )}
          {node.era && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">时代</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/20">
                {node.era}
              </span>
            </div>
          )}
          {node.mood && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">心境</span>
              <span className="text-sm text-foreground">{node.mood}</span>
            </div>
          )}
          {node.wordCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">字数</span>
              <span className="text-sm text-foreground">{node.wordCount.toLocaleString()}</span>
            </div>
          )}
          {node.tags.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0 mt-0.5">标签</span>
              <div className="flex flex-wrap gap-1">
                {node.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href={`/scripts/${node.scriptId}`} className="block">
          <Button className="w-full" variant="default" size="sm">
            <BookOpen className="w-4 h-4 mr-1.5" />
            阅读此副本
          </Button>
        </Link>
      </div>
    </div>
  );
}
