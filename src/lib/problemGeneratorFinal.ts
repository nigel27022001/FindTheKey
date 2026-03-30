/**
 * problemGenerator.ts
 * Randomly generates relational schema problems with FDs at four difficulty levels.
 */

import { computeClosure, findAllCandidateKeys, getCombinations } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Problem {
  allAttrs:      string[];
  fds:           FD[];
  candidateKeys: string[][];
}

/** A - attrs, F - fd len, K - number of keys, KL - candidate key len */
interface DifficultyConfig {
  minA: number; maxA: number;
  minF: number; maxF: number;
  minK: number; maxK: number;
  minKL: number; maxKL: number;
}

interface FdConstraints {
  minLHS: number;
  maxLHS: number;
  minRHS: number;
  maxRHS: number;
}

export const FD_CONFIG: Record<Difficulty, FdConstraints> = {
  easy: {minLHS: 1, maxLHS: 1, minRHS: 1, maxRHS: 2},
  medium: {minLHS: 1, maxLHS: 2, minRHS: 1, maxRHS: 3},
  hard: {minLHS: 1, maxLHS: 3, minRHS: 1, maxRHS: 3},
  expert: {minLHS: 2, maxLHS: 4, minRHS: 1, maxRHS: 3},
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { minA: 3, maxA: 4, minF: 2, maxF: 3, minK: 1, maxK: 1, minKL: 1, maxKL: 1},
  medium: { minA: 4, maxA: 5, minF: 3, maxF: 4, minK: 1, maxK: 1, minKL: 1, maxKL: 2 },
  hard:   { minA: 5, maxA: 6, minF: 4, maxF: 5, minK: 2, maxK: 3, minKL: 2, maxKL: 3 },
  expert: { minA: 6, maxA: 7, minF: 5, maxF: 8, minK: 2, maxK: 3, minKL: 2, maxKL: 4 },
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

const ATTR_POOL = "ABCDEFGHI".split("");

const randInt = (a: number, b: number): number =>
  a + Math.floor(Math.random() * (b - a + 1));

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pick = <T>(arr: T[], k: number): T[] => shuffle(arr).slice(0, k);

interface StructuralThreshold {
  minDerivationRounds: number;
  minRedundantLHS: number
  //minOverlapRatio: number;
  minRedundantFDs: number;
  minNearMisses: number;
  minAvgLhsSize: number;
  keyInLHSratio: number; // refers to candidate key being directly derived from LHS
}

const STRUCTURAL_THRESHOLDS: Partial<Record<Difficulty, StructuralThreshold>> = {
  hard: {
    minDerivationRounds: 3,
    minRedundantLHS: 1,
    //minOverlapRatio: 0.25,
    minRedundantFDs: 1,
    minNearMisses: 1,
    minAvgLhsSize: 1.4,
    keyInLHSratio: 0.75
  },
  expert: {
    minDerivationRounds: 3,
    //minOverlapRatio: 0.3,
    minRedundantLHS: 2,
    minRedundantFDs: 1,
    minNearMisses: 1,
    minAvgLhsSize: 1.8,
    keyInLHSratio: 0.50
  },
};

const keySignature = (attrs: string[]): string => [...attrs].sort().join("");

/** Computes the transiitive chains for the key 
 Starts from the set of key attributes, computes the number of rounds required in
 iterating FDs to complete the closure*/
function closureRounds(key: string[], fds: FD[]): number {
  const plus = new Set(key);
  let rounds = 0;

  while (true) {
    let changed = false;

    for (const fd of fds) {
      if (!fd.lhs.every(a => plus.has(a))) continue;
      for (const b of fd.rhs) {
        if (!plus.has(b)) {
          plus.add(b);
          changed = true;
        }
      }
    }

    if (!changed) break;
    rounds++;
  }

  return rounds;
}

function maxKeyDerivationRounds(candidateKeys: string[][], fds: FD[]): number {
  return candidateKeys.reduce((max, key) => Math.max(max, closureRounds(key, fds)), 0);
}

/**Counts the number of attributes that appear more than once on LHS. 
 * Return the number over number of attrs*/
function lhsOverlapRatio(allAttrs: string[], fds: FD[]): number {
  const freq = new Map<string, number>();
  for (const fd of fds) {
    for (const a of fd.lhs) {
      freq.set(a, (freq.get(a) ?? 0) + 1);
    }
  }

  const overlappingAttrs = allAttrs.filter(a => (freq.get(a) ?? 0) > 1).length;
  return overlappingAttrs / allAttrs.length;
}

function countRedundantLHS(fds: FD[]): number {
  let count = 0;
  for (const fd of fds) {
    // Single-attribute LHS can never have redundancy
    if (fd.lhs.length < 2) continue;
    let hasRedundantAttr = false;

    for (const b of fd.lhs) {
      // Step 2: check if (X - {B}) → A still holds under Σ
      const reducedLhs = fd.lhs.filter(a => a !== b);
      
      for (const a of fd.rhs) {
        const closure = computeClosure(reducedLhs, fds);
        if (closure.has(a)) {
          hasRedundantAttr = true;
          break;
        }
      }
      if (hasRedundantAttr) break;
    }

    if (hasRedundantAttr) count++;
  }

  return count;
}

function countRedundantFDs(fds: FD[]): number {
  let redundant = 0;

  for (let i = 0; i < fds.length; i++) {
    const fd = fds[i];
    const others = fds.filter((_, idx) => idx !== i);
    const closure = computeClosure(fd.lhs, others);
    if (fd.rhs.every(attr => closure.has(attr))) {
      redundant++;
    }
  }

  return redundant;
}

function averageLhsSize(fds: FD[]): number {
  if (!fds.length) return 0;
  const total = fds.reduce((sum, fd) => sum + fd.lhs.length, 0);
  return total / fds.length;
}

function countNearMisses(allAttrs: string[], fds: FD[], candidateKeys: string[][]): number {
  if (!candidateKeys.length) return 0;

  const keySet = new Set(candidateKeys.map(keySignature));
  const minKeySize = Math.min(...candidateKeys.map(k => k.length));
  let nearMisses = 0;
    for (const combo of getCombinations(allAttrs, minKeySize)) {
    if (keySet.has(keySignature(combo))) continue;
    const closure = computeClosure(combo, fds);
    if (closure.size === allAttrs.length - 1) {
      nearMisses++;
    }
  }

  return nearMisses;
}

function passesStructuralProfile(
  diff: Difficulty,
  allAttrs: string[],
  fds: FD[],
  candidateKeys: string[][],
): boolean {
  const threshold = STRUCTURAL_THRESHOLDS[diff];
  if (!threshold) return true;

  const derivationRounds = maxKeyDerivationRounds(candidateKeys, fds);
  const redundantLHS = countRedundantLHS(fds);
//  const overlapRatio = lhsOverlapRatio(allAttrs, fds);
  const redundantFDs = countRedundantFDs(fds);
  const keyInLHSratio = getKeyInLHSratio(candidateKeys, fds)
 // const nearMisses = countNearMisses(allAttrs, fds, candidateKeys);
  //const avgLhsSize = averageLhsSize(fds);
  // nearMisses >= threshold.minNearMisses &&
  //avgLhsSize >= threshold.minAvgLhsSize

  return (
    derivationRounds >= threshold.minDerivationRounds &&
    redundantLHS >= threshold.minRedundantLHS &&
    redundantFDs >= threshold.minRedundantFDs &&
    keyInLHSratio <= threshold.keyInLHSratio
  );
}

function buildFallbackProblem(diff: Difficulty): Problem {
    console.log("fallback!")
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

function getKeyInLHSratio(candidateKeys: string[][], fds: FD[]): number {
  const lhsSignatures = new Set(fds.map(fd => keySignature(fd.lhs)));
  const overlaps = candidateKeys.reduce((acc, key) => lhsSignatures.has(keySignature(key)) ? acc + 1 : acc, 0);
  
  return overlaps / candidateKeys.length
}

/**
 * Generate a random problem for the given difficulty.
 * Retries up to 3000 times until key-count and structural constraints are satisfied.
 */
export function generateProblem(diff: Difficulty): Problem {
  const cfg = DIFFICULTY_CONFIG[diff];
  const fdCfg = FD_CONFIG[diff];

  for (let attempt = 0; attempt < 3000; attempt++) {
    const numAttrs = randInt(cfg.minA, cfg.maxA);
    const allAttrs = ATTR_POOL.slice(0, numAttrs);
    const numFDs   = randInt(cfg.minF, cfg.maxF);
    const fds: FD[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < numFDs * 3 && fds.length < numFDs; i++) {
      // Clamp maxLHS to numAttrs - 1 to always leave room for RHS
      const lhsSize = randInt(
        fdCfg.minLHS,
        Math.min(fdCfg.maxLHS, numAttrs - 1)
      );

      const lhs       = pick(allAttrs, lhsSize).sort();
      const remaining = allAttrs.filter(a => !lhs.includes(a));
      if (!remaining.length) continue;

      // Clamp maxRHS to remaining.length so we never over-pick
      const rhsSize = randInt(
        fdCfg.minRHS,
        Math.min(fdCfg.maxRHS, remaining.length)
      );

      const rhs = pick(remaining, rhsSize).sort();
      const key = lhs.join("") + "->" + rhs.join("");
      if (!seen.has(key)) { seen.add(key); fds.push({ lhs, rhs }); }
    }

    if (fds.length < 2) continue;

    const candidateKeys = findAllCandidateKeys(allAttrs, fds);
    const nk = candidateKeys.length;

    const isAllKeyLengthValid = candidateKeys.reduce(
      (acc, key) => acc && key.length >= cfg.minKL && key.length <= cfg.maxKL, true)

    if (!isAllKeyLengthValid) continue
  
    if (
      nk >= cfg.minK &&
      nk <= cfg.maxK &&
      candidateKeys.some(k => k.length < numAttrs) &&
      passesStructuralProfile(diff, allAttrs, fds, candidateKeys)
    ) {
      console.log(candidateKeys)
      return { allAttrs, fds, candidateKeys };
    }
  }

  return buildFallbackProblem(diff);
}
