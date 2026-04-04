import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as problemGenerator from "./problemGeneratorFinal";
import type { Difficulty } from "./problemGenerator";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
const SAMPLES = 100;

const FALLBACK_THRESHOLDS: Record<Difficulty, number> = {
  easy: 0.00,
  medium: 0.05,
  hard: 0.10,
  expert: 0.15,
};

describe("generateProblem fallback rate", { timeout: 30_000 }, () => {
  let fallbackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fallbackSpy = vi.spyOn(problemGenerator, "buildFallbackProblem");
  });

  afterEach(() => {
    fallbackSpy.mockRestore();
  });

  for (const diff of DIFFICULTIES) {
    it(`[${diff}] fallback rate should be <= ${FALLBACK_THRESHOLDS[diff] * 100}% over ${SAMPLES} runs`, () => {
      for (let i = 0; i < SAMPLES; i++) {
        problemGenerator.generateProblem(diff);
      }

      const fallbackCount = fallbackSpy.mock.calls.filter(
        (call: any) => call[0] === diff
      ).length;

      const fallbackRate = fallbackCount / SAMPLES;

      console.info(`[${diff}] buildFallbackProblem called: ${fallbackCount}/${SAMPLES} (${(fallbackRate * 100).toFixed(1)}%)`);

      expect(fallbackRate).toBeLessThanOrEqual(FALLBACK_THRESHOLDS[diff]);
    });
  }
});
