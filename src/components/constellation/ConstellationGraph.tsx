'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { LibraryItem } from '@/types';
import type { GraphNode, GraphLink } from '@/lib/graph-utils';
import { transformToGraph } from '@/lib/graph-utils';
import { createForceSimulation } from '@/lib/force-layout';
import { BubbleNode } from './BubbleNode';
import { ConnectionLink } from './ConnectionLink';
import { BubbleTooltip } from './BubbleTooltip';
import { BubbleDetailPanel } from './BubbleDetailPanel';
import { GraphControls } from './GraphControls';

interface Props {
  items: LibraryItem[];
}

export function ConstellationGraph({ items }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [positions, setPositions] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const simulationRef = useRef<ReturnType<typeof createForceSimulation> | null>(null);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Transform data and run simulation
  const graphData = useMemo(() => {
    return transformToGraph(items, dimensions.width, dimensions.height);
  }, [items, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (graphData.nodes.length === 0) {
      setPositions([]);
      setLinks([]);
      return;
    }

    const { nodes, links: graphLinks } = graphData;

    const sim = createForceSimulation(nodes, graphLinks, dimensions.width, dimensions.height);
    simulationRef.current = sim;

    let tickCount = 0;

    sim.on('tick', () => {
      tickCount++;
      if (tickCount % 3 === 0) {
        setPositions([...nodes]);
        setLinks([...graphLinks]);
      }
    });

    sim.on('end', () => {
      setPositions([...nodes]);
      setLinks([...graphLinks]);
    });

    return () => {
      sim.stop();
    };
  }, [graphData, dimensions.width, dimensions.height]);

  // Find highlighted links (connected to hovered node)
  const highlightedNodeIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const connected = new Set<string>([hoveredId]);
    for (const link of links) {
      const s = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const t = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      if (s === hoveredId) connected.add(t);
      if (t === hoveredId) connected.add(s);
    }
    return connected;
  }, [hoveredId, links]);

  // Drag handling
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);

  const handleDragStart = useCallback((nodeId: string, e: React.PointerEvent<SVGGElement>) => {
    const node = positions.find(n => n.id === nodeId);
    if (!node) return;
    dragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
    }
  }, [positions]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / viewTransform.scale;
      const dy = (e.clientY - dragRef.current.startY) / viewTransform.scale;
      const node = positions.find(n => n.id === dragRef.current!.nodeId);
      if (node) {
        node.x = dragRef.current.nodeStartX + dx;
        node.y = dragRef.current.nodeStartY + dy;
        node.fx = node.x;
        node.fy = node.y;
        setPositions([...positions]);
      }
    }
    function onUp() {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const node = positions.find(n => n.id === drag.nodeId);
      if (node) {
        node.fx = undefined;
        node.fy = undefined;
      }
      dragRef.current = null;
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [positions, viewTransform.scale]);

  // Zoom
  const handleZoom = useCallback((delta: number) => {
    setViewTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + delta, 0.3), 3),
    }));
  }, []);

  const handleReset = useCallback(() => {
    setViewTransform({ x: 0, y: 0, scale: 1 });
    // Restart simulation
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    handleZoom(delta);
  }, [handleZoom]);

  const selectedNode = useMemo(
    () => positions.find(n => n.id === selectedId) || null,
    [positions, selectedId]
  );

  if (positions.length === 0) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]" style={{ touchAction: 'none' }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="block"
        onWheel={handleWheel}
      >
        {/* SVG Filters for ink-wash effect */}
        <defs>
          <filter id="ink-wash">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="ink-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background subtle pattern */}
        <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

        <g transform={`translate(${viewTransform.x},${viewTransform.y}) scale(${viewTransform.scale})`}>
          {/* Links */}
          {links.map((link, i) => {
            const s = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
            const t = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
            const highlighted = hoveredId !== null && (s === hoveredId || t === hoveredId);
            const dimmed = hoveredId !== null && !highlighted;
            return (
              <ConnectionLink key={`${s}-${t}-${link.type}`} link={link} isHighlighted={highlighted} isDimmed={dimmed} />
            );
          })}

          {/* Nodes */}
          {positions.map(node => (
            <BubbleNode
              key={node.id}
              node={node}
              isHighlighted={highlightedNodeIds.has(node.id)}
              isDimmed={hoveredId !== null && !highlightedNodeIds.has(node.id)}
              onHover={setHoveredId}
              onClick={setSelectedId}
              onDragStart={handleDragStart}
            />
          ))}
        </g>
      </svg>

      {/* Tooltip overlay */}
      <BubbleTooltip
        node={hoveredId ? positions.find(n => n.id === hoveredId) || null : null}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
      />

      {/* Controls */}
      <GraphControls onZoom={handleZoom} onReset={handleReset} scale={viewTransform.scale} />

      {/* Detail panel */}
      {selectedNode && (
        <BubbleDetailPanel node={selectedNode} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
