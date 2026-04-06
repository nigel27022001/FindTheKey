// constraintAlgorithms.ts
import { computeClosure, getCombinations } from "./fdAlgorithms";
import type { FD } from "./fdAlgorithms";
import type { Difficulty } from "./problemGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HardLimits {
  minDerivationDepthRatio: number; // derivationRounds / numAttrs
  keyInLHSRatio: number; // if candidate key is in LHS of FD
}

export interface ScoreThreshold {
  minScore: number;
  maxScore: number;
}

export interface StructuralThreshold {
  hardLimits: HardLimits;
  scoreThreshold: ScoreThreshold;
}

export interface ScoredProfile {
  // Hard limit metrics
  derivationDepthRatio: number;
  keyInLHSRatio: number;

  // Score breakdown
  meaningfulRedundantLHS: number; // complicating — LHS has no key subset
  keyExposingRedundantLHS: number; // simplifying  — LHS contains a key
  distractingRedundantFDs: number; // complicating — LHS has no key subset
  chainShortcuttingFDs: number; // simplifying  — LHS contains a key
  //  nearMisses:                number;

  // Final
  rawScore: number;
  normalisedScore: number; // rawScore / fds.length
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  meaningfulRedundantLHS: +2.0,  // strongest distractor — misleads minimality check
  keyExposingRedundantLHS: -1.5,  // actively simplifies — penalise
  distractingRedundantFD: +1.5,  // misleads key search — reward
  chainShortcuttingFD: -1.0,  // shortcuts derivation — penalise  nearMiss:                +0,
  //  nearMiss:                +0, 
} as const;



// ─── Thresholds ───────────────────────────────────────────────────────────────


export const STRUCTURAL_THRESHOLDS: Partial<Record<Difficulty, StructuralThreshold>> = {
  hard: {
    hardLimits: {
      minDerivationDepthRatio: 0.3,  // rounds / numAttrs — ~2 rounds on 6 attrs
      keyInLHSRatio: 0.5,  // at most half the keys directly visible
    },
    scoreThreshold: { minScore: 0, maxScore: 0.5 },
  },
  expert: {
    hardLimits: {
      minDerivationDepthRatio: 0.4,  // ~3 rounds on 7 attrs
      keyInLHSRatio: 0.0,  // no key may appear directly as LHS
    },
    scoreThreshold: { minScore: 0.4, maxScore: 2.0 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const keySignature = (attrs: string[]): string => [...attrs].sort().join("");

/** Returns true if any candidate key is a subset of the given LHS */
function lhsContainsCandidateKey(lhs: string[], candidateKeys: string[][]): boolean {
  return candidateKeys.some(key => key.every(attr => lhs.includes(attr)));
}

// ─── Metric Computations ──────────────────────────────────────────────────────

/** 
 * Number of closure-expansion rounds needed to derive all attributes 
 * from the given key. Higher = deeper transitive chain.
 */
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

/**
 * Computes how many attributes are shared across the LHS sets.
 */
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

/**
 * Counts attribute subsets of size minKeySize that determine all but one
 * attribute — close enough to a key to mislead, but not actually valid.
 */
export function countNearMisses(
  allAttrs: string[],
  fds: FD[],
  candidateKeys: string[][]
): number {
  if (!candidateKeys.length) return 0;

  const keySet = new Set(candidateKeys.map(keySignature));
  const minKeySize = Math.min(...candidateKeys.map(k => k.length));
  let nearMisses = 0;

  for (const combo of getCombinations(allAttrs, minKeySize)) {
    if (keySet.has(keySignature(combo))) continue;
    const closure = computeClosure(combo, fds);
    if (closure.size === allAttrs.length - 1) nearMisses++;
  }

  return nearMisses;
}


/**
 * For each composite-LHS FD, determines whether its redundancy
 * helps (LHS contains a key → exposes the key) or hurts (genuine distractor).
 * Returns counts of each category.
 */
function classifyRedundantLHS(
  fds: FD[],
  candidateKeys: string[][]
): { meaningful: number; keyExposing: number } {
  let meaningful = 0;
  let keyExposing = 0;

  for (const fd of fds) {
    if (fd.lhs.length < 2) continue;

    // Check whether any attribute in the LHS is redundant
    let hasRedundantAttr = false;
    for (const b of fd.lhs) {
      const reducedLhs = fd.lhs.filter(a => a !== b);
      const closure = computeClosure(reducedLhs, fds);
      if (fd.rhs.every(a => closure.has(a))) { hasRedundantAttr = true; break; }
    }
    if (!hasRedundantAttr) continue;

    if (lhsContainsCandidateKey(fd.lhs, candidateKeys)) {
      keyExposing++;  // student reaches this automatically — simplifies
    } else {
      meaningful++;   // genuine distractor — complicates
    }
  }

  return { meaningful, keyExposing };
}

/**
 * For each redundant FD, determines whether it shortcuts the transitivity
 * chain (LHS contains a key) or acts as a distractor (LHS does not).
 * Returns counts of each category.
 */
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
  //  const nearMisses = countNearMisses(allAttrs, fds, candidateKeys);

  const { meaningful: meaningfulRedundantLHS, keyExposing: keyExposingRedundantLHS }
    = classifyRedundantLHS(fds, candidateKeys);

  const { distracting: distractingRedundantFDs, chainShortcutting: chainShortcuttingFDs }
    = classifyRedundantFDs(fds, candidateKeys);

  const rawScore =
    meaningfulRedundantLHS * SCORE_WEIGHTS.meaningfulRedundantLHS +
    keyExposingRedundantLHS * SCORE_WEIGHTS.keyExposingRedundantLHS +
    distractingRedundantFDs * SCORE_WEIGHTS.distractingRedundantFD +
    chainShortcuttingFDs * SCORE_WEIGHTS.chainShortcuttingFD;

  const normalisedScore = fds.length > 0 ? rawScore / fds.length : 0;

  return {
    derivationDepthRatio,
    keyInLHSRatio,
    meaningfulRedundantLHS,
    keyExposingRedundantLHS,
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
  if (profile.keyInLHSRatio > threshold.hardLimits.keyInLHSRatio) return false;

  // Score gate — must accumulate enough net difficulty
  return profile.normalisedScore >= threshold.scoreThreshold.minScore
    && profile.normalisedScore <= threshold.scoreThreshold.maxScore;
}
