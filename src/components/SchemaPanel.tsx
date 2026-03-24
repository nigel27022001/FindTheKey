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
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-3 shadow-sm">
    <SectionLabel>Schema</SectionLabel>

    <div className="font-mono text-xl font-bold text-gray-800 mb-3">
      R({problem.allAttrs.join(", ")})
    </div>

    <p className="text-base text-gray-500 mb-3">
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
      <LiveClosureReadout selected={selected} problem={problem} />
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
    <div className="mt-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base font-mono text-gray-600 animate-fade-up">
      {"{"}{[...selected].sort().join(", ")}{"}"}⁺ = {"{"}{closure.join(", ")}{"}"}
      {" "}
      {isCK ? (
        <span className="text-green-600 font-bold">✓ candidate key</span>
      ) : isSK ? (
        <span className="text-amber-600 font-semibold">⚠ superkey, not minimal</span>
      ) : (
        <span className="text-red-600 font-semibold">✗ not a superkey</span>
      )}
    </div>
  );
};
