// problemGenerator.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as ProblemGenerator from "./problemGenerator";
import { generateProblem } from "./problemGenerator";
import type { Difficulty } from "./problemGenerator";

const RUNS = 500;
const ACCEPTABLE_FALLBACK_RATE: Record<Difficulty, number> = {
  easy:   0.01, // 1%  — easy constraints are loose, fallback should be near zero
  medium: 0.02, // 2%  — slightly tighter but still very low
  hard:   0.05, // 5%
  expert: 0.05, // 5%
};

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

describe("generateProblem fallback rate", () => {
  let buildFallbackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    buildFallbackSpy = vi.spyOn(ProblemGenerator, "buildFallbackProblem");
  });

  afterEach(() => {
    buildFallbackSpy.mockRestore();
  });

  function runFallbackRateTest(diff: Difficulty) {
    let fallbackCount = 0;
    for (let i = 0; i < RUNS; i++) {
      buildFallbackSpy.mockClear();
      generateProblem(diff);
      if (buildFallbackSpy.mock.calls.length > 0) {
        fallbackCount++;
      }
    }
    const fallbackRate = fallbackCount / RUNS;
    console.log(
      `[${diff}] fallback triggered ${fallbackCount}/${RUNS} times (${(fallbackRate * 100).toFixed(1)}%)`
    );
    return { fallbackCount, fallbackRate };
  }

  // ── Per-difficulty assertions ───────────────────────────────────────────────

  for (const diff of ALL_DIFFICULTIES) {
    it(
      `${diff}: fallback rate should be under ${ACCEPTABLE_FALLBACK_RATE[diff] * 100}% across ${RUNS} runs`,
      { timeout: 60_000 },
      () => {
        const { fallbackRate } = runFallbackRateTest(diff);
        expect(fallbackRate).toBeLessThan(ACCEPTABLE_FALLBACK_RATE[diff]);
      }
    );
  }

  // ── Combined summary across all difficulties ────────────────────────────────

  it(
    "reports combined fallback stats for all difficulties",
    { timeout: 60_000 * ALL_DIFFICULTIES.length },
    () => {
      const results: Record<string, { fallbackCount: number; fallbackRate: number }> = {};

      for (const diff of ALL_DIFFICULTIES) {
        results[diff] = runFallbackRateTest(diff);
      }

      console.table(
        ALL_DIFFICULTIES.map(diff => ({
          difficulty:    diff,
          fallbacks:     results[diff].fallbackCount,
          total:         RUNS,
          rate:          `${(results[diff].fallbackRate * 100).toFixed(1)}%`,
          threshold:     `${(ACCEPTABLE_FALLBACK_RATE[diff] * 100).toFixed(0)}%`,
          passed:        results[diff].fallbackRate < ACCEPTABLE_FALLBACK_RATE[diff] ? "✓" : "✗",
        }))
      );

      // Combined rate across all difficulties should stay under 5%
      const totalFallbacks = ALL_DIFFICULTIES.reduce((sum, d) => sum + results[d].fallbackCount, 0);
      const totalRuns = ALL_DIFFICULTIES.length * RUNS;
      const combinedRate = totalFallbacks / totalRuns;

      console.log(`\nCombined fallback rate across all difficulties: ${(combinedRate * 100).toFixed(2)}%`);
      expect(combinedRate).toBeLessThan(0.05);
    }
  );
});
