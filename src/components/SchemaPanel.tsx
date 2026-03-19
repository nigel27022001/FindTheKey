/**
 * SchemaPanel.tsx
 * Relation schema display with clickable attribute chips and live closure readout.
 */

import type { FC } from "react";
import type { Problem } from "../lib/problemGenerator";
import { computeClosure, isSuperkey, isCandidateKey } from "../lib/fdAlgorithms";
import { AttrChip, SectionLabel } from "./ui";

interface SchemaPanelProps {
  problem:      Problem;
  selected:     string[];
  allSolved:    boolean;
  onToggleAttr: (attr: string) => void;
}

export const SchemaPanel: FC<SchemaPanelProps> = ({ problem, selected, allSolved, onToggleAttr }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-3">
    <SectionLabel>Schema</SectionLabel>

    <div className="font-mono text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
      R({problem.allAttrs.join(", ")})
    </div>

    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
      Click attributes to build a candidate key:
    </p>

    <div className="flex flex-wrap">
      {problem.allAttrs.map(a => (
        <AttrChip
          key={a}
          attr={a}
          selected={selected.includes(a)}
          onClick={() => onToggleAttr(a)}
          disabled={allSolved}
        />
      ))}
    </div>

    {selected.length > 0 && (
      <LiveClosureReadout
        selected={selected}
        problem={problem}
      />
    )}
  </div>
);

// ── LiveClosureReadout ────────────────────────────────────────────────────────

interface LiveClosureProps {
  selected: string[];
  problem:  Problem;
}

const LiveClosureReadout: FC<LiveClosureProps> = ({ selected, problem }) => {
  const { fds, allAttrs } = problem;
  const closure = [...computeClosure(selected, fds)].sort();
  const isSK    = isSuperkey(selected, allAttrs, fds);
  const isCK    = isCandidateKey(selected, allAttrs, fds);

  return (
    <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400 font-mono animate-fade-up">
      {"{"}{[...selected].sort().join(", ")}{"}"}⁺ = {"{"}{closure.join(", ")}{"}"}
      {" "}
      {isCK ? (
        <span className="text-green-600 dark:text-green-400 font-medium">✓ candidate key</span>
      ) : isSK ? (
        <span className="text-amber-600 dark:text-amber-400">superkey, not minimal</span>
      ) : (
        <span className="text-red-500 dark:text-red-400">not a superkey</span>
      )}
    </div>
  );
};
