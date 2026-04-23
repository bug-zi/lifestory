'use client';

import React, { memo } from 'react';
import type { GraphLink, GraphNode } from '@/lib/graph-utils';

interface ConnectionLinkProps {
  link: GraphLink;
  isHighlighted: boolean;
  isDimmed: boolean;
}

function getSourcePos(link: GraphLink): { x: number; y: number } {
  const s = link.source;
  if (typeof s === 'string') return { x: 0, y: 0 };
  return { x: (s as GraphNode).x, y: (s as GraphNode).y };
}

function getTargetPos(link: GraphLink): { x: number; y: number } {
  const t = link.target;
  if (typeof t === 'string') return { x: 0, y: 0 };
  return { x: (t as GraphNode).x, y: (t as GraphNode).y };
}

const typeStyles: Record<string, { dash: string; baseOpacity: number }> = {
  category: { dash: 'none', baseOpacity: 0.3 },
  era: { dash: '6 3', baseOpacity: 0.25 },
  tag: { dash: '3 3', baseOpacity: 0.2 },
  mood: { dash: '2 4', baseOpacity: 0.15 },
};

export const ConnectionLink = memo(function ConnectionLink({
  link,
  isHighlighted,
  isDimmed,
}: ConnectionLinkProps) {
  const src = getSourcePos(link);
  const tgt = getTargetPos(link);
  const style = typeStyles[link.type] || typeStyles.tag;
  const opacity = isDimmed ? 0.03 : isHighlighted ? Math.min(style.baseOpacity * 2.5, 0.7) : style.baseOpacity;

  return (
    <line
      x1={src.x}
      y1={src.y}
      x2={tgt.x}
      y2={tgt.y}
      stroke="var(--muted-foreground)"
      strokeWidth={isHighlighted ? 1.8 : 0.8}
      strokeOpacity={opacity}
      strokeDasharray={style.dash}
      style={{ transition: 'stroke-opacity 0.3s ease' }}
    />
  );
});
