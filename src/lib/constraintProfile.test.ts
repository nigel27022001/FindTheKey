// expertProfile.test.ts
import { describe, it, expect } from "vitest";
import { generateProblem } from "./problemGenerator";
import { computeScoredProfile, STRUCTURAL_THRESHOLDS } from "./constraintAlgorithms";
 
// ─── Config ───────────────────────────────────────────────────────────────────
 
const SAMPLE_SIZE = 200;
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
const avg = (vals: number[]): number =>
  vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;
 
const fmt = (n: number): string => n.toFixed(3);
 
// ─── Tests ────────────────────────────────────────────────────────────────────
 
describe(`Expert problem profile over ${SAMPLE_SIZE} samples`, () => {
  // Generate all problems once and reuse across tests
  const DIFF = "expert" 
  const THRESHOLD = STRUCTURAL_THRESHOLDS[DIFF]!;

  const profiles = Array.from({ length: SAMPLE_SIZE }, () => {
    const { allAttrs, fds, candidateKeys } = generateProblem(DIFF);
    return {
      profile: computeScoredProfile(allAttrs, fds, candidateKeys),
      numFDs: fds.length,
      numAttrs: allAttrs.length,
      numKeys: candidateKeys.length,
    };
  });
 
  // ── Averages ────────────────────────────────────────────────────────────────
 
  it("reports average metric counts and prints a summary", () => {
    const avgMeaningfulLHS    = avg(profiles.map(p => p.profile.meaningfulRedundantLHS));
    const avgDistractingFDs   = avg(profiles.map(p => p.profile.distractingRedundantFDs));
    const avgChainShortcut    = avg(profiles.map(p => p.profile.chainShortcuttingFDs));
    const avgNormScore        = avg(profiles.map(p => p.profile.normalisedScore));
    const avgRawScore         = avg(profiles.map(p => p.profile.rawScore));
    const avgDepthRatio       = avg(profiles.map(p => p.profile.derivationDepthRatio));
    const avgKeyInLHSRatio    = avg(profiles.map(p => p.profile.keyInLHSRatio));
    const avgNumFDs           = avg(profiles.map(p => p.numFDs));
    const avgNumAttrs         = avg(profiles.map(p => p.numAttrs));
    const avgNumKeys          = avg(profiles.map(p => p.numKeys));
 
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Expert Problem Profile  (n = ${SAMPLE_SIZE})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Structure
    Avg attributes          : ${fmt(avgNumAttrs)}
    Avg FDs                 : ${fmt(avgNumFDs)}
    Avg candidate keys      : ${fmt(avgNumKeys)}
 
  Hard Limits
    Avg derivation depth δ  : ${fmt(avgDepthRatio)}   (min: ${THRESHOLD.hardLimits.minDerivationDepthRatio})
    Avg key-in-LHS ratio ρ  : ${fmt(avgKeyInLHSRatio)}  (max: ${THRESHOLD.hardLimits.keyInLHSRatio})
 
  Noise Counts (avg per problem)
    Meaningful redundant LHS    : ${fmt(avgMeaningfulLHS)}
    Distracting redundant FDs   : ${fmt(avgDistractingFDs)}
    Chain-shortcutting FDs      : ${fmt(avgChainShortcut)}
 
  Score
    Avg raw score           : ${fmt(avgRawScore)}
    Avg normalised score    : ${fmt(avgNormScore)}   (window: [${THRESHOLD.scoreThreshold.minScore}, ${THRESHOLD.scoreThreshold.maxScore}])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
 
    // Soft assertions — these document expected ranges rather than hard-fail
    expect(avgDepthRatio).toBeGreaterThanOrEqual(THRESHOLD.hardLimits.minDerivationDepthRatio);
    expect(avgKeyInLHSRatio).toBeLessThanOrEqual(THRESHOLD.hardLimits.keyInLHSRatio);
    expect(avgNormScore).toBeGreaterThanOrEqual(THRESHOLD.scoreThreshold.minScore);
    expect(avgNormScore).toBeLessThanOrEqual(THRESHOLD.scoreThreshold.maxScore);
  });
 
  // ── Distribution breakdown ──────────────────────────────────────────────────
 
  it("reports the distribution of meaningful redundant LHS counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.meaningfulRedundantLHS;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  meaningfulRedundantLHS distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} redundant LHS : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  it("reports the distribution of distracting redundant FD counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.distractingRedundantFDs;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  distractingRedundantFDs distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} distracting FDs : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  it("reports the distribution of chain-shortcutting FD counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.chainShortcuttingFDs;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  chainShortcuttingFDs distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} chain-shortcutting FDs : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  // ── Hard limit violation check ──────────────────────────────────────────────
 
  it("confirms no generated problem violates the hard limits", () => {
    const depthViolations = profiles.filter(
      p => p.profile.derivationDepthRatio < THRESHOLD.hardLimits.minDerivationDepthRatio
    ).length;
 
    const lhsViolations = profiles.filter(
      p => p.profile.keyInLHSRatio > THRESHOLD.hardLimits.keyInLHSRatio
    ).length;
 
    console.log(`\n  Hard limit violations:`);
    console.log(`    Derivation depth below minimum : ${depthViolations}`);
    console.log(`    Key-in-LHS above maximum       : ${lhsViolations}`);
 
    expect(depthViolations).toBe(0);
    expect(lhsViolations).toBe(0);
  });
});


describe(`Hard problem profile over ${SAMPLE_SIZE} samples`, () => {
  // Generate all problems once and reuse across tests
  const DIFF = "hard" 
  const THRESHOLD = STRUCTURAL_THRESHOLDS[DIFF]!;
  const profiles = Array.from({ length: SAMPLE_SIZE }, () => {
  const { allAttrs, fds, candidateKeys } = generateProblem(DIFF);
    return {
      profile: computeScoredProfile(allAttrs, fds, candidateKeys),
      numFDs: fds.length,
      numAttrs: allAttrs.length,
      numKeys: candidateKeys.length,
    };
  });
 
  // ── Averages ────────────────────────────────────────────────────────────────
 
  it("reports average metric counts and prints a summary", () => {
    const avgMeaningfulLHS    = avg(profiles.map(p => p.profile.meaningfulRedundantLHS));
    const avgDistractingFDs   = avg(profiles.map(p => p.profile.distractingRedundantFDs));
    const avgChainShortcut    = avg(profiles.map(p => p.profile.chainShortcuttingFDs));
    const avgNormScore        = avg(profiles.map(p => p.profile.normalisedScore));
    const avgRawScore         = avg(profiles.map(p => p.profile.rawScore));
    const avgDepthRatio       = avg(profiles.map(p => p.profile.derivationDepthRatio));
    const avgKeyInLHSRatio    = avg(profiles.map(p => p.profile.keyInLHSRatio));
    const avgNumFDs           = avg(profiles.map(p => p.numFDs));
    const avgNumAttrs         = avg(profiles.map(p => p.numAttrs));
    const avgNumKeys          = avg(profiles.map(p => p.numKeys));
 
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Hard Problem Profile  (n = ${SAMPLE_SIZE})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Structure
    Avg attributes          : ${fmt(avgNumAttrs)}
    Avg FDs                 : ${fmt(avgNumFDs)}
    Avg candidate keys      : ${fmt(avgNumKeys)}
 
  Hard Limits
    Avg derivation depth δ  : ${fmt(avgDepthRatio)}   (min: ${THRESHOLD.hardLimits.minDerivationDepthRatio})
    Avg key-in-LHS ratio ρ  : ${fmt(avgKeyInLHSRatio)}  (max: ${THRESHOLD.hardLimits.keyInLHSRatio})
 
  Noise Counts (avg per problem)
    Meaningful redundant LHS    : ${fmt(avgMeaningfulLHS)}
    Distracting redundant FDs   : ${fmt(avgDistractingFDs)}
    Chain-shortcutting FDs      : ${fmt(avgChainShortcut)}
 
  Score
    Avg raw score           : ${fmt(avgRawScore)}
    Avg normalised score    : ${fmt(avgNormScore)}   (window: [${THRESHOLD.scoreThreshold.minScore}, ${THRESHOLD.scoreThreshold.maxScore}])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
 
    // Soft assertions — these document expected ranges rather than hard-fail
    expect(avgDepthRatio).toBeGreaterThanOrEqual(THRESHOLD.hardLimits.minDerivationDepthRatio);
    expect(avgKeyInLHSRatio).toBeLessThanOrEqual(THRESHOLD.hardLimits.keyInLHSRatio);
    expect(avgNormScore).toBeGreaterThanOrEqual(THRESHOLD.scoreThreshold.minScore);
    expect(avgNormScore).toBeLessThanOrEqual(THRESHOLD.scoreThreshold.maxScore);
  });
 
  // ── Distribution breakdown ──────────────────────────────────────────────────
 
  it("reports the distribution of meaningful redundant LHS counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.meaningfulRedundantLHS;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  meaningfulRedundantLHS distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} redundant LHS : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  it("reports the distribution of distracting redundant FD counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.distractingRedundantFDs;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  distractingRedundantFDs distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} distracting FDs : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  it("reports the distribution of chain-shortcutting FD counts", () => {
    const freq = new Map<number, number>();
    for (const { profile } of profiles) {
      const v = profile.chainShortcuttingFDs;
      freq.set(v, (freq.get(v) ?? 0) + 1);
    }
 
    console.log("\n  chainShortcuttingFDs distribution:");
    for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
      const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
      console.log(`    ${val} chain-shortcutting FDs : ${count} problems (${pct}%)`);
    }
 
    expect(freq.size).toBeGreaterThan(0);
  });
 
  // ── Hard limit violation check ──────────────────────────────────────────────
 
  it("confirms no generated problem violates the hard limits", () => {
    const depthViolations = profiles.filter(
      p => p.profile.derivationDepthRatio < THRESHOLD.hardLimits.minDerivationDepthRatio
    ).length;
 
    const lhsViolations = profiles.filter(
      p => p.profile.keyInLHSRatio > THRESHOLD.hardLimits.keyInLHSRatio
    ).length;
 
    console.log(`\n  Hard limit violations:`);
    console.log(`    Derivation depth below minimum : ${depthViolations}`);
    console.log(`    Key-in-LHS above maximum       : ${lhsViolations}`);
 
    expect(depthViolations).toBe(0);
    expect(lhsViolations).toBe(0);
  });
});
