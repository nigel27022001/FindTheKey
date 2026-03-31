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
  game:         any;
}

export const SchemaPanel: FC<SchemaPanelProps> = ({ problem, selected, allSolved, onToggleAttr, game }) => (
  <div className="bg-amber-50 border-2 border-amber-900/20 rounded-xl p-6 mb-3 shadow-md relative overflow-hidden">
    {/* Decorative corner accents */}
    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-900/10 rounded-tl-lg pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-900/10 rounded-br-lg pointer-events-none" />
    
    <SectionLabel>Ancient Schema</SectionLabel>

    <div className="font-mono text-xl font-bold text-amber-950 mb-3 drop-shadow-sm">
      R({problem.allAttrs.join(", ")})
    </div>

    <p className="text-base text-amber-800/80 mb-3 italic">
      Inscribe runes to form a candidate key:
    </p>

    <div className="flex flex-wrap relative z-10">
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
      <>
        {game.gameMode !== "practice" && !game.activeClosureSight && (
          <div className="mt-4 flex gap-3 relative z-10 w-full justify-between items-center">
            {game.closureUses > 0 ? (
              <div className="text-sm font-bold text-amber-700">
                🧪 Closure Potions available: {game.closureUses}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">No closure potions...</div>
            )}
            <button
              onClick={game.consumeClosureUse}
              disabled={game.closureUses <= 0}
              className="text-xs px-4 py-1.5 rounded-full border border-purple-400 bg-purple-100 text-purple-800 font-bold hover:bg-purple-200 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shadow-sm"
            >
              Quaff Closure Potion
            </button>
          </div>
        )}
        <LiveClosureReadout 
          selected={selected} 
          problem={problem} 
          game={game}
        />
      </>
    )}
  </div>
);

// ── LiveClosureReadout ────────────────────────────────────────────────────────

interface LiveClosureProps {
  selected: string[];
  problem:  Problem;
  game:     any;
}

const LiveClosureReadout: FC<LiveClosureProps> = ({ selected, problem, game }) => {
  const { fds, allAttrs } = problem;
  
  if (game.gameMode !== "practice" && !game.activeClosureSight) {
    return (
      <div className="mt-4 px-5 py-4 bg-slate-800/10 border-2 border-slate-800/30 rounded-xl text-center text-sm font-mono text-slate-600 shadow-inner animate-fade-up">
        Cannot read the closure. Use a Closure Potion to decrypt this problem!
      </div>
    );
  }

  const closure = [...computeClosure(selected, fds)].sort();
  const isSK    = isSuperkey(selected, allAttrs, fds);
  const isCK    = isCandidateKey(selected, allAttrs, fds);

  return (
    <div className="mt-4 px-5 py-4 bg-purple-900/10 border-2 border-purple-900/30 rounded-xl text-lg font-mono text-purple-950 shadow-inner animate-fade-up relative">
      {game.gameMode !== "practice" && (
        <div className="absolute top-1 right-2 text-xs font-serif text-purple-800/50">Revealed by Potion</div>
      )}
      <span className="font-extrabold text-purple-700">{"{"}{[...selected].sort().join(", ")}{"}"}⁺</span>
      <span className="opacity-50 mx-2">=</span>
      <span className="font-semibold">{"{"}{closure.join(", ")}{"}"}</span>
      <div className="mt-2 text-sm tracking-widest uppercase">
        {isCK ? (
          <span className="text-emerald-700 font-black drop-shadow-sm flex items-center gap-2">✨ candidate key forged</span>
        ) : isSK ? (
          <span className="text-amber-600 font-bold flex items-center gap-2">⚡ unstable superkey (not minimal)</span>
        ) : (
          <span className="text-rose-700 font-bold flex items-center gap-2">☠️ insufficient power (not a superkey)</span>
        )}
      </div>
    </div>
  );
};
