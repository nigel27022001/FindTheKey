/**
 * fdAlgorithms.ts
 * Pure functions implementing relational database theory:
 * attribute closure, superkey / candidate-key tests, and full key enumeration.
 */

export interface FD {
  lhs: string[];
  rhs: string[];
}

/** Compute the attribute closure X⁺ under a set of functional dependencies. Algorithm 1*/
export function computeClosure(attrs: string[], fds: FD[]): Set<string> {
  const plus = new Set(attrs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const fd of fds) {
      if (fd.lhs.every(a => plus.has(a))) {
        for (const b of fd.rhs) {
          if (!plus.has(b)) { plus.add(b); changed = true; }
        }
      }
    }
  }
  return plus;
}

/** Return true iff attrs is a superkey (closure covers all attributes). */
export function isSuperkey(attrs: string[], allAttrs: string[], fds: FD[]): boolean {
  const cl = computeClosure(attrs, fds);
  return allAttrs.every(a => cl.has(a));
}

/** Return true iff attrs is a candidate key (superkey + minimal). */
export function isCandidateKey(attrs: string[], allAttrs: string[], fds: FD[]): boolean {
  if (!isSuperkey(attrs, allAttrs, fds)) return false;
  for (let i = 0; i < attrs.length; i++) {
    const sub = attrs.filter((_, j) => j !== i);
    if (sub.length > 0 && isSuperkey(sub, allAttrs, fds)) return false;
  }
  return true;
}

/** Returns true if any candidate key is a subset of the given LHS */
export function lhsContainsCandidateKey(lhs: string[], candidateKeys: string[][]): boolean {
  return candidateKeys.some(key => lhs.length == key.length && key.every(attr => lhs.includes(attr)));
}

/** Enumerate all k-element combinations of arr. */
export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...getCombinations(rest, k - 1).map(c => [first, ...c]),
    ...getCombinations(rest, k),
  ];
}

/**
 * Find all candidate keys by checking every subset (smallest first).
 * Feasible for up to ~8 attributes.
 */
export function findAllCandidateKeys(allAttrs: string[], fds: FD[]): string[][] {
  const keys: string[][] = [];
  for (let size = 1; size <= allAttrs.length; size++) {
    for (const combo of getCombinations(allAttrs, size)) {
      if (isCandidateKey(combo, allAttrs, fds)) {
        keys.push([...combo].sort());
      }
    }
  }
  return keys;
}

/** Deep equality check for two attribute arrays (order-independent). */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(), sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
