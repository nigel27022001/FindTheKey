/**
 * StartScreen.tsx
 * Landing / difficulty-selection screen — light card style.
 */

import type { FC } from "react";
import type { Difficulty } from "../lib/problemGenerator";
import { DIFFICULTY_LABELS } from "../lib/problemGenerator";
import { DIFF_SELECTED_BTN, DIFF_TEXT } from "../lib/difficultyColors";

interface StartScreenProps {
  difficulty:         Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStart:            () => void;
}

export const StartScreen: FC<StartScreenProps> = ({ difficulty, onSelectDifficulty, onStart }) => (
  <div className="min-h-screen bg-[#f0eeeb] flex items-center justify-center px-4">
    <div className="w-full max-w-md font-mono">

      {/* Title */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔑</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Relax &amp; Find the Key
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          Train your intuition for{" "}
          <span className="text-gray-700 font-semibold">candidate keys</span>{" "}
          and{" "}
          <span className="text-gray-700 font-semibold">functional dependencies</span>{" "}
          in relational schemas.
        </p>
      </div>

      {/* Difficulty selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Select difficulty
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => onSelectDifficulty(d)}
              className={[
                "font-mono text-base px-5 py-2 rounded-xl border-2 font-semibold transition-all active:scale-95",
                difficulty === d
                  ? DIFF_SELECTED_BTN[d]
                  : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600",
              ].join(" ")}
            >
              {d}
            </button>
          ))}
        </div>

        <p className={`text-base font-medium ${DIFF_TEXT[difficulty]}`}>
          {DIFFICULTY_LABELS[difficulty]}
        </p>
      </div>

      {/* Start button — light green */}
      <button
        onClick={onStart}
        className="w-full font-mono text-lg font-bold py-4 px-6 rounded-2xl
                   bg-green-600 text-white shadow-sm
                   hover:bg-green-700 active:scale-[0.98] transition-all tracking-wide"
      >
        Start game →
      </button>
    </div>
  </div>
);
