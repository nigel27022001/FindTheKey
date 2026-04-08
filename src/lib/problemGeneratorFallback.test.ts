// problemGenerator.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as ProblemGenerator from "./problemGenerator";
import { generateProblem, buildFallbackProblem } from "./problemGenerator";
import type { Difficulty } from "./problemGenerator";

const RUNS = 100;
const ACCEPTABLE_FALLBACK_RATE = 0.05; // 5% threshold

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

  it(`hard: fallback rate should be under ${ACCEPTABLE_FALLBACK_RATE * 100}% across ${RUNS} runs`, () => {
    const { fallbackRate } = runFallbackRateTest("hard");
    expect(fallbackRate).toBeLessThan(ACCEPTABLE_FALLBACK_RATE);
  });

  it(`expert: fallback rate should be under ${ACCEPTABLE_FALLBACK_RATE * 100}% across ${RUNS} runs`, () => {
    const { fallbackRate } = runFallbackRateTest("expert");
    expect(fallbackRate).toBeLessThan(ACCEPTABLE_FALLBACK_RATE);
  });

  it("reports combined fallback stats for hard and expert", () => {
    const results: Record<string, { fallbackCount: number; fallbackRate: number }> = {};

    for (const diff of ["hard", "expert"] as Difficulty[]) {
      results[diff] = runFallbackRateTest(diff);
    }

    // Summary log
    console.table(
      Object.entries(results).map(([diff, { fallbackCount, fallbackRate }]) => ({
        difficulty: diff,
        fallbacks: fallbackCount,
        total: RUNS,
        rate: `${(fallbackRate * 100).toFixed(1)}%`,
      }))
    );

    // Soft assertion — just ensures the combined rate doesn't exceed 10%
    const totalFallbacks = Object.values(results).reduce((sum, r) => sum + r.fallbackCount, 0);
    const totalRuns = Object.keys(results).length * RUNS;
    expect(totalFallbacks / totalRuns).toBeLessThan(0.1);
  });
});
