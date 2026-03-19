/**
 * TheoryAccordion.tsx
 * Collapsible theory reference panel.
 */

import { useState } from "react";
import type { FC } from "react";
import { THEORY_ENTRIES } from "../data/theory";

export const TheoryAccordion: FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0 text-left"
      >
        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
          Theory reference
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-up">
          {THEORY_ENTRIES.map((entry, i) => (
            <div key={i}>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {entry.heading}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {entry.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
