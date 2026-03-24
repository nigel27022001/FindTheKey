/**
 * GameScreen.tsx
 * Two-column layout: left sidebar (stats + difficulty) / right main (game panels).
 */

import { useState } from "react";
import type { FC } from "react";
import type { GameState } from "../hooks/useGameState";
import type { Difficulty } from "../lib/problemGenerator";
import { DiffBadge, StatCard, Feedback, KeyBadge, Toast } from "../components/ui";
import { SchemaPanel }    from "../components/SchemaPanel";
import { FDPanel }        from "../components/FDPanel";
import { ActionBar }      from "../components/ActionBar";
import { FoundKeysPanel } from "../components/FoundKeysPanel";
import { TheoryPanel, TheoryButton } from "../components/TheoryPanel";
import { DIFF_SELECTED_BTN } from "../lib/difficultyColors";

interface GameScreenProps {
  game:       GameState;
  onGoToMenu: () => void;
}

export const GameScreen: FC<GameScreenProps> = ({ game, onGoToMenu }) => {
  const [theoryOpen, setTheoryOpen] = useState(false);

  const {
    score, streak, round, solved, total,
    difficulty, problem, selected, foundKeys, hintsLeft,
    feedback, allSolved, newKey, toast, gameOver,
    changeDifficulty, toggleAttr, clearSelection, submitAnswer, showHint, loadProblem,
    getHighlightedFDs,
  } = game;

  const accuracy = total ? `${Math.round((solved / total) * 100)}%` : "—";

  return (
    <div className="min-h-screen bg-[#f0eeeb]">
      <Toast toast={toast} />
      <TheoryPanel open={theoryOpen} onClose={() => setTheoryOpen(false)} />
      <TheoryButton onClick={() => setTheoryOpen(true)} />

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl animate-fade-up">
            <div className="text-5xl mb-4">💀</div>
            <div className="text-2xl font-bold text-gray-800 mb-1 font-mono">Game Over</div>
            <div className="text-base text-gray-500 mb-4 font-mono">Wrong answer — better luck next time!</div>

            {/* Wrong answer explanation */}
            {feedback && feedback.type === "wrong" && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 mb-6 text-left">
                <div className="font-bold text-base text-red-700 mb-1 flex items-center gap-2">
                  <span>❌</span><span>{feedback.title}</span>
                </div>
                {feedback.body && (
                  <div className="text-sm text-red-600 ml-7">{feedback.body}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-8">
              <StatCard label="Score"    value={score}    />
              <StatCard label="Streak"   value={streak}   />
              <StatCard label="Round"    value={round}    />
              <StatCard label="Accuracy" value={accuracy} />
            </div>

            <button
              onClick={onGoToMenu}
              className="w-full font-mono text-lg font-bold py-3.5 px-6 rounded-xl
                         bg-gray-800 text-white shadow-sm
                         hover:bg-gray-700 active:scale-[0.98] transition-all"
            >
              ↩ Back to menu
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="max-w-5xl mx-auto px-5 py-6 font-mono flex gap-6 items-start">

        {/* ── Left sidebar ── */}
        <div className="w-48 shrink-0 flex flex-col gap-5 sticky top-6">

          {/* Logo + nav */}
          <div>
            <div className="text-lg font-bold text-gray-700 mb-2">🔑 Find the Key</div>
            <DiffBadge diff={difficulty} />
            <button
              onClick={onGoToMenu}
              className="mt-3 w-full font-mono text-base font-semibold px-3 py-2 rounded-lg border-2
                         border-gray-300 bg-white text-gray-500
                         hover:border-gray-400 hover:text-gray-700 transition-all"
            >
              ← menu
            </button>
          </div>

          {/* Stats — vertical */}
          <div className="flex flex-col gap-2">
            <StatCard label="Score"    value={score}    />
            <StatCard label="Streak"   value={streak}   />
            <StatCard label="Round"    value={round}    />
            <StatCard label="Accuracy" value={accuracy} />
          </div>

          {/* Difficulty switcher — vertical */}
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
              Difficulty
            </div>
            <div className="flex flex-col gap-1.5">
              {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => changeDifficulty(d)}
                  className={[
                    "font-mono text-lg px-4 py-2 rounded-lg border-2 font-semibold transition-all text-left",
                    difficulty === d
                      ? DIFF_SELECTED_BTN[d]
                      : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right main ── */}
        <div className="flex-1 min-w-0">
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
                    <div className="mt-2 flex flex-wrap items-center gap-1">
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
        </div>

      </div>
    </div>
  );
};
