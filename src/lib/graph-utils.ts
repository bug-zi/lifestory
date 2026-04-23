import type { LibraryItem } from '@/types';

// --- Graph types ---

export interface GraphNode {
  id: string;
  title: string;
  category: string | null;
  era: string | null;
  tags: string[];
  mood: string | null;
  wordCount: number;
  radius: number;
  color: string;
  // positions set by d3-force
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  // original data ref
  scriptId: string;
  subtitle: string | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'category' | 'era' | 'tag' | 'mood';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// --- Category color mapping (oklch) ---

const categoryColors: Record<string, string> = {
  '科技': 'oklch(0.65 0.12 200)',
  '文学': 'oklch(0.65 0.13 330)',
  '商业': 'oklch(0.65 0.12 70)',
  '哲学': 'oklch(0.60 0.10 280)',
  '政治': 'oklch(0.55 0.10 30)',
  '体育': 'oklch(0.65 0.14 100)',
  '冒险': 'oklch(0.55 0.12 150)',
  '犯罪': 'oklch(0.45 0.08 270)',
  '艺术': 'oklch(0.65 0.12 320)',
  '日常': 'oklch(0.60 0.06 80)',
};

const defaultColor = 'oklch(0.60 0.08 250)';

export function getCategoryColor(category: string | null): string {
  if (!category) return defaultColor;
  return categoryColors[category] || defaultColor;
}

// --- Radius scaling ---

function scaleRadius(wordCount: number): number {
  // Clamp between 24-52px
  const min = 24;
  const max = 52;
  const clamped = Math.min(Math.max(wordCount, 200), 5000);
  return min + ((clamped - 200) / (5000 - 200)) * (max - min);
}

// --- Transform LibraryItem[] → GraphData ---

export function transformToGraph(items: LibraryItem[], width: number, height: number): GraphData {
  if (items.length === 0) return { nodes: [], links: [] };

  const centerX = width / 2;
  const centerY = height / 2;

  const nodes: GraphNode[] = items.map((item, i) => {
    const script = item.script;
    const angle = (2 * Math.PI * i) / items.length;
    const spread = Math.min(width, height) * 0.25;
    return {
      id: item.id,
      scriptId: item.script_id,
      title: script?.title || '未命名副本',
      subtitle: script?.subtitle || null,
      category: script?.category || null,
      era: script?.era || null,
      tags: script?.tags || [],
      mood: script?.mood || null,
      wordCount: script?.word_count || 500,
      radius: scaleRadius(script?.word_count || 500),
      color: getCategoryColor(script?.category || null),
      x: centerX + Math.cos(angle) * spread + (Math.random() - 0.5) * 40,
      y: centerY + Math.sin(angle) * spread + (Math.random() - 0.5) * 40,
    };
  });

  const links: GraphLink[] = [];
  const linkSet = new Set<string>();

  function addLink(source: string, target: string, type: GraphLink['type'], strength: number) {
    const key = [source, target].sort().join('|') + ':' + type;
    if (linkSet.has(key)) return;
    linkSet.add(key);
    links.push({ source, target, type, strength });
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      // Same category — strong link
      if (a.category && b.category && a.category === b.category) {
        addLink(a.id, b.id, 'category', 0.8);
      }

      // Same era — medium link
      if (a.era && b.era && a.era === b.era) {
        addLink(a.id, b.id, 'era', 0.6);
      }

      // Shared tags
      if (a.tags.length > 0 && b.tags.length > 0) {
        const shared = a.tags.filter(t => b.tags.includes(t));
        if (shared.length > 0) {
          addLink(a.id, b.id, 'tag', Math.min(0.4 * shared.length, 0.8));
        }
      }

      // Same mood — weak link
      if (a.mood && b.mood && a.mood === b.mood) {
        addLink(a.id, b.id, 'mood', 0.3);
      }
    }
  }

  return { nodes, links };
}
