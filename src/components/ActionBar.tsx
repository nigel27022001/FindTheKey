/**
 * ActionBar.tsx
 * Submit / Hint / Clear / Next problem buttons.
 * When allSolved: only shows Next problem button.
 */

import type { FC } from "react";

interface ActionBarProps {
  onSubmit:  () => void;
  onHint:    () => void;
  onClear:   () => void;
  onNext:    () => void;
  hintsLeft: number;
  allSolved: boolean;
}

export const ActionBar: FC<ActionBarProps> = ({
  onSubmit, onHint, onClear, onNext, hintsLeft, allSolved,
}) => {
  if (allSolved) {
    return (
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={onNext}
          className="font-mono text-lg px-7 py-3 rounded-xl border-2 font-bold
                     bg-blue-50 border-blue-400 text-blue-700
                     hover:bg-blue-100 active:scale-95 transition-all shadow-sm"
        >
          Next problem →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <button
        onClick={onSubmit}
        className="font-mono text-lg px-7 py-3 rounded-xl border-2 font-bold
                   bg-green-50 border-green-400 text-green-700
                   hover:bg-green-100 active:scale-95 transition-all shadow-sm"
      >
        Submit key
      </button>

      <button
        onClick={onHint}
        disabled={hintsLeft === 0}
        className={[
          "font-mono text-lg px-7 py-3 rounded-xl border-2 font-bold transition-all active:scale-95 shadow-sm",
          hintsLeft === 0
            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-default"
            : "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 cursor-pointer",
        ].join(" ")}
      >
        Hint ({hintsLeft})
      </button>

      <button
        onClick={onClear}
        className="font-mono text-lg px-7 py-3 rounded-xl border-2 font-bold
                   bg-white border-gray-300 text-gray-500
                   hover:border-gray-400 hover:text-gray-700
                   active:scale-95 transition-all shadow-sm"
      >
        Clear
      </button>
    </div>
  );
};
