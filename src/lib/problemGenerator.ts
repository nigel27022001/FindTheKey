// problemGenerator.ts
import { findAllCandidateKeys } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";
import { passesStructuralProfile } from "./constraintAlgorithms";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Problem {
  allAttrs: string[];
  fds: FD[];
  candidateKeys: string[][];
}

// A - number of attrs, F - number of functional dependencies, 
// K - number of candidate keys, KL - number of attributes in candidate key
interface DifficultyConfig {
  minA: number; maxA: number;
  minF: number; maxF: number;
  minK: number; maxK: number;
  minKL: number; maxKL: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { minA: 3, maxA: 4, minF: 2, maxF: 3, minK: 1, maxK: 1, minKL: 1, maxKL: 1 },
  medium: { minA: 4, maxA: 5, minF: 3, maxF: 4, minK: 1, maxK: 2, minKL: 1, maxKL: 2 },
  hard: { minA: 5, maxA: 6, minF: 5, maxF: 6, minK: 2, maxK: 3, minKL: 2, maxKL: 3 },
  expert: { minA: 6, maxA: 6, minF: 6, maxF: 7, minK: 2, maxK: 3, minKL: 2, maxKL: 3 },

};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "3–4 attrs · 2–3 FDs · exactly 1 key",
  medium: "4–5 attrs · 3–4 FDs · 1–2 keys",
  hard: "5–6 attrs · 5–6 FDs · 2–3 keys · deeper transitive chains",
  expert: "6 attrs · 6–7 FDs · 2–3 keys · high overlap/noise",
};

export const HINT_COUNTS: Record<Difficulty, number> = {
  easy: 3, medium: 3, hard: 2, expert: 1,
};

// Utils
function isValidKeyLength(candidateKeys: string[][], cfg: DifficultyConfig) {
  return candidateKeys.reduce(
    (acc, key) => acc && key.length >= cfg.minKL && key.length <= cfg.maxKL, true)
}

function isValidNumberOfKeys(candidateKeys: string[][], cfg: DifficultyConfig) {
  const nk = candidateKeys.length;
  return nk <= cfg.maxK && nk >= cfg.minK;
}

function generateWeightedArray(percentages: number[]): number[] {
  return percentages.flatMap((pct, ind) => Array(pct).fill(ind + 1));
}

function allAttrsReachable(allAttrs: string[], fds: FD[]): boolean {
  const onRHS = new Set(fds.flatMap(fd => fd.rhs));
  const onLHS = new Set(fds.flatMap(fd => fd.lhs));
  return allAttrs.every(a => onRHS.has(a) || onLHS.has(a));
}

export function findRHSOnlyAttributes(allAttrs: string[], fds: FD[]): string[] {
  const onLHS = new Set(fds.flatMap(fd => fd.lhs));
  return allAttrs.filter(a => !onLHS.has(a));
}
/** updates FDs to include attributes that appear only on RHS. Return empty array if fail */
function obfuscateRHSOnlyAttributes(fds: FD[], rhsOnlyAttrs: string[]): FD[] {
  if (rhsOnlyAttrs.length === 0) return fds;

  const updated: FD[] = fds.map(fd => ({ lhs: [...fd.lhs], rhs: [...fd.rhs] }));

  for (const attr of rhsOnlyAttrs) {
    const eligible = updated
      .map((fd, idx) => ({ fd, idx }))
      .filter(({ fd }) => !fd.lhs.includes(attr) && !fd.rhs.includes(attr));

    if (eligible.length === 0) return [];

    const { fd, idx } = eligible[randInt(0, eligible.length - 1)];

    updated[idx] = {
      lhs: [...fd.lhs, attr].sort(),
      rhs: fd.rhs
    };
  }

  return updated;
}

export function findLHSOnlyAttributes(allAttrs: string[], fds: FD[]): string[] {
  const onRHS = new Set(fds.flatMap(fd => fd.rhs));
  return allAttrs.filter(a => !onRHS.has(a));
}

function obfuscateLHSOnlyAttributes(fds: FD[], lhsOnlyAttrs: string[]): FD[] {
  if (lhsOnlyAttrs.length === 0) return fds;

  const updated: FD[] = fds.map(fd => ({ lhs: [...fd.lhs], rhs: [...fd.rhs] }));

  for (const attr of lhsOnlyAttrs) {
    const eligible = updated
      .map((fd, idx) => ({ fd, idx }))
      .filter(({ fd }) => !fd.lhs.includes(attr) && !fd.rhs.includes(attr));

    if (eligible.length === 0) return [];

    const { fd, idx } = eligible[randInt(0, eligible.length - 1)];

    updated[idx] = {
      lhs: fd.lhs,
      rhs: [...fd.rhs, attr].sort(),
    };
  }

  return updated;
}

const FD_PERCENTAGE_LHS: Record<Difficulty, number[]> = {
  easy: generateWeightedArray([100]),
  medium: generateWeightedArray([50, 50]),
  hard: generateWeightedArray([20, 50, 30]),
  expert: generateWeightedArray([20, 30, 30, 20]),
};

const FD_PERCENTAGE_RHS: Record<Difficulty, Record<number, number[]>> = {
  easy: {
    1: generateWeightedArray([100]),
  },
  medium: {
    1: generateWeightedArray([50, 50]),
    2: generateWeightedArray([50, 50]),
  },
  hard: {
    1: generateWeightedArray([100]),
    2: generateWeightedArray([30, 50, 20]),
    3: generateWeightedArray([50, 30, 20]),
  },
  expert: {
    1: generateWeightedArray([60, 40]),
    2: generateWeightedArray([30, 30, 20, 20]),
    3: generateWeightedArray([30, 30, 20, 20]),
    4: generateWeightedArray([50, 30, 20]),
  },
};

const ATTR_POOL = "ABCDEFGHI".split("");

const randInt = (a: number, b: number): number =>
  a + Math.floor(Math.random() * (b - a + 1));

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const pick = <T>(arr: T[], k: number): T[] => shuffle(arr).slice(0, k);

const pickOne = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

export function buildFallbackProblem(diff: Difficulty): Problem {
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

function hasMeetDifficultyFdRequirements(
  diff: Difficulty,
  fds: FD[],
  allAttrs: string[]
): [boolean, FD[]] {
  switch (diff) {
    case "easy":
      return [true, fds];

    case "medium": {
      if (!allAttrsReachable(allAttrs, fds)) return [false, fds];

      const rhsOnly = findRHSOnlyAttributes(allAttrs, fds);
      if (rhsOnly.length > 0) {
        fds = obfuscateRHSOnlyAttributes(fds, rhsOnly);
        if (fds.length === 0) return [false, fds];
      }

      return [true, fds];
    }

    case "hard":
    case "expert": {
      if (!allAttrsReachable(allAttrs, fds)) return [false, fds];

      const rhsOnly = findRHSOnlyAttributes(allAttrs, fds);
      if (rhsOnly.length > 0) {
        fds = obfuscateRHSOnlyAttributes(fds, rhsOnly);
        if (fds.length === 0) return [false, fds];
      }

      const lhsOnly = findLHSOnlyAttributes(allAttrs, fds);
      if (lhsOnly.length > 0) {
        fds = obfuscateLHSOnlyAttributes(fds, lhsOnly);
        if (fds.length === 0) return [false, fds];
      }

      return [true, fds];
    }

    default:
      return [true, fds];
  }
}


export function generateProblem(diff: Difficulty): Problem {
  const cfg = DIFFICULTY_CONFIG[diff];

  for (let attempt = 0; attempt < 3000; attempt++) {
    const numAttrs = randInt(cfg.minA, cfg.maxA);
    const allAttrs = ATTR_POOL.slice(0, numAttrs);

    const numFDs = randInt(cfg.minF, cfg.maxF);
    let fds: FD[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < numFDs * 3 && fds.length < numFDs; i++) {
      const lhsSize = pickOne(FD_PERCENTAGE_LHS[diff]);
      const lhs = pick(allAttrs, lhsSize).sort();
      const remaining = allAttrs.filter(a => !lhs.includes(a));
      if (!remaining.length) continue;

      // Fallback RHS table entry — if lhsSize has no entry use size 1
      const rhsTable = FD_PERCENTAGE_RHS[diff][lhsSize] ?? [1];
      const rhsSize = pickOne(rhsTable);
      const rhs = pick(remaining, Math.min(rhsSize, remaining.length)).sort();
      const key = lhs.join("") + "->" + rhs.join("");

      if (!seen.has(key)) { seen.add(key); fds.push({ lhs, rhs }); }
    }

    const candidateKeys = findAllCandidateKeys(allAttrs, fds);

    const [hasMeet, newFds] = hasMeetDifficultyFdRequirements(diff, fds, allAttrs);

    if (!hasMeet) continue
    fds = newFds;

    if (
      isValidKeyLength(candidateKeys, cfg) &&
      isValidNumberOfKeys(candidateKeys, cfg) &&
      candidateKeys.some(k => k.length < numAttrs) &&
      passesStructuralProfile(diff, allAttrs, fds, candidateKeys)
    ) {
      return { allAttrs, fds, candidateKeys };
    }
  }

  return buildFallbackProblem(diff);
}
