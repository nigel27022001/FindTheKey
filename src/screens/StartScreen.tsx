/**
 * StartScreen.tsx
 * Landing / difficulty-selection screen — light card style.
 */

import type { FC } from "react";
import { useState, useEffect } from "react";
import { Castle, Key, ArrowRight, Swords } from "lucide-react";
import { getLeaderboard } from "../lib/leaderboardUtils";
import type { LeaderboardEntry } from "../lib/leaderboardUtils";
import type { Difficulty } from "../lib/problemGenerator";
import { DIFFICULTY_LABELS } from "../lib/problemGenerator";
import { DIFF_SELECTED_BTN, DIFF_TEXT } from "../lib/difficultyColors";

interface StartScreenProps {
  difficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  onStart: () => void;
  onStartSpire?: () => void;
}

export const StartScreen: FC<StartScreenProps> = ({ difficulty, onSelectDifficulty, onStart, onStartSpire }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  return (
    <div className="min-h-screen bg-[#f0eeeb] flex items-center justify-center px-4">
      <div className="w-full max-w-md font-mono py-12">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 text-slate-800 mb-6">
            <Castle size={48} strokeWidth={2} />
            <Key size={48} strokeWidth={2} className="text-yellow-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">
            Spire of Forms
          </h1>
          <p className="text-base text-gray-500 leading-relaxed font-serif">
            Ascend the Spire to restore{" "}
            <span className="text-blue-600 font-bold">BCNF</span>. Defeat anomalies and forge the ultimate candidate keys.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {onStartSpire && (
            <button
              onClick={onStartSpire}
              className="w-full font-serif text-2xl font-black py-5 px-6 rounded-2xl
                       bg-slate-800 text-white shadow-xl border-b-8 border-slate-900 flex items-center justify-center gap-3
                       hover:bg-slate-700 hover:border-b-4 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all tracking-wider"
            >
              <Swords size={28} />
              Enter the Spire
            </button>
          )}
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-4 flex items-center justify-between">
              <span>Round Table of Data-Knights</span>
              <span>Top Scores</span>
            </div>
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 border border-amber-100/50">
                  <div className="flex items-center gap-3">
                    <div className="text-amber-700/50 font-black text-lg w-6">#{i + 1}</div>
                    <div className="font-bold text-slate-800">{entry.playerName}</div>
                  </div>
                  <div className="font-mono font-black text-amber-600">{entry.score.toLocaleString()} PTS</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Training Grounds</div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Difficulty selector (Only for practice) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Practice Difficulty
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(["easy", "medium", "hard", "expert"] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d)}
                className={[
                  "font-mono text-base px-5 py-2 rounded-xl border-2 font-semibold transition-all active:scale-95",
                  difficulty === d
                    ? DIFF_SELECTED_BTN[d]
                    : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600",
                ].join(" ") || undefined}
              >
                {d}
              </button>
            ))}
          </div>

          <p className={`text-sm font-medium ${DIFF_TEXT[difficulty]} mb-4`}>
            {DIFFICULTY_LABELS[difficulty]}
          </p>

          {/* Start practice button */}
          <button
            onClick={onStart}
            className="w-full font-mono text-base font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2
                     bg-green-50 text-green-700 border-2 border-green-500 shadow-sm
                     hover:bg-green-100 active:scale-95 transition-all tracking-wide"
          >
            Practice Questions <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};
