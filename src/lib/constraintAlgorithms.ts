// constraintAlgorithms.ts
import { computeClosure, findAllCandidateKeys, getCombinations, lhsContainsCandidateKey } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";
import type { Difficulty } from "./problemGenerator";

export interface HardLimits {
  minDerivationDepthRatio: number; // derivationRounds / numAttrs
  keyInLHSRatio:           number; // if candidate key is in LHS of FD
  meaningfulRedundantFdsRatio:  number;
}

export interface ScoreThreshold {
  minScore: number;
  maxScore: number;
}

export interface StructuralThreshold {
  hardLimits:     HardLimits;
  scoreThreshold: ScoreThreshold;
}

export interface ScoredProfile {
  // Hard limit metrics
  derivationDepthRatio: number;
  keyInLHSRatio:        number;
  meaningfulRedundantFdsRatio: number;

  // Score breakdown
  meaningfulRedundantLHS:    number; // complicating — LHS has no key subset
  distractingRedundantFDs:   number; // complicating — LHS has no key subset
  chainShortcuttingFDs:      number; // simplifying  — LHS contains a key

  // Final
  rawScore:        number;
  normalisedScore: number; // rawScore / fds.length
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  meaningfulRedundantLHS:  +1.0,  // strongest distractor — misleads minimality check
  distractingRedundantFD:  +1.0,  // misleads key search — reward
  chainShortcuttingFD:     -0.5,  // shortcuts derivation — penalise 
} as const;



// ─── Thresholds ───────────────────────────────────────────────────────────────


export const STRUCTURAL_THRESHOLDS: Partial<Record<Difficulty, StructuralThreshold>> = {
  hard: {
    hardLimits: {
      minDerivationDepthRatio: 0.3,  // rounds / numAttrs — ~2 rounds on 6 attrs
      keyInLHSRatio:           0.5,  // at most half the keys directly visible
      meaningfulRedundantFdsRatio:  0,
    },
    scoreThreshold: { minScore: 0, maxScore: 0.3 },
  },
  expert: {
    hardLimits: {
      minDerivationDepthRatio: 0.5,  // ~3 rounds on 7 attrs
      keyInLHSRatio:           0.5,  // no key may appear directly as LHS
      meaningfulRedundantFdsRatio:  0.1,
    },
    scoreThreshold: { minScore: 0.3, maxScore: 1.0 },
  },
};



const keySignature = (attrs: string[]): string => [...attrs].sort().join("");

function closureRounds(key: string[], fds: FD[]): number {
  const plus = new Set(key);
  let rounds = 0;

  while (true) {
    let changed = false;
    for (const fd of fds) {
      if (!fd.lhs.every(a => plus.has(a))) continue;
      for (const b of fd.rhs) {
        if (!plus.has(b)) { plus.add(b); changed = true; }
      }
    }
    if (!changed) break;
    rounds++;
  }

  return rounds;
}

export function maxKeyDerivationRounds(candidateKeys: string[][], fds: FD[]): number {
  return candidateKeys.reduce((max, key) => Math.max(max, closureRounds(key, fds)), 0);
}

export function computeLHSOverlapRatio(allAttrs: string[], fds: FD[]): number {
  const freq = new Map<string, number>();
  for (const fd of fds)
    for (const a of fd.lhs)
      freq.set(a, (freq.get(a) ?? 0) + 1);

  const overlapping = allAttrs.filter(a => (freq.get(a) ?? 0) > 1).length;
  return overlapping / allAttrs.length;
}

export function computeKeyInLHSRatio(candidateKeys: string[][], fds: FD[]): number {
  const lhsSignatures = new Set(fds.map(fd => keySignature(fd.lhs)));
  const overlaps = candidateKeys.reduce((acc, key) => lhsSignatures.has(keySignature(key)) ? acc + 1 : acc, 0);
  
  return overlaps / candidateKeys.length
}

function classifyRedundantLHS(
  fds: FD[],
): { meaningful: number } {
  let meaningful = 0;

  for (const fd of fds) {
    if (fd.lhs.length < 2) continue;
    let hasRedundantAttr = false;
    for (const b of fd.lhs) {
      const reducedLhs = fd.lhs.filter(a => a !== b);
      const closure = computeClosure(reducedLhs, fds);
      if (fd.rhs.every(a => closure.has(a))) { hasRedundantAttr = true; break; }
    }
    if (!hasRedundantAttr) continue;
    meaningful++;
  }

  return { meaningful };
}

function classifyRedundantFDs(
  fds: FD[],
  candidateKeys: string[][]
): { distracting: number; chainShortcutting: number } {
  let distracting = 0;
  let chainShortcutting = 0;

  for (let i = 0; i < fds.length; i++) {
    const fd = fds[i];
    const others = fds.filter((_, idx) => idx !== i);
    const closure = computeClosure(fd.lhs, others);

    if (!fd.rhs.every(attr => closure.has(attr))) continue; // checks if RHS is subset of closure
    if (lhsContainsCandidateKey(fd.lhs, candidateKeys)) {
      chainShortcutting++; // student can skip transitive steps — simplifies
    } else {
      distracting++;       // misleads away from the key — complicates
    }
  }

  return { distracting, chainShortcutting };
}


// ─── Profile + Gate ───────────────────────────────────────────────────────────

export function computeScoredProfile(
  allAttrs: string[],
  fds: FD[],
  candidateKeys: string[][]
): ScoredProfile {
  const derivationRounds = maxKeyDerivationRounds(candidateKeys, fds);
  const derivationDepthRatio = derivationRounds / allAttrs.length;
  const keyInLHSRatio = computeKeyInLHSRatio(candidateKeys, fds);

  const { meaningful: meaningfulRedundantLHS }
    = classifyRedundantLHS(fds);

  const { distracting: distractingRedundantFDs, chainShortcutting: chainShortcuttingFDs }
    = classifyRedundantFDs(fds, candidateKeys);

  const rawScore =
    meaningfulRedundantLHS   * SCORE_WEIGHTS.meaningfulRedundantLHS  +
    distractingRedundantFDs  * SCORE_WEIGHTS.distractingRedundantFD  +
    chainShortcuttingFDs     * SCORE_WEIGHTS.chainShortcuttingFD;
  
  const meaningfulRedundantFdsRatio = fds.length > 0 ? distractingRedundantFDs / fds.length: 0
  const normalisedScore = fds.length > 0 ? rawScore / fds.length : 0;

  return {
    derivationDepthRatio,
    keyInLHSRatio,
    meaningfulRedundantFdsRatio,
    meaningfulRedundantLHS,
    distractingRedundantFDs,
    chainShortcuttingFDs,
    rawScore,
    normalisedScore,
  };
}

export function passesStructuralProfile(
  diff: Difficulty,
  allAttrs: string[],
  fds: FD[],
  candidateKeys: string[][]
): boolean {
  const threshold = STRUCTURAL_THRESHOLDS[diff];
  if (!threshold) return true;

  const profile = computeScoredProfile(allAttrs, fds, candidateKeys);

  if (profile.derivationDepthRatio < threshold.hardLimits.minDerivationDepthRatio) return false;
  if (profile.keyInLHSRatio        > threshold.hardLimits.keyInLHSRatio)           return false;
  if (profile.meaningfulRedundantFdsRatio < threshold.hardLimits.meaningfulRedundantFdsRatio) return false;  

  return profile.normalisedScore >= threshold.scoreThreshold.minScore 
    && profile.normalisedScore <= threshold.scoreThreshold.maxScore;
}
