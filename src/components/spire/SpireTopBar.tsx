import React, { useState } from "react";
import { CircleHelp, Timer, Heart, Scroll, FlaskConical, FastForward, Coins, Volume2, VolumeX } from "lucide-react";
import * as sfx from "../../lib/sfx";
import type { useGameState } from "../../hooks/useGameState";

interface SpireTopBarProps {
  onBack: () => void;
  setShowHelp: (show: boolean) => void;
  battleTimer: number | null;
  playerHealth: number;
  playerMaxHealth: number;
  gold: number;
  game: ReturnType<typeof useGameState>;
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

export function SpireTopBar({
  onBack,
  setShowHelp,
  battleTimer,
  playerHealth,
  playerMaxHealth,
  gold,
  game,
  muted,
  setMuted,
}: SpireTopBarProps) {
  const [discardPrompt, setDiscardPrompt] = useState<{ type: "hint" | "closure" | "skip", index: number } | null>(null);

  return (
    <div className="sticky top-0 z-20 pointer-events-none px-3 py-2 sm:px-4 sm:py-3 bg-stone-50 border-b border-gray-200 shrink-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-wrap gap-2 items-center pointer-events-auto">
          <button
            onClick={onBack}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 transition-colors font-bold text-xs sm:text-sm"
          >
            ← Back
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-6 sm:py-2.5 bg-white hover:bg-slate-50 text-blue-700 hover:text-blue-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 transition-colors font-bold text-xs sm:text-sm"
          >
            <CircleHelp size={16} className="sm:w-5 sm:h-5" /> How to Play
          </button>
          <button
            onClick={() => {
              const next = !muted;
              setMuted(next);
              sfx.setMuted(next);
            }}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 transition-colors"
            title={muted ? "Sound Off" : "Sound On"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 px-3 py-2 sm:px-5 sm:py-2.5 items-center pointer-events-auto bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 w-full sm:w-auto">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold transition-all duration-300 ${battleTimer !== null && battleTimer <= 5
            ? 'bg-red-100 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-500 animate-pulse'
            : battleTimer !== null && battleTimer <= 10
              ? 'bg-orange-100 text-orange-700 border-2 border-orange-400'
              : 'bg-slate-100 text-slate-700 border-2 border-slate-300'
            }`}>
            <Timer size={16} className={`${battleTimer !== null && battleTimer <= 5 ? "animate-bounce" : ""} sm:w-5 sm:h-5`} />
            <span className="text-base sm:text-xl tabular-nums w-7 sm:w-8 text-center">{battleTimer}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-green-700 font-bold border-l border-gray-200 pl-3 sm:pl-4 md:pl-6">
            <Heart size={18} className="fill-green-500 text-green-600 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg whitespace-nowrap">{playerHealth} / {playerMaxHealth}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-gray-200 pl-3 sm:pl-4 md:pl-6">
            {Array.from({ length: 3 }).map((_, i) => {
              let pType: "hint" | "closure" | "skip" | null = null;
              if (i < game.hintsLeft) pType = "hint";
              else if (i < game.hintsLeft + game.closureUses) pType = "closure";
              else if (i < game.hintsLeft + game.closureUses + game.skipUses) pType = "skip";

              return (
                <div key={i} className="relative">
                  {pType === "hint" ? (
                    <div onClick={() => setDiscardPrompt({ type: "hint", index: i })} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-amber-50 border-2 border-amber-300 cursor-pointer hover:scale-110 transition-transform" title="Hint Scroll">
                      <Scroll size={14} className="text-amber-600 sm:w-4 sm:h-4" fill="currentColor" />
                    </div>
                  ) : pType === "closure" ? (
                    <div onClick={() => setDiscardPrompt({ type: "closure", index: i })} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-purple-50 border-2 border-purple-300 cursor-pointer hover:scale-110 transition-transform" title="Closure Potion">
                      <FlaskConical size={14} className="text-purple-600 sm:w-4 sm:h-4" fill="currentColor" />
                    </div>
                  ) : pType === "skip" ? (
                    <div onClick={() => setDiscardPrompt({ type: "skip", index: i })} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-50 border-2 border-rose-300 cursor-pointer hover:scale-110 transition-transform" title="Skip Potion">
                      <FastForward size={14} className="text-rose-600 sm:w-4 sm:h-4" fill="currentColor" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50" title="Empty Slot"></div>
                  )}

                  {discardPrompt?.index === i && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 text-center pointer-events-auto min-w-32 animate-fade-in">
                      {/* Triangle Pointer */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                      <div className="relative z-10">
                        <div className="text-sm font-bold text-slate-800 mb-2">Discard?</div>
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setDiscardPrompt(null)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                          <button onClick={() => {
                            if (discardPrompt.type === "hint") game.discardHint();
                            if (discardPrompt.type === "closure") game.discardClosure();
                            if (discardPrompt.type === "skip") game.discardSkip();
                            setDiscardPrompt(null);
                          }} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors">Discard</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-yellow-600 font-bold border-l border-gray-200 pl-3 sm:pl-4">
            <Coins size={18} className="fill-yellow-400 text-yellow-500 sm:w-6 sm:h-6" />
            <span className="text-sm sm:text-lg whitespace-nowrap">{gold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
