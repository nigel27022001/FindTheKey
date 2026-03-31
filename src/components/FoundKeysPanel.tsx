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
    <div className="bg-slate-300/80 border-2 border-slate-400 rounded-xl p-6 mt-3 shadow-md relative overflow-hidden">
      <SectionLabel>Forged Keys — {foundKeys.length}/{totalKeys}</SectionLabel>

      <div className="flex flex-wrap mb-4 relative z-10">
        {foundKeys.map((k, i) => (
          <KeyBadge key={i} k={k} isNew={newKey !== null && arraysEqual(k, newKey)} />
        ))}
      </div>

      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner relative z-10">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
