import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { GraphNode, GraphLink } from './graph-utils';

export interface SimulationResult {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function createForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number
) {
  const simulation = forceSimulation<GraphNode>(nodes)
    .force(
      'link',
      forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(90)
        .strength((d) => d.strength * 0.6)
    )
    .force('charge', forceManyBody<GraphNode>().strength(-180))
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collision',
      forceCollide<GraphNode>().radius((d) => d.radius + 6)
    )
    .alphaDecay(0.03)
    .velocityDecay(0.4);

  return simulation;
}

// Run simulation to stable state synchronously (for SSR-like initial render)
export function runSimulationSync(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number
): SimulationResult {
  const sim = createForceSimulation(nodes, links, width, height);
  // Manually tick until stable
  for (let i = 0; i < 300; i++) {
    sim.tick();
    if (sim.alpha() < 0.001) break;
  }
  sim.stop();
  return { nodes, links };
}
