/**
 * TheoryPanel.tsx
 * Slide-in side panel for theory reference.
 */

import type { FC } from "react";
import { THEORY_ENTRIES } from "../data/theory";

interface TheoryPanelProps {
  open:    boolean;
  onClose: () => void;
}

export const TheoryPanel: FC<TheoryPanelProps> = ({ open, onClose }) => (
  <>
    {open && (
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
    )}

    <div
      className={[
        "fixed top-0 right-0 h-full w-84 z-50",
        "bg-[#161616] border-l border-[#2d2d2d]",
        "flex flex-col overflow-hidden",
        "transform transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      style={{ width: "340px" }}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d2d2d] shrink-0">
        <div>
          <div className="text-base font-bold text-zinc-100">📖 Theory Reference</div>
          <div className="text-xs text-zinc-500 mt-0.5">Key concepts &amp; algorithms</div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-200 transition-colors text-2xl leading-none p-1"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {THEORY_ENTRIES.map((entry, i) => (
          <div key={i}>
            <div className="text-base font-bold text-zinc-200 mb-2">
              {entry.heading}
            </div>
            <div className="text-sm text-zinc-400 leading-relaxed">
              {entry.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const TheoryButton: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Theory reference"
    className="fixed bottom-6 right-6 z-30 w-13 h-13 rounded-full
               bg-[#1e1e1e] border-2 border-[#3d3d3d]
               text-zinc-400 hover:text-zinc-100 hover:border-zinc-500
               shadow-xl transition-all duration-150 active:scale-95
               flex items-center justify-center text-xl"
    style={{ width: "52px", height: "52px" }}
  >
    📖
  </button>
);
