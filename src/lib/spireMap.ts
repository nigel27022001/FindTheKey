import type { Difficulty } from "./problemGenerator";

export type NodeType = "minion" | "elite" | "boss" | "mystery" | "treasure" | "rest" | "shop";
export type NodeStatus = "locked" | "available" | "completed" | "current";

export interface SpireNode {
  id: string; // e.g. "0-0" (layer-index)
  layer: number;
  type: NodeType;
  status: NodeStatus;
  nextIds: string[]; // paths indicating allowed next nodes
  health?: number;   // health/number of problems if enemy
  x: number;         // 0 to 1 horizontal position
}

export interface EnemyConfig {
  type: "minion" | "elite" | "boss";
  name: string;
  spriteId: string;
  spriteColor: string;
  spriteFill: string;
  totalHealth: number;  // Fixed Health for difficulty as we want damage scaling with time
  Damage: number;
  problems: Difficulty[];
}

export const EnemyStats = {
  "minion": {
    health: 20,
    damage: 10,
  },
  "elite": {
    health: 50,
    damage: 15,
  },
  "boss": {
    health: 100,
    damage: 20,
  }
}

export const EnemyProblem = {
  "minion": {
    "easy": {
      playerDamage: 20,
      timer: 10
    },
    "medium": {
      playerDamage: 30,
      timer: 20
    },
  },
  "elite": {
    "medium": {
      playerDamage: 30,
      timer: 20
    },
    "hard": {
      playerDamage: 40,
      timer: 30
    }
  },
  "boss": {
    "hard": {
      playerDamage: 40,
      timer: 30
    },
    "expert": {
      playerDamage: 60,
      timer: 40
    }
  }
}
/**
 * Generate a Spire-like map with branching paths.
 */
export function generateSpireMap(layers: number = 10, width: number = 5): SpireNode[][] {
  const map: SpireNode[][] = [];

  // Layer 0 is starting layer (Minions)
  // Layer {layers-1} is Final Boss

  for (let l = 0; l < layers; l++) {
    const layerNodes: SpireNode[] = [];
    const numNodes = l === layers - 1 ? 1 : Math.min(width, Math.floor(Math.random() * width) + 2);

    for (let i = 0; i < numNodes; i++) {
      let type: NodeType = "minion";

      if (l === layers - 1) {
        type = "boss";
      } else if (l === layers - 2) {
        type = "rest";
      } else if (l > 0) {
        const rand = Math.random();
        if (rand < 0.2) type = "elite";
        else if (rand < 0.35) type = "mystery";
        else if (rand < 0.5) type = "shop";
        else if (rand < 0.6) type = "treasure";
        else type = "minion";
      }

      layerNodes.push({
        id: `${l}-${i}`,
        layer: l,
        type,
        status: "locked",
        nextIds: [],
        x: numNodes === 1 ? 0.5 : 0.15 + (i / (numNodes - 1)) * 0.7 + (Math.random() * 0.1 - 0.05)
      });
    }
    map.push(layerNodes);
  }

  // Generate valid paths
  for (let l = 0; l < layers - 1; l++) {
    const currentLayer = map[l];
    const nextLayer = map[l + 1];

    // Ensure every node connects to at least 1 next node (straight or adjacent)
    currentLayer.forEach((node, idx) => {
      const targetIdx = Math.floor((idx / currentLayer.length) * nextLayer.length);
      node.nextIds.push(nextLayer[targetIdx].id);

      // branch to immediate right
      if (Math.random() < 0.15 && targetIdx + 1 < nextLayer.length) {
        node.nextIds.push(nextLayer[targetIdx + 1].id);
      }

      // branch to immediate left
      if (Math.random() < 0.15 && targetIdx - 1 >= 0) {
        if (!node.nextIds.includes(nextLayer[targetIdx - 1].id)) {
          node.nextIds.push(nextLayer[targetIdx - 1].id);
        }
      }
    });

    // Ensure every next node is reachable by connecting the structurally closest parent
    nextLayer.forEach((nextNode, nextIdx) => {
      const isReachable = currentLayer.some(n => n.nextIds.includes(nextNode.id));
      if (!isReachable) {
        // connect the structurally closest current node to it instead of a fully random one
        const closestIdx = Math.floor((nextIdx / nextLayer.length) * currentLayer.length);
        if (!currentLayer[closestIdx].nextIds.includes(nextNode.id)) {
          currentLayer[closestIdx].nextIds.push(nextNode.id);
        }
      }
    });
  }

  // Start nodes are available
  map[0].forEach(n => n.status = "available");

  return map;
}

const MINION_ROSTER = [
  { name: "Cave Rat", spriteId: "rat", spriteColor: "#1f2937", spriteFill: "#9ca3af" },
  { name: "Corrosive Slime", spriteId: "droplet", spriteColor: "#14532d", spriteFill: "#4ade80" },
  { name: "Giant Beetle", spriteId: "bug", spriteColor: "#451a03", spriteFill: "#d97706" },
  { name: "Lost Skeleton", spriteId: "skull", spriteColor: "#1f2937", spriteFill: "#e2e8f0" },
];

const ELITE_ROSTER = [
  { name: "Phantom", spriteId: "ghost", spriteColor: "#7f1d1d", spriteFill: "#ef4444" },
  { name: "Fire Elemental", spriteId: "flame", spriteColor: "#7c2d12", spriteFill: "#fb923c" },
  { name: "Mercenary", spriteId: "sword", spriteColor: "#1e3a8a", spriteFill: "#94a3b8" },
];

const BOSS_ROSTER = [
  { name: "The Corrupted King", spriteId: "crown", spriteColor: "#4c1d95", spriteFill: "#c084fc" },
  { name: "Iron Golem", spriteId: "shield", spriteColor: "#0f172a", spriteFill: "#475569" },
  { name: "Ancient Lich", spriteId: "skull", spriteColor: "#3b0764", spriteFill: "#d8b4fe" },
];

export function generateEnemy(type: "minion" | "elite" | "boss"): EnemyConfig {
  if (type === "minion") {
    const template = MINION_ROSTER[Math.floor(Math.random() * MINION_ROSTER.length)];
    return {
      type,
      ...template,
      totalHealth: EnemyStats.minion.health,
      problems: [
        "easy",
        "medium"
      ],
      Damage: EnemyStats.minion.damage
    };
  } else if (type === "elite") {
    const template = ELITE_ROSTER[Math.floor(Math.random() * ELITE_ROSTER.length)];
    return {
      type, ...template, totalHealth: EnemyStats.elite.health, problems: ["medium", "hard"],
      Damage: EnemyStats.elite.damage
    };
  } else {
    const template = BOSS_ROSTER[Math.floor(Math.random() * BOSS_ROSTER.length)];
    return {
      type, ...template, totalHealth: EnemyStats.boss.health, problems: ["hard", "expert"],
      Damage: EnemyStats.boss.damage
    };
  }
}

export function getRandomEnemyProblem(enemy: EnemyConfig): { difficulty: Difficulty, damage: number, timer: number } {
  const randDiff = enemy.problems[Math.floor(Math.random() * enemy.problems.length)] as Difficulty;
  const details = (EnemyProblem as any)[enemy.type][randDiff];
  return { difficulty: randDiff, damage: details.playerDamage, timer: details.timer };
}
