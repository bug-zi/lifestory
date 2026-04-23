'use client';

import React, { memo } from 'react';
import type { GraphNode } from '@/lib/graph-utils';

interface BubbleNodeProps {
  node: GraphNode;
  isHighlighted: boolean;
  isDimmed: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  onDragStart: (id: string, e: React.PointerEvent<SVGGElement>) => void;
}

export const BubbleNode = memo(function BubbleNode({
  node,
  isHighlighted,
  isDimmed,
  onHover,
  onClick,
  onDragStart,
}: BubbleNodeProps) {
  const opacity = isDimmed ? 0.15 : isHighlighted ? 1 : 0.85;
  const strokeW = isHighlighted ? 2.5 : 1.5;
  const filterRef = isHighlighted ? 'url(#ink-glow)' : 'url(#ink-wash)';

  // Truncate label for small bubbles
  const label =
    node.radius < 30 ? node.title.charAt(0) : node.title.length > 6 ? node.title.slice(0, 6) + '…' : node.title;
  const fontSize = Math.max(10, Math.min(node.radius * 0.38, 16));

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: 'grab', transition: 'opacity 0.3s ease' }}
      opacity={opacity}
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => onHover(null)}
      onPointerDown={(e) => {
        onDragStart(node.id, e);
      }}
      onClick={() => onClick(node.id)}
    >
      {/* Outer glow ring */}
      <circle
        r={node.radius + 4}
        fill="none"
        stroke={node.color}
        strokeWidth={1}
        strokeOpacity={isHighlighted ? 0.5 : 0.15}
        filter="url(#ink-wash)"
      />
      {/* Main bubble */}
      <circle
        r={node.radius}
        fill={node.color}
        fillOpacity={0.2}
        stroke={node.color}
        strokeWidth={strokeW}
        strokeOpacity={0.7}
        filter={filterRef}
      />
      {/* Inner gradient circle */}
      <circle
        r={node.radius * 0.6}
        fill={node.color}
        fillOpacity={0.12}
      />
      {/* Label */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--foreground)"
        fontSize={fontSize}
        fontFamily="var(--font-heading)"
        fontWeight={600}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  );
});
