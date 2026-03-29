import { describe, expect, it } from "vitest";
import { generateProblem } from "./problemGenerator";
import { computeClosure } from "./fdAlgorithms";

function closureRounds(seed: string[], fds: { lhs: string[]; rhs: string[] }[]): number {
  const plus = new Set(seed);
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

describe("problemGenerator difficulty constraints", () => {
  it("enforces medium to have 1-2 candidate keys", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateProblem("medium");
      expect(p.candidateKeys.length).toBeGreaterThanOrEqual(1);
      expect(p.candidateKeys.length).toBeLessThanOrEqual(2);
    }
  });

  it("enforces hard to have 2-3 candidate keys", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateProblem("hard");
      expect(p.candidateKeys.length).toBeGreaterThanOrEqual(2);
      expect(p.candidateKeys.length).toBeLessThanOrEqual(3);
    }
  });

  it("enforces expert to have 2-3 candidate keys", () => {
    for (let i = 0; i < 20; i++) {
      const p = generateProblem("expert");
      expect(p.candidateKeys.length).toBeGreaterThanOrEqual(2);
      expect(p.candidateKeys.length).toBeLessThanOrEqual(3);
    }
  });

  it("hard and expert are structurally deeper than easy", () => {
    let easyRounds = 0;
    let hardRounds = 0;
    let expertRounds = 0;

    for (let i = 0; i < 10; i++) {
      const easy = generateProblem("easy");
      const hard = generateProblem("hard");
      const expert = generateProblem("expert");

      easyRounds += Math.max(...easy.candidateKeys.map(k => closureRounds(k, easy.fds)));
      hardRounds += Math.max(...hard.candidateKeys.map(k => closureRounds(k, hard.fds)));
      expertRounds += Math.max(...expert.candidateKeys.map(k => closureRounds(k, expert.fds)));
    }

    expect(hardRounds).toBeGreaterThan(easyRounds);
    expect(expertRounds).toBeGreaterThan(hardRounds - 1);
  });

  it("hard and expert include some redundancy pressure", () => {
    const redundantCount = (fds: { lhs: string[]; rhs: string[] }[]) => {
      let count = 0;
      for (let i = 0; i < fds.length; i++) {
        const fd = fds[i];
        const others = fds.filter((_, idx) => idx !== i);
        const cl = computeClosure(fd.lhs, others);
        if (fd.rhs.every(a => cl.has(a))) count++;
      }
      return count;
    };

    for (let i = 0; i < 10; i++) {
      const hard = generateProblem("hard");
      const expert = generateProblem("expert");
      expect(redundantCount(hard.fds)).toBeGreaterThanOrEqual(1);
      expect(redundantCount(expert.fds)).toBeGreaterThanOrEqual(1);
    }
  });
});
