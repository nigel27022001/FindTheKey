/**
 * GameScreen.tsx
 * Main gameplay screen — composes all panels and action components.
 */

import type { FC } from "react";
import type { GameState } from "../hooks/useGameState";
import type { Difficulty } from "../lib/problemGenerator";
import { DiffBadge, StatCard, Feedback, KeyBadge, Toast } from "../components/ui";
import { SchemaPanel }     from "../components/SchemaPanel";
import { FDPanel }         from "../components/FDPanel";
import { ActionBar }       from "../components/ActionBar";
import { FoundKeysPanel }  from "../components/FoundKeysPanel";
import { TheoryAccordion } from "../components/TheoryAccordion";

interface GameScreenProps {
  game:       GameState;
  onGoToMenu: () => void;
}

export const GameScreen: FC<GameScreenProps> = ({ game, onGoToMenu }) => {
  const {
    score, streak, round, solved, total,
    difficulty, problem, selected, foundKeys, hintsLeft,
    feedback, allSolved, newKey, toast,
    changeDifficulty, toggleAttr, clearSelection, submitAnswer, showHint, loadProblem,
    getHighlightedFDs,
  } = game;

  const accuracy = total ? `${Math.round((solved / total) * 100)}%` : "—";

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 font-mono">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            Relax &amp; Find the Key 🔑
          </span>
          <DiffBadge diff={difficulty} />
        </div>
        <button
          onClick={onGoToMenu}
          className="font-mono text-xs px-3 py-1.5 rounded-lg border
                     border-gray-200 dark:border-gray-700
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          ← menu
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-3">
        <StatCard label="Score"    value={score}    />
        <StatCard label="Streak"   value={streak}   />
        <StatCard label="Round"    value={round}    />
        <StatCard label="Accuracy" value={accuracy} />
      </div>

      {/* Difficulty switcher */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => changeDifficulty(d)}
            className={[
              "font-mono text-xs px-3.5 py-1 rounded-lg border transition-all",
              difficulty === d
                ? "border-gray-500 dark:border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            ].join(" ")}
          >
            {d}
          </button>
        ))}
      </div>

      {problem && (
        <>
          <SchemaPanel
            problem={problem}
            selected={selected}
            allSolved={allSolved}
            onToggleAttr={toggleAttr}
          />

          <FDPanel
            fds={problem.fds}
            highlightedFDs={getHighlightedFDs()}
          />

          <ActionBar
            onSubmit={submitAnswer}
            onHint={showHint}
            onClear={clearSelection}
            onNext={() => loadProblem()}
            hintsLeft={hintsLeft}
            allSolved={allSolved}
          />

          {feedback && (
            <Feedback type={feedback.type} title={feedback.title}>
              {feedback.body && <div>{feedback.body}</div>}
              {feedback.keys && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span>All candidate keys:</span>
                  {feedback.keys.map((k, i) => <KeyBadge key={i} k={k} />)}
                </div>
              )}
            </Feedback>
          )}

          <FoundKeysPanel
            foundKeys={foundKeys}
            totalKeys={problem.candidateKeys.length}
            newKey={newKey}
          />
        </>
      )}

      <TheoryAccordion />
    </div>
  );
};
