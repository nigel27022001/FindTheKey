/**
 * problemGenerator.ts
 * Randomly generates relational schema problems with FDs at four difficulty levels.
 */

import { findAllCandidateKeys } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Problem {
  allAttrs:      string[];
  fds:           FD[];
  candidateKeys: string[][];
}

interface DifficultyConfig {
  minA: number; maxA: number;
  minF: number; maxF: number;
  minK: number; maxK: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { minA: 3, maxA: 4, minF: 2, maxF: 3, minK: 1, maxK: 1 },
  medium: { minA: 4, maxA: 5, minF: 3, maxF: 4, minK: 1, maxK: 2 },
  hard:   { minA: 5, maxA: 6, minF: 4, maxF: 6, minK: 2, maxK: 4 },
  expert: { minA: 6, maxA: 7, minF: 5, maxF: 8, minK: 3, maxK: 6 },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   "3–4 attrs · 2–3 FDs · exactly 1 key",
  medium: "4–5 attrs · 3–4 FDs · 1–2 keys",
  hard:   "5–6 attrs · 4–6 FDs · 2–4 keys",
  expert: "6–7 attrs · 5–8 FDs · 3+ keys",
};

export const HINT_COUNTS: Record<Difficulty, number> = {
  easy: 3, medium: 3, hard: 2, expert: 1,
};

const ATTR_POOL = "ABCDEFGHI".split("");

const randInt = (a: number, b: number): number =>
  a + Math.floor(Math.random() * (b - a + 1));

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pick = <T>(arr: T[], k: number): T[] => shuffle(arr).slice(0, k);

/**
 * Generate a random problem for the given difficulty.
 * Retries up to 300 times until key-count constraints are satisfied.
 */
export function generateProblem(diff: Difficulty): Problem {
  const cfg = DIFFICULTY_CONFIG[diff];

  for (let attempt = 0; attempt < 300; attempt++) {
    const numAttrs = randInt(cfg.minA, cfg.maxA);
    const allAttrs = ATTR_POOL.slice(0, numAttrs);
    const numFDs   = randInt(cfg.minF, cfg.maxF);
    const fds: FD[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < numFDs * 3 && fds.length < numFDs; i++) {
      const lhsSize =
        diff === "easy"   ? 1 :
        diff === "medium" ? randInt(1, 2) :
                            randInt(1, Math.min(3, numAttrs - 1));

      const lhs       = pick(allAttrs, Math.min(lhsSize, numAttrs - 1)).sort();
      const remaining = allAttrs.filter(a => !lhs.includes(a));
      if (!remaining.length) continue;

      const rhsSize =
        diff === "easy" ? randInt(1, 2) :
                          randInt(1, Math.min(3, remaining.length));

      const rhs = pick(remaining, rhsSize).sort();
      const key = lhs.join("") + "->" + rhs.join("");
      if (!seen.has(key)) { seen.add(key); fds.push({ lhs, rhs }); }
    }

    if (fds.length < 2) continue;

    const candidateKeys = findAllCandidateKeys(allAttrs, fds);
    const nk = candidateKeys.length;

    if (nk >= cfg.minK && nk <= cfg.maxK && candidateKeys.some(k => k.length < numAttrs)) {
      return { allAttrs, fds, candidateKeys };
    }
  }

  // Guaranteed fallback
  return {
    allAttrs:      ["A", "B", "C"],
    fds:           [{ lhs: ["A"], rhs: ["B", "C"] }],
    candidateKeys: [["A"]],
  };
}
