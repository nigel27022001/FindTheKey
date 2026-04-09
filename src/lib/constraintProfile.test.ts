// expertProfile.test.ts
import { describe, it, expect } from "vitest";
import { generateProblem } from "./problemGenerator";
import { computeScoredProfile, STRUCTURAL_THRESHOLDS } from "./constraintAlgorithms";
import { maxKeyDerivationRounds } from "./constraintAlgorithms";
import type { Difficulty } from "./problemGenerator";

// ─── Config ───────────────────────────────────────────────────────────────────

const SAMPLE_SIZE = 200;
const TEST_TIMEOUT_MS = 60_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avg = (vals: number[]): number =>
  vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;

const std = (vals: number[]): number => {
  if (vals.length === 0) return 0;
  const mean = avg(vals);
  return Math.sqrt(avg(vals.map(v => (v - mean) ** 2)));
};

const fmt  = (n: number): string => n.toFixed(3);
const fmt2 = (n: number): string => n.toFixed(2);

// ─── Shared profile builder ───────────────────────────────────────────────────

function buildProfiles(diff: Difficulty) {
  return Array.from({ length: SAMPLE_SIZE }, () => {
    const { allAttrs, fds, candidateKeys } = generateProblem(diff);
    return {
      profile:           computeScoredProfile(allAttrs, fds, candidateKeys),
      maxDerivationRounds: maxKeyDerivationRounds(candidateKeys, fds),
      numFDs:            fds.length,
      numAttrs:          allAttrs.length,
      numKeys:           candidateKeys.length,
    };
  });
}

type ProfileEntry = ReturnType<typeof buildProfiles>[number];

// ─── Per-difficulty summary printer ──────────────────────────────────────────

function printSummary(diff: Difficulty, profiles: ProfileEntry[]) {
  const threshold = STRUCTURAL_THRESHOLDS[diff as keyof typeof STRUCTURAL_THRESHOLDS];

  const avgMeaningfulLHS  = avg(profiles.map(p => p.profile.meaningfulRedundantLHS));
  const avgDistractingFDs = avg(profiles.map(p => p.profile.distractingRedundantFDs));
  const avgChainShortcut  = avg(profiles.map(p => p.profile.chainShortcuttingFDs));
  const avgNormScore      = avg(profiles.map(p => p.profile.normalisedScore));
  const avgRawScore       = avg(profiles.map(p => p.profile.rawScore));
  const avgMaxDepth       = avg(profiles.map(p => p.maxDerivationRounds));   // ← raw rounds
  const avgKeyInLHSRatio  = avg(profiles.map(p => p.profile.keyInLHSRatio));
  const avgNumFDs         = avg(profiles.map(p => p.numFDs));
  const avgNumAttrs       = avg(profiles.map(p => p.numAttrs));
  const avgNumKeys        = avg(profiles.map(p => p.numKeys));

  const depthMin  = threshold?.hardLimits.minDerivationDepthRatio ?? "N/A";
  const lhsMax    = threshold?.hardLimits.keyInLHSRatio           ?? "N/A";
  const scoreWin  = threshold
    ? `[${threshold.scoreThreshold.minScore}, ${threshold.scoreThreshold.maxScore}]`
    : "N/A";

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${diff.charAt(0).toUpperCase() + diff.slice(1)} Problem Profile  (n = ${SAMPLE_SIZE})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Structure
    Avg attributes          : ${fmt(avgNumAttrs)}
    Avg FDs                 : ${fmt(avgNumFDs)}
    Avg candidate keys      : ${fmt(avgNumKeys)}

  Hard Limits
    Avg max derivation depth: ${fmt(avgMaxDepth)} rounds   (depth ratio min: ${depthMin})
    Avg key-in-LHS ratio ρ  : ${fmt(avgKeyInLHSRatio)}  (max: ${lhsMax})

  Noise Counts (avg per problem)
    Meaningful redundant LHS    : ${fmt(avgMeaningfulLHS)}
    Distracting redundant FDs   : ${fmt(avgDistractingFDs)}
    Chain-shortcutting FDs      : ${fmt(avgChainShortcut)}

  Score
    Avg raw score           : ${fmt(avgRawScore)}
    Avg normalised score    : ${fmt(avgNormScore)}   (window: ${scoreWin})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  return {
    avgNumAttrs, avgNumFDs, avgNumKeys,
    avgMaxDepth, avgKeyInLHSRatio,
    avgMeaningfulLHS, avgDistractingFDs, avgChainShortcut,
    avgRawScore, avgNormScore,
  };
}

// ─── Distribution printer ─────────────────────────────────────────────────────

function printDistribution(label: string, vals: number[]) {
  const freq = new Map<number, number>();
  for (const v of vals) freq.set(v, (freq.get(v) ?? 0) + 1);

  console.log(`\n  ${label} distribution:`);
  for (const [val, count] of [...freq.entries()].sort((a, b) => a[0] - b[0])) {
    const pct = ((count / SAMPLE_SIZE) * 100).toFixed(1);
    console.log(`    ${val} : ${count} problems (${pct}%)`);
  }
  return freq;
}

// ─── Shared test suite factory ────────────────────────────────────────────────

function profileSuite(diff: Difficulty) {
  describe(`${diff.charAt(0).toUpperCase() + diff.slice(1)} problem profile over ${SAMPLE_SIZE} samples`, () => {
    const threshold = STRUCTURAL_THRESHOLDS[diff as keyof typeof STRUCTURAL_THRESHOLDS];
    const profiles  = buildProfiles(diff);

    // ── Averages & summary ──────────────────────────────────────────────────

    it("reports average metric counts and prints a summary", { timeout: TEST_TIMEOUT_MS }, () => {
      const summary = printSummary(diff, profiles);

      if (threshold) {
        // Convert the ratio-based hard limit back to a rounds floor for assertion:
        // minRounds = ceil(minDerivationDepthRatio * avgNumAttrs)
        const minRoundsFloor = threshold.hardLimits.minDerivationDepthRatio * summary.avgNumAttrs;
        expect(summary.avgMaxDepth).toBeGreaterThanOrEqual(minRoundsFloor);
        expect(summary.avgKeyInLHSRatio).toBeLessThanOrEqual(threshold.hardLimits.keyInLHSRatio);
        expect(summary.avgNormScore).toBeGreaterThanOrEqual(threshold.scoreThreshold.minScore);
        expect(summary.avgNormScore).toBeLessThanOrEqual(threshold.scoreThreshold.maxScore);
      } else {
        expect(summary.avgNormScore).toBeGreaterThanOrEqual(0);
        expect(summary.avgMaxDepth).toBeGreaterThanOrEqual(0);
      }
    });

    // ── Standard deviation check ───────────────────────────────────────────

    it("reports standard deviation across key metrics", { timeout: TEST_TIMEOUT_MS }, () => {
      const stdNormScore  = std(profiles.map(p => p.profile.normalisedScore));
      const stdMaxDepth   = std(profiles.map(p => p.maxDerivationRounds));    // ← raw rounds
      const stdKeyInLHS   = std(profiles.map(p => p.profile.keyInLHSRatio));

      console.log(`\n  Standard deviations (${diff}):`);
      console.log(`    normalisedScore    σ = ${fmt(stdNormScore)}`);
      console.log(`    maxDerivationDepth σ = ${fmt(stdMaxDepth)} rounds`);
      console.log(`    keyInLHSRatio      σ = ${fmt(stdKeyInLHS)}`);

      expect(stdNormScore).toBeLessThan(1.0);
    });

    // ── Distribution breakdowns ─────────────────────────────────────────────

    it("reports the distribution of meaningful redundant LHS counts", { timeout: TEST_TIMEOUT_MS }, () => {
      const freq = printDistribution(
        "meaningfulRedundantLHS",
        profiles.map(p => p.profile.meaningfulRedundantLHS)
      );
      expect(freq.size).toBeGreaterThan(0);
    });

    it("reports the distribution of distracting redundant FD counts", { timeout: TEST_TIMEOUT_MS }, () => {
      const freq = printDistribution(
        "distractingRedundantFDs",
        profiles.map(p => p.profile.distractingRedundantFDs)
      );
      expect(freq.size).toBeGreaterThan(0);
    });

    it("reports the distribution of chain-shortcutting FD counts", { timeout: TEST_TIMEOUT_MS }, () => {
      const freq = printDistribution(
        "chainShortcuttingFDs",
        profiles.map(p => p.profile.chainShortcuttingFDs)
      );
      expect(freq.size).toBeGreaterThan(0);
    });

    it("reports the distribution of candidate key counts", { timeout: TEST_TIMEOUT_MS }, () => {
      const freq = printDistribution(
        "candidateKeys",
        profiles.map(p => p.numKeys)
      );
      expect(freq.size).toBeGreaterThan(0);
    });

    // ── Hard limit violation check (only for gated difficulties) ────────────

    if (threshold) {
      it("confirms no generated problem violates the hard limits", { timeout: TEST_TIMEOUT_MS }, () => {
        const depthViolations = profiles.filter(
          p => p.profile.derivationDepthRatio < threshold.hardLimits.minDerivationDepthRatio
        ).length;

        const lhsViolations = profiles.filter(
          p => p.profile.keyInLHSRatio > threshold.hardLimits.keyInLHSRatio
        ).length;

        const redundantFdViolations = profiles.filter(
          p => p.profile.meaningfulRedundantFdsRatio < threshold.hardLimits.meaningfulRedundantFdsRatio
        ).length;

        console.log(`\n  Hard limit violations (${diff}):`);
        console.log(`    Derivation depth below minimum  : ${depthViolations}`);
        console.log(`    Key-in-LHS above maximum        : ${lhsViolations}`);
        console.log(`    Redundant FD ratio below minimum: ${redundantFdViolations}`);

        expect(depthViolations).toBe(0);
        expect(lhsViolations).toBe(0);
      });
    }
  });
}

// ─── Run suites for all difficulties ─────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
DIFFICULTIES.forEach(profileSuite);

// ─── Cross-difficulty comparison table ───────────────────────────────────────

interface DifficultyStats {
  avgNumAttrs:   number; avgNumFDs:      number; avgNumKeys:     number;
  avgMaxDepth:   number; stdMaxDepth:    number;  // ← raw rounds replacing ratio
  avgKeyInLHS:   number; stdKeyInLHS:    number;
  avgMeanLHS:    number; avgDistract:    number; avgChain:       number;
  avgRawScore:   number; avgNormScore:   number; stdNormScore:   number;
}

describe("Cross-difficulty comparison table", () => {
  it("prints a side-by-side summary table for all difficulties", { timeout: TEST_TIMEOUT_MS * 4 }, () => {

    const allData = Object.fromEntries(
      DIFFICULTIES.map(diff => {
        const profiles = buildProfiles(diff);
        const entry: DifficultyStats = {
          avgNumAttrs:  avg(profiles.map(p => p.numAttrs)),
          avgNumFDs:    avg(profiles.map(p => p.numFDs)),
          avgNumKeys:   avg(profiles.map(p => p.numKeys)),
          avgMaxDepth:  avg(profiles.map(p => p.maxDerivationRounds)),  // ← raw rounds
          stdMaxDepth:  std(profiles.map(p => p.maxDerivationRounds)),  // ← raw rounds
          avgKeyInLHS:  avg(profiles.map(p => p.profile.keyInLHSRatio)),
          stdKeyInLHS:  std(profiles.map(p => p.profile.keyInLHSRatio)),
          avgMeanLHS:   avg(profiles.map(p => p.profile.meaningfulRedundantLHS)),
          avgDistract:  avg(profiles.map(p => p.profile.distractingRedundantFDs)),
          avgChain:     avg(profiles.map(p => p.profile.chainShortcuttingFDs)),
          avgRawScore:  avg(profiles.map(p => p.profile.rawScore)),
          avgNormScore: avg(profiles.map(p => p.profile.normalisedScore)),
          stdNormScore: std(profiles.map(p => p.profile.normalisedScore)),
        };
        return [diff, entry];
      })
    ) as Record<Difficulty, DifficultyStats>;

    const C0 = 32, C1 = 12, C2 = 12, C3 = 12, C4 = 12;
    const sep  = "─".repeat(C0 + C1 + C2 + C3 + C4 + 5);
    const pad  = (s: string, w: number) => s.padEnd(w);
    const rpad = (s: string, w: number) => s.padStart(w);

    const row = (label: string, fn: (d: DifficultyStats) => string) =>
      `│ ${pad(label, C0 - 1)}│${DIFFICULTIES.map(d => rpad(fn(allData[d]), C1 - 1) + " ").join("│")}│`;

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cross-Difficulty Comparison  (n = ${SAMPLE_SIZE} per difficulty)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌${"─".repeat(C0)}┬${"─".repeat(C1)}┬${"─".repeat(C2)}┬${"─".repeat(C3)}┬${"─".repeat(C4)}┐
│ ${pad("Metric", C0 - 1)}│${DIFFICULTIES.map(d => rpad(d.toUpperCase(), C1 - 1) + " ").join("│")}│
├${sep}┤
│ ${pad("── Structure ──", C0 - 1)}│${DIFFICULTIES.map(() => rpad("", C1 - 1) + " ").join("│")}│
${row("  Avg attributes",         d => fmt2(d.avgNumAttrs))}
${row("  Avg FDs",                d => fmt2(d.avgNumFDs))}
${row("  Avg candidate keys",     d => fmt2(d.avgNumKeys))}
├${sep}┤
│ ${pad("── Hard Limits ──", C0 - 1)}│${DIFFICULTIES.map(() => rpad("", C1 - 1) + " ").join("│")}│
${row("  Avg max deriv depth",    d => fmt2(d.avgMaxDepth) + " rnd")}
${row("  Std max deriv depth",    d => fmt2(d.stdMaxDepth) + " rnd")}
${row("  Avg key-in-LHS ρ",       d => fmt(d.avgKeyInLHS))}
${row("  Std key-in-LHS ρ",       d => fmt(d.stdKeyInLHS))}
├${sep}┤
│ ${pad("── Noise Counts ──", C0 - 1)}│${DIFFICULTIES.map(() => rpad("", C1 - 1) + " ").join("│")}│
${row("  Avg meaningful LHS",     d => fmt2(d.avgMeanLHS))}
${row("  Avg distracting FDs",    d => fmt2(d.avgDistract))}
${row("  Avg chain-shortcut",     d => fmt2(d.avgChain))}
├${sep}┤
│ ${pad("── Score ──", C0 - 1)}│${DIFFICULTIES.map(() => rpad("", C1 - 1) + " ").join("│")}│
${row("  Avg raw score",          d => fmt2(d.avgRawScore))}
${row("  Avg normalised score",   d => fmt(d.avgNormScore))}
${row("  Std normalised score",   d => fmt(d.stdNormScore))}
└${"─".repeat(C0)}┴${"─".repeat(C1)}┴${"─".repeat(C2)}┴${"─".repeat(C3)}┴${"─".repeat(C4)}┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // ── Monotonicity assertions ──────────────────────────────────────────────

    // avgMaxDepth (raw rounds) should be non-decreasing easy → expert
    for (let i = 0; i < DIFFICULTIES.length - 1; i++) {
      expect(allData[DIFFICULTIES[i + 1]].avgMaxDepth).toBeGreaterThanOrEqual(
        allData[DIFFICULTIES[i]].avgMaxDepth
      );
    }

    // normalisedScore should be non-decreasing easy → expert
    for (let i = 0; i < DIFFICULTIES.length - 1; i++) {
      expect(allData[DIFFICULTIES[i + 1]].avgNormScore).toBeGreaterThanOrEqual(
        allData[DIFFICULTIES[i]].avgNormScore
      );
    }

    // chainShortcuttingFDs should be non-increasing easy → expert
    for (let i = 0; i < DIFFICULTIES.length - 1; i++) {
      expect(allData[DIFFICULTIES[i + 1]].avgChain).toBeLessThanOrEqual(
        allData[DIFFICULTIES[i]].avgChain + 0.5
      );
    }
  });
});
