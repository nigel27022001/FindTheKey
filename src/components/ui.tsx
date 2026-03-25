/**
 * ui.tsx
 * Shared presentational atoms — light background + light card style.
 */

import type { FC, ReactNode } from "react";
import type { FeedbackType } from "../hooks/useGameState";
import type { Difficulty } from "../lib/problemGenerator";
import type { FD } from "../lib/fdAlgorithms";
import { DIFF_SELECTED_BTN } from "../lib/difficultyColors";

// ── DiffBadge ─────────────────────────────────────────────────────────────────

export const DiffBadge: FC<{ diff: Difficulty }> = ({ diff }) => (
  <span className={`${DIFF_SELECTED_BTN[diff]} text-xs font-semibold px-3 py-1 rounded-md uppercase tracking-wide border`}>
    {diff}
  </span>
);

// ── StatCard ──────────────────────────────────────────────────────────────────

export const StatCard: FC<{ label: string; value: ReactNode; valueClassName?: string }> = ({ label, value, valueClassName }) => (
  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center w-full shadow-sm">
    <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
      {label}
    </div>
    <div className={`font-extrabold ${valueClassName || 'text-3xl text-gray-800'}`}>{value}</div>
  </div>
);

// ── AttrChip ──────────────────────────────────────────────────────────────────

interface AttrChipProps {
  attr:     string;
  selected: boolean;
  onClick:  () => void;
  disabled: boolean;
}

export const AttrChip: FC<AttrChipProps> = ({ attr, selected, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "inline-block px-5 py-2 m-1 rounded-lg text-lg font-mono font-semibold transition-all duration-150",
      selected
        ? "bg-green-100 border-2 border-green-500 text-green-800 shadow-sm"
        : "bg-gray-100 border border-gray-300 text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50",
      disabled ? "cursor-default opacity-50" : "cursor-pointer active:scale-95",
    ].join(" ")}
  >
    {attr}
  </button>
);

// ── FDRow ─────────────────────────────────────────────────────────────────────

export const FDRow: FC<{ fd: FD; highlighted: boolean }> = ({ fd, highlighted }) => (
  <div className={[
    "flex items-center gap-3 px-4 py-3 rounded-lg mb-2 border transition-all duration-150",
    highlighted
      ? "bg-amber-50 border-amber-300 shadow-sm"
      : "bg-gray-50 border-gray-200",
  ].join(" ")}>
    <span className="text-blue-600 font-bold font-mono text-lg">{fd.lhs.join(", ")}</span>
    <span className="text-gray-400 text-xl">→</span>
    <span className="text-emerald-600 font-bold font-mono text-lg">{fd.rhs.join(", ")}</span>
  </div>
);

// ── Feedback ──────────────────────────────────────────────────────────────────

const FEEDBACK_META: Record<FeedbackType, { cls: string; emoji: string }> = {
  correct: { cls: "bg-green-50 border-green-400 text-green-800",   emoji: "✅" },
  wrong:   { cls: "bg-red-50   border-red-400   text-red-800",     emoji: "❌" },
  hint:    { cls: "bg-amber-50 border-amber-400 text-amber-800",   emoji: "💡" },
  info:    { cls: "bg-blue-50  border-blue-400  text-blue-800",    emoji: "ℹ️" },
};

interface FeedbackProps {
  type:      FeedbackType;
  title:     string;
  children?: ReactNode;
}

export const Feedback: FC<FeedbackProps> = ({ type, title, children }) => {
  if (!title && !children) return null;
  const { cls, emoji } = FEEDBACK_META[type];
  return (
    <div className={`${cls} border-2 rounded-xl px-5 py-4 mt-3 leading-relaxed animate-fade-up`}>
      {title && (
        <div className="font-bold text-lg mb-1.5 flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
        </div>
      )}
      {children && <div className="text-base opacity-85 ml-8">{children}</div>}
    </div>
  );
};

// ── KeyBadge ──────────────────────────────────────────────────────────────────

export const KeyBadge: FC<{ k: string[]; isNew?: boolean }> = ({ k, isNew }) => (
  <span className={[
    "inline-block font-mono text-base px-3.5 py-1 rounded-lg m-1 border-2 transition-all duration-200 font-semibold",
    isNew
      ? "bg-green-100 border-green-500 text-green-800 shadow-sm"
      : "bg-gray-100 border-gray-300 text-gray-700",
  ].join(" ")}>
    {"{"}{k.join(", ")}{"}"}
  </span>
);

// ── Toast ─────────────────────────────────────────────────────────────────────

export const Toast: FC<{ toast: { title: string; msg: string } | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-white border-2 border-green-400 rounded-xl px-5 py-3.5 shadow-xl max-w-xs animate-fade-up">
      <div className="font-bold text-base text-green-700 mb-0.5">🔥 {toast.title}</div>
      <div className="text-sm text-gray-500">{toast.msg}</div>
    </div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────

export const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
    {children}
  </div>
);
