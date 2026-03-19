/**
 * FoundKeysPanel.tsx
 * Confirmed candidate keys and a progress bar.
 */

import type { FC } from "react";
import { arraysEqual } from "../lib/fdAlgorithms";
import { KeyBadge, SectionLabel } from "./ui";

interface FoundKeysPanelProps {
  foundKeys: string[][];
  totalKeys: number;
  newKey:    string[] | null;
}

export const FoundKeysPanel: FC<FoundKeysPanelProps> = ({ foundKeys, totalKeys, newKey }) => {
  if (!foundKeys.length) return null;
  const pct = Math.round((foundKeys.length / totalKeys) * 100);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mt-2.5">
      <SectionLabel>Keys found — {foundKeys.length}/{totalKeys}</SectionLabel>

      <div className="flex flex-wrap mb-3">
        {foundKeys.map((k, i) => (
          <KeyBadge key={i} k={k} isNew={newKey !== null && arraysEqual(k, newKey)} />
        ))}
      </div>

      <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400 dark:bg-green-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
