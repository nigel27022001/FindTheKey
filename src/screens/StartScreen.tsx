/**
 * StartScreen.tsx
 * Landing / difficulty-selection screen.
 */

import type { FC } from "react";
import type { Difficulty } from "../lib/problemGenerator";
import { DIFFICULTY_LABELS } from "../lib/problemGenerator";

interface StartScreenProps {
  difficulty:        Difficulty;
  onSelectDifficulty:(diff: Difficulty) => void;
  onStart:           () => void;
}

export const StartScreen: FC<StartScreenProps> = ({ difficulty, onSelectDifficulty, onStart }) => (
  <div className="max-w-lg mx-auto px-4 py-12 font-mono">
    <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
      Relax &amp; Find the Key 🔑
    </h1>

    <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 leading-relaxed">
      Train your intuition for{" "}
      <span className="font-medium text-gray-700 dark:text-gray-300">candidate keys</span>{" "}
      and{" "}
      <span className="font-medium text-gray-700 dark:text-gray-300">functional dependencies</span>{" "}
      in relational schemas. Problems are randomly generated across four difficulty levels.
    </p>

    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-5">
      <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
        Select difficulty
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
          <button
            key={d}
            onClick={() => onSelectDifficulty(d)}
            className={[
              "font-mono text-sm px-4 py-1.5 rounded-lg border transition-all",
              difficulty === d
                ? "border-gray-500 dark:border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            ].join(" ")}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {DIFFICULTY_LABELS[difficulty]}
      </p>
    </div>

    <button
      onClick={onStart}
      className="w-full font-mono text-sm font-medium py-3 px-6 rounded-xl
                 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
                 hover:bg-gray-700 dark:hover:bg-gray-300
                 active:scale-[0.98] transition-all tracking-wide"
    >
      Start game →
    </button>
  </div>
);
