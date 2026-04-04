// problemGenerator.ts
import { computeClosure, findAllCandidateKeys } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";
import { passesStructuralProfile } from "./constraintAlgorithms";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Problem {
  allAttrs:      string[];
  fds:           FD[];
  candidateKeys: string[][];
}

// A - number of attrs, F - number of functional dependencies, K - number of candidate keys
interface DifficultyConfig {
  minA: number; maxA: number;
  minF: number; maxF: number;
  minK: number; maxK: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { minA: 3, maxA: 4, minF: 2, maxF: 3, minK: 1, maxK: 1, },
  medium: { minA: 4, maxA: 5, minF: 3, maxF: 4, minK: 1, maxK: 2, },
  hard:   { minA: 5, maxA: 6, minF: 4, maxF: 5, minK: 2, maxK: 3, },
  expert: { minA: 6, maxA: 7, minF: 5, maxF: 6, minK: 2, maxK: 3,  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   "3–4 attrs · 2–3 FDs · exactly 1 key",
  medium: "4–5 attrs · 3–4 FDs · 1–2 keys",
  hard:   "5–6 attrs · 4–6 FDs · 2–3 keys · deeper chains",
  expert: "6–7 attrs · 5–8 FDs · 2–3 keys · high overlap/noise",
};

export const HINT_COUNTS: Record<Difficulty, number> = {
  easy: 3, medium: 3, hard: 2, expert: 1,
};

// ─── LHS / RHS sampling ───────────────────────────────────────────────────────

const FD_PERCENTAGE_LHS: Record<Difficulty, number[]> = {
  easy:   [1],
  medium: [1, 2],
  hard:   [1, 1, 2, 2, 2, 2, 2, 3, 3, 3],
  expert: [1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4],
};

const FD_PERCENTAGE_RHS: Record<Difficulty, Record<number, number[]>> = {
  easy:   { 1: [1] },
  medium: { 1: [1, 2], 2: [1, 2] },
  hard:   { 1: [1, 1, 1, 2], 2: [1, 1, 2, 2, 3], 3: [1, 1, 1, 2] },
  expert: { 1: [1, 1, 1, 2], 2: [1, 1, 1, 2, 2], 3: [1, 1, 1, 2, 2], 4: [1, 1, 1, 2, 3] },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const ATTR_POOL = "ABCDEFGHI".split("");

const randInt = (a: number, b: number): number =>
  a + Math.floor(Math.random() * (b - a + 1));

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pick = <T>(arr: T[], k: number): T[] => shuffle(arr).slice(0, k);

const pickOne = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

function allAttrsReachable(allAttrs: string[], fds: FD[]): boolean {
  const onRHS = new Set(fds.flatMap(fd => fd.rhs));
  const onLHS = new Set(fds.flatMap(fd => fd.lhs));
  return allAttrs.every(a => onRHS.has(a) || onLHS.has(a));
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export function buildFallbackProblem(diff: Difficulty): Problem {
  console.log("fallback")
  if (diff === "easy") {
    const allAttrs = ["A", "B", "C"];
    const fds: FD[] = [{ lhs: ["A"], rhs: ["B", "C"] }];
    return { allAttrs, fds, candidateKeys: findAllCandidateKeys(allAttrs, fds) };
  }
  if (diff === "medium") {
    const allAttrs = ["A", "B", "C", "D"];
    const fds: FD[] = [
      { lhs: ["A"], rhs: ["B", "C", "D"] },
      { lhs: ["B"], rhs: ["A", "C", "D"] },
    ];
    return { allAttrs, fds, candidateKeys: findAllCandidateKeys(allAttrs, fds) };
  }
  if (diff === "hard") {
    const allAttrs = ["A", "B", "C", "D", "E"];
    const fds: FD[] = [
      { lhs: ["A"], rhs: ["C"] },
      { lhs: ["B"], rhs: ["D"] },
      { lhs: ["C"], rhs: ["A"] },
      { lhs: ["C", "D"], rhs: ["E"] },
      { lhs: ["E"], rhs: ["C"] },
    ];
    return { allAttrs, fds, candidateKeys: findAllCandidateKeys(allAttrs, fds) };
  }
  const allAttrs = ["A", "B", "C", "D", "E", "F", "G"];
  const fds: FD[] = [
    { lhs: ["A"], rhs: ["C"] },
    { lhs: ["C"], rhs: ["A"] },
    { lhs: ["B"], rhs: ["D"] },
    { lhs: ["C", "D"], rhs: ["E"] },
    { lhs: ["E"], rhs: ["F"] },
    { lhs: ["F"], rhs: ["G"] },
  ];
  return { allAttrs, fds, candidateKeys: findAllCandidateKeys(allAttrs, fds) };
}

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateProblem(diff: Difficulty): Problem {
  const cfg = DIFFICULTY_CONFIG[diff];

  for (let attempt = 0; attempt < 3000; attempt++) {
    const numAttrs = randInt(cfg.minA, cfg.maxA);
    const allAttrs = ATTR_POOL.slice(0, numAttrs);

    const numFDs   = randInt(cfg.minF, cfg.maxF);
    const fds: FD[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < numFDs * 3 && fds.length < numFDs; i++) {
      const lhsSize = pickOne(FD_PERCENTAGE_LHS[diff]);
      const lhs     = pick(allAttrs, lhsSize).sort();
      const remaining = allAttrs.filter(a => !lhs.includes(a));
      if (!remaining.length) continue;

      // Fallback RHS table entry — if lhsSize has no entry use size 1
      const rhsTable = FD_PERCENTAGE_RHS[diff][lhsSize] ?? [1];
      const rhsSize  = pickOne(rhsTable);
      const rhs      = pick(remaining, Math.min(rhsSize, remaining.length)).sort();
      const key      = lhs.join("") + "->" + rhs.join("");

      // if (lhs.length === 1 && rhs.length === 1 && (diff === "hard" || diff === "expert")) continue;
      if (!seen.has(key)) { seen.add(key); fds.push({ lhs, rhs }); }
    }
  
    if (diff !== "easy" && !allAttrsReachable(allAttrs, fds)) continue;
    const candidateKeys = findAllCandidateKeys(allAttrs, fds);

    const nk = candidateKeys.length;

    if (
      nk >= cfg.minK &&
      nk <= cfg.maxK &&
      candidateKeys.some(k => k.length < numAttrs) &&
      passesStructuralProfile(diff, allAttrs, fds, candidateKeys)
    ) {
      return { allAttrs, fds, candidateKeys };
    }
  }

  return buildFallbackProblem(diff);
}
