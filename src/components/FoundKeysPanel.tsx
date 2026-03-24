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
    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-3 shadow-sm">
      <SectionLabel>Keys found — {foundKeys.length}/{totalKeys}</SectionLabel>

      <div className="flex flex-wrap mb-3">
        {foundKeys.map((k, i) => (
          <KeyBadge key={i} k={k} isNew={newKey !== null && arraysEqual(k, newKey)} />
        ))}
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
