/**
 * ActionBar.tsx
 * Submit / Hint / Clear / Next problem buttons.
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
}) => (
  <div className="flex flex-wrap gap-2 mb-2">
    <button
      onClick={onSubmit}
      className="font-mono text-sm px-5 py-2 rounded-lg border font-medium
                 bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600
                 text-green-700 dark:text-green-300
                 hover:bg-green-100 dark:hover:bg-green-900/50
                 active:scale-95 transition-all"
    >
      Submit key
    </button>

    <button
      onClick={onHint}
      disabled={hintsLeft === 0}
      className={[
        "font-mono text-sm px-5 py-2 rounded-lg border transition-all active:scale-95",
        hintsLeft === 0
          ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-default"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer",
      ].join(" ")}
    >
      Hint ({hintsLeft})
    </button>

    <button
      onClick={onClear}
      className="font-mono text-sm px-5 py-2 rounded-lg border
                 border-gray-200 dark:border-gray-700
                 text-gray-500 dark:text-gray-400
                 hover:bg-gray-50 dark:hover:bg-gray-800
                 active:scale-95 transition-all"
    >
      Clear
    </button>

    {allSolved && (
      <button
        onClick={onNext}
        className="font-mono text-sm px-5 py-2 rounded-lg border font-medium
                   bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700
                   text-blue-700 dark:text-blue-300
                   hover:bg-blue-100 dark:hover:bg-blue-900/40
                   active:scale-95 transition-all"
      >
        Next problem →
      </button>
    )}
  </div>
);
