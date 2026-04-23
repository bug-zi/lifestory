'use client';

import React from 'react';
import type { GraphNode } from '@/lib/graph-utils';

interface Props {
  node: GraphNode | null;
  containerWidth: number;
  containerHeight: number;
}

export function BubbleTooltip({ node, containerWidth, containerHeight }: Props) {
  if (!node) return null;

  // Position tooltip near node, but keep within bounds
  const tipW = 220;
  const tipH = 120;
  let left = node.x + node.radius + 12;
  let top = node.y - tipH / 2;

  if (left + tipW > containerWidth - 16) left = node.x - node.radius - tipW - 12;
  if (top < 16) top = 16;
  if (top + tipH > containerHeight - 16) top = containerHeight - tipH - 16;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{ left, top, maxWidth: tipW }}
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-lg shadow-lg px-3 py-2.5">
        <p className="font-heading text-sm font-semibold text-foreground leading-tight mb-1">
          {node.title}
        </p>
        {node.subtitle && (
          <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{node.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {node.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {node.category}
            </span>
          )}
          {node.era && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {node.era}
            </span>
          )}
          {node.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
