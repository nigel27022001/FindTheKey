/**
 * useGameState.ts
 * Central game-state hook with full TypeScript types.
 */

import { useState, useCallback, useRef } from "react";
import { generateProblem } from "../lib/problemGenerator";
import type { Problem, Difficulty } from "../lib/problemGenerator";
import {
  computeClosure,
  isSuperkey,
  isCandidateKey,
  arraysEqual,
} from "../lib/fdAlgorithms";
import type { FD } from "../lib/fdAlgorithms";

// ── Public types ──────────────────────────────────────────────────────────────

export type FeedbackType = "correct" | "wrong" | "hint" | "info";

export interface FeedbackState {
  type:   FeedbackType;
  title:  string;
  body?:  string;
  keys?:  string[][];
}

export interface ToastState {
  title: string;
  msg:   string;
}

export interface LiveClosure {
  closure: string[];
  isSK:    boolean;
  isCK:    boolean;
}

export type GameMode = "practice" | "spire";

export interface GameState {
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  // Session stats
  score:      number;
  streak:     number;
  round:      number;
  solved:     number;
  total:      number;
  // Per-problem
  difficulty: Difficulty;
  problem:    Problem | null;
  selected:   string[];
  foundKeys:  string[][];
  hintsLeft:  number;
  feedback:   FeedbackState | null;
  allSolved:  boolean;
  problemSolved: boolean;
  newKey:     string[] | null;
  toast:      ToastState | null;
  gameOver:   boolean;
  closureUses: number;
  activeClosureSight: boolean;
  skipUses: number;
  earnSkipPotion: () => void;
  consumeSkipPotion: () => void;
  useClosurePotion: () => void;
  consumeClosureUse: () => void;
  discardHint: () => void;
  discardClosure: () => void;
  discardSkip: () => void;
  // Actions
  loadProblem:     (diff?: Difficulty) => void;
  nextProblem:     ()                  => void;
  changeDifficulty:(diff: Difficulty)  => void;
  toggleAttr:      (attr: string)      => void;
  clearSelection:  ()                  => void;
  submitAnswer:    ()                  => void;
  showHint:        ()                  => void;
  earnHint:        ()                  => void;
  dismissGameOver: ()                  => void;
  // Derived
  getLiveClosure:    () => LiveClosure;
  getHighlightedFDs: () => boolean[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POINTS: Record<Difficulty, number> = {
  easy: 10, medium: 20, hard: 35, expert: 50,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGameState(): GameState {
  const [gameMode, setGameMode] = useState<GameMode>("practice");
  const [score,      setScore]      = useState(0);
  const [streak,     setStreak]     = useState(0);
  const [round,      setRound]      = useState(1);
  const [solved,     setSolved]     = useState(0);
  const [total,      setTotal]      = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [problem,    setProblem]    = useState<Problem | null>(null);
  const [selected,   setSelected]   = useState<string[]>([]);
  const [foundKeys,  setFoundKeys]  = useState<string[][]>([]);
  const [hintsLeft,  setHintsLeft]  = useState(0);
  const [closureUses, setClosureUses] = useState(0);
  const [skipUses, setSkipUses] = useState(0);
  const [feedback,   setFeedback]   = useState<FeedbackState | null>(null);
  const [allSolved,  setAllSolved]  = useState(false);
  const [problemSolved, setProblemSolved] = useState(false);
  const [newKey,     setNewKey]     = useState<string[] | null>(null);
  const [toast,      setToast]      = useState<ToastState | null>(null);
  const [gameOver,   setGameOver]   = useState(false);
  const [activeClosureSight, setActiveClosureSight] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(title: string, msg: string): void {
    setToast({ title, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  function earnHint(): void {
    setHintsLeft(h => h + 1);
  }

  function getPoints(currentStreak: number): number {
    return POINTS[difficulty] + (currentStreak > 1 ? currentStreak * 2 : 0);
  }

  function useClosurePotion(): void {
    setClosureUses(c => c + 1);
  }

  function earnSkipPotion(): void {
    setSkipUses(s => s + 1);
  }

  function discardHint(): void {
    setHintsLeft(h => Math.max(0, h - 1));
  }

  function discardClosure(): void {
    setClosureUses(c => Math.max(0, c - 1));
  }

  function discardSkip(): void {
    setSkipUses(s => Math.max(0, s - 1));
  }

  function consumeSkipPotion(): void {
    if (skipUses > 0) {
      setSkipUses(s => Math.max(0, s - 1));
      // In practice this instantly marks the current problem solved without penalty
      if (problem) {
        setProblemSolved(true);
        setAllSolved(true);
        setFoundKeys(problem.candidateKeys);
        showToast("Skipped", "Used Skip Potion to instantly solve the problem.");
      }
    }
  }

  function consumeClosureUse(): void {
    if (closureUses > 0) {
      setClosureUses(c => Math.max(0, c - 1));
      setActiveClosureSight(true);
    }
  }

  const loadProblem = useCallback((diff: Difficulty = difficulty): void => {
    setProblem(generateProblem(diff));
    setSelected([]);
    setFoundKeys([]);
    setFeedback(null);
    setAllSolved(false);
    setProblemSolved(false);
    setNewKey(null);
    setGameOver(false);
    setActiveClosureSight(false);
    setWrongAttempts(0);
  }, [difficulty]);

  function changeDifficulty(diff: Difficulty): void {
    setDifficulty(diff);
    loadProblem(diff);
  }
  
  function nextProblem(): void {
    setRound(r => r + 1);
    loadProblem(difficulty);
  }

  function toggleAttr(attr: string): void {
    if (allSolved) return;
    setSelected(prev =>
      prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]
    );
    setFeedback(null);
  }

  function clearSelection(): void {
    setSelected([]);
    setFeedback(null);
  }

  function submitAnswer(): void {
    if (!selected.length) {
      setFeedback({ type: "hint", title: "Nothing selected", body: "Click attributes to build a candidate key first." });
      return;
    }
    if (!problem) return;

    const sel = [...selected].sort();
    const { allAttrs, fds, candidateKeys } = problem;

    if (foundKeys.some(k => arraysEqual(k, sel))) {
      setFeedback({ type: "hint", title: "Already found", body: `{${sel.join(", ")}} is already in your list. Try finding another key.` });
      return;
    }

    if (isCandidateKey(sel, allAttrs, fds)) {
      const newFound  = [...foundKeys, sel];
      const newStreak = streak + 1;
      const pts       = getPoints(newStreak);

      setFoundKeys(newFound);
      setNewKey(sel);
      setScore(s  => s + pts);
      setStreak(newStreak);
      setSolved(s => s + 1);
      setTotal(t  => t + 1);
      setProblemSolved(true);

      if (newStreak === 3) showToast("Streak ×3", "Three correct in a row!");
      if (newStreak === 5) showToast("Streak ×5", "Five correct in a row!");

      if (newFound.length >= candidateKeys.length) {
        setAllSolved(true);
        const bonus = candidateKeys.length > 1 ? candidateKeys.length * 10 : 0;
        if (bonus) setScore(s => s + bonus);
        
        if (candidateKeys.length === 1) {
          setFeedback({
            type:  "correct",
            title: `Correct! +${pts} pts`,
            body:  `Awesome! You found the candidate key.`,
            keys:  candidateKeys,
          });
        } else {
          setFeedback({
            type:  "correct",
            title: `Perfect Clear! +${pts + bonus} pts`,
            body: `You found all ${candidateKeys.length} candidate keys!`,
            keys:  candidateKeys,
          });
        }
      } else {
        const remaining = candidateKeys.length - newFound.length;
        setFeedback({
          type:  "correct",
          title: `Correct! +${pts} pts`,
          body:  `{${sel.join(", ")}} is a candidate key. You solved the problem! Bonus Challenge: there ${remaining === 1 ? 'is 1 more key' : `are ${remaining} more keys`} to find for extra points!`,
        });
      }
    } else if (isSuperkey(sel, allAttrs, fds)) {
      setStreak(0);
      setTotal(t => t + 1);
      
      if (gameMode === "practice") {
        const newWrongAttempts = wrongAttempts + 1;
        setWrongAttempts(newWrongAttempts);

        if (newWrongAttempts >= 3) {
          setProblemSolved(true);
          setAllSolved(true);
          setFoundKeys(problem.candidateKeys);
          setFeedback({
            type:  "wrong",
            title: "Superkey — not minimal",
            body:  `{${sel.join(", ")}} determines all attributes, but a proper subset is also a superkey. Out of attempts. The true candidate keys are revealed.`,
            keys: problem.candidateKeys,
          });
        } else {
          setFeedback({
            type:  "wrong",
            title: `Superkey — not minimal (${newWrongAttempts}/3 wrong)`,
            body:  `{${sel.join(", ")}} determines all attributes, but a proper subset is also a superkey. Remove an attribute. You have ${3 - newWrongAttempts} attempts left.`,
          });
        }
      } else {
        setFeedback({
          type:  "wrong",
          title: "Superkey — not minimal",
          body:  `{${sel.join(", ")}} determines all attributes, but a proper subset is also a superkey. Remove an attribute.`,
        });
        setGameOver(true);
      }
    } else {
      setStreak(0);
      setTotal(t => t + 1);
      const cl = [...computeClosure(sel, fds)].sort();
      
      if (gameMode === "practice") {
        const newWrongAttempts = wrongAttempts + 1;
        setWrongAttempts(newWrongAttempts);

        if (newWrongAttempts >= 3) {
          setProblemSolved(true);
          setAllSolved(true);
          setFoundKeys(problem.candidateKeys);
          setFeedback({
            type:  "wrong",
            title: "Not a superkey",
            body:  `{${sel.join(", ")}}⁺ = {${cl.join(", ")}} — does not cover all attributes. Out of attempts. The true candidate keys are revealed.`,
            keys: problem.candidateKeys,
          });
        } else {
          setFeedback({
            type:  "wrong",
            title: `Not a superkey (${newWrongAttempts}/3 wrong)`,
            body:  `{${sel.join(", ")}}⁺ = {${cl.join(", ")}} — does not cover all attributes. You have ${3 - newWrongAttempts} attempts left.`,
          });
        }
      } else {
        setFeedback({
          type:  "wrong",
          title: "Not a superkey",
          body:  `{${sel.join(", ")}}⁺ = {${cl.join(", ")}} — does not cover all attributes.`,
        });
        setGameOver(true);
      }
    }

    setSelected([]);
  }

  function showHint(): void {
    if (!problem) return;
    if (gameMode !== "practice" && hintsLeft <= 0) {
      setFeedback({ type: "hint", title: "No hints remaining", body: "Work through the closures step by step." });
      return;
    }
    const unfound = problem.candidateKeys.find(k => !foundKeys.some(fk => arraysEqual(fk, k)));
    if (!unfound) {
      setFeedback({ type: "info", title: "All keys found!", body: "Nothing left to hint at." });
      return;
    }
    if (gameMode !== "practice") {
      setHintsLeft(h => h - 1);
    }
    if (unfound.length === 1) {
      setFeedback({ type: "hint", title: "Hint", body: `One candidate key contains just the attribute "${unfound[0]}".` });
    } else {
      const partial = unfound.slice(0, Math.ceil(unfound.length / 2));
      setFeedback({ type: "hint", title: "Hint", body: `One candidate key contains {${partial.join(", ")}} and has ${unfound.length} attribute(s) total.` });
    }
  }

  function getLiveClosure(): LiveClosure {
    if (!problem || !selected.length) return { closure: [], isSK: false, isCK: false };
    return {
      closure: [...computeClosure(selected, problem.fds)].sort(),
      isSK:    isSuperkey(selected, problem.allAttrs, problem.fds),
      isCK:    isCandidateKey(selected, problem.allAttrs, problem.fds),
    };
  }

  function getHighlightedFDs(): boolean[] {
    if (!problem) return [];
    return problem.fds.map((fd: FD) =>
      selected.length > 0 && fd.lhs.every(a => selected.includes(a))
    );
  }

  function dismissGameOver(): void {
    setGameOver(false);
  }

  return {
    gameMode, setGameMode,
    score, streak, round, solved, total,
    difficulty, problem, selected, foundKeys, hintsLeft,
    feedback, allSolved, problemSolved, newKey, toast, gameOver,
    closureUses, activeClosureSight, skipUses, earnSkipPotion, consumeSkipPotion, useClosurePotion, consumeClosureUse, discardHint, discardClosure, discardSkip,
    loadProblem, nextProblem, changeDifficulty, toggleAttr, clearSelection, submitAnswer, showHint, earnHint, dismissGameOver,
    getLiveClosure, getHighlightedFDs,
  };
}
