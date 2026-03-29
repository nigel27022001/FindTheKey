/**
 * ActionBar.tsx
 * Submit / Hint / Clear / Next problem buttons.
 * When allSolved: only shows Next problem button.
 */

import type { FC } from "react";

interface ActionBarProps {
  onSubmit: () => void;
  onHint: () => void;
  onClear: () => void;
  onSkip?: () => void;
  onNext?: () => void; // optional now
  hintsLeft: number;
  skipUses?: number;
  problemSolved: boolean;
  allSolved: boolean;
  gameMode?: "practice" | "spire";
}

export const ActionBar: FC<ActionBarProps> = ({
  onSubmit,
  onHint,
  onClear,
  onSkip,
  onNext,
  hintsLeft,
  skipUses = 0,
  problemSolved,
  allSolved,
  gameMode,
}) => {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {!allSolved && (
        <>
          <div className="flex gap-2 w-full">
            {gameMode === "spire" && onSkip && (
              <button
                onClick={onSkip}
                disabled={skipUses === 0}
                className={[
                  "font-serif text-sm px-2 py-3 rounded-sm border-b-4 font-bold transition-all shadow-md tracking-wider flex-1",
                  skipUses === 0
                    ? "bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed grayscale"
                    : "bg-rose-500 border-rose-700 text-rose-50 hover:bg-rose-400 hover:border-rose-600 active:translate-y-1 active:border-b-0 cursor-pointer",
                ].join(" ")}
              >
                Skip Question ({skipUses})
              </button>
            )}

            <button
              onClick={onHint}
              disabled={gameMode !== "practice" && hintsLeft === 0}
              className={[
                "font-serif text-sm px-2 py-3 rounded-sm border-b-4 font-bold transition-all shadow-md tracking-wider flex-1",
                gameMode !== "practice" && hintsLeft === 0
                  ? "bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed grayscale"
                  : "bg-amber-500 border-amber-700 text-amber-950 hover:bg-amber-400 hover:border-amber-600 active:translate-y-1 active:border-b-0 cursor-pointer",
              ].join(" ")}
            >
              {gameMode === "practice" ? "Hint (∞)" : `Use Scroll (${hintsLeft})`}
            </button>

            <button
              onClick={onClear}
              className="font-serif text-sm px-2 py-3 rounded-sm border-b-4 border-slate-400 font-bold bg-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-300 active:translate-y-1 active:border-b-0 transition-all shadow-md tracking-wider flex-1"
            >
              Clear Runes
            </button>
          </div>

          <button
            onClick={onSubmit}
            className="w-full font-serif text-lg px-8 py-3 rounded-sm border-b-4 border-emerald-700 font-bold bg-emerald-600 text-slate-100 hover:bg-emerald-500 hover:border-emerald-600 active:translate-y-1 active:border-b-0 transition-all shadow-md tracking-wider"
          >
            Forge Key
          </button>
        </>
      )}

      {problemSolved && onNext && (
        <button
          onClick={onNext}
          className="font-serif text-lg px-8 py-3 rounded-sm border-b-4 border-sky-700 font-bold bg-sky-600 text-slate-100 hover:bg-sky-500 hover:border-sky-600 active:translate-y-1 active:border-b-0 transition-all shadow-[0_0_15px_rgba(2,132,199,0.4)] ml-auto tracking-wider w-full mt-2"
        >
          Next Problem
        </button>
      )}
    </div>
  );
};