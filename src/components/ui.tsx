/**
 * ui.tsx
 * Shared presentational atoms — typed with React + Tailwind.
 */

import type { FC, ReactNode } from "react";
import type { FeedbackType } from "../hooks/useGameState";
import type { Difficulty } from "../lib/problemGenerator";
import type { FD } from "../lib/fdAlgorithms";

// ── DiffBadge ─────────────────────────────────────────────────────────────────

const DIFF_BADGE_CLASS: Record<Difficulty, string> = {
  easy:   "bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300",
  medium: "bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300",
  hard:   "bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300",
  expert: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export const DiffBadge: FC<{ diff: Difficulty }> = ({ diff }) => (
  <span className={`${DIFF_BADGE_CLASS[diff]} text-xs font-medium px-2.5 py-0.5 rounded-md uppercase tracking-wide`}>
    {diff}
  </span>
);

// ── StatCard ──────────────────────────────────────────────────────────────────

export const StatCard: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2.5 text-center min-w-[72px]">
    <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
      {label}
    </div>
    <div className="text-xl font-medium text-gray-900 dark:text-gray-100">{value}</div>
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
      "inline-block px-3.5 py-1 m-0.5 rounded-md text-sm font-mono transition-all duration-150",
      selected
        ? "bg-green-100 dark:bg-green-900/40 border-2 border-green-500 dark:border-green-500 text-green-800 dark:text-green-300 font-medium"
        : "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:border-green-400",
      disabled ? "cursor-default opacity-60" : "cursor-pointer",
    ].join(" ")}
  >
    {attr}
  </button>
);

// ── FDRow ─────────────────────────────────────────────────────────────────────

export const FDRow: FC<{ fd: FD; highlighted: boolean }> = ({ fd, highlighted }) => (
  <div className={[
    "flex items-center gap-2 px-3.5 py-2 rounded-md mb-1.5 border transition-all duration-150",
    highlighted
      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
      : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700",
  ].join(" ")}>
    <span className="text-blue-600 dark:text-blue-400 font-medium font-mono">{fd.lhs.join(", ")}</span>
    <span className="text-gray-400 text-base">→</span>
    <span className="text-green-600 dark:text-green-400 font-medium font-mono">{fd.rhs.join(", ")}</span>
  </div>
);

// ── Feedback ──────────────────────────────────────────────────────────────────

const FEEDBACK_CLASS: Record<FeedbackType, string> = {
  correct: "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300",
  wrong:   "bg-red-50   dark:bg-red-900/20   border-red-300   dark:border-red-700   text-red-800   dark:text-red-300",
  hint:    "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
  info:    "bg-blue-50  dark:bg-blue-900/20  border-blue-300  dark:border-blue-700  text-blue-800  dark:text-blue-300",
};

interface FeedbackProps {
  type:     FeedbackType;
  title:    string;
  children?: ReactNode;
}

export const Feedback: FC<FeedbackProps> = ({ type, title, children }) => {
  if (!title && !children) return null;
  return (
    <div className={`${FEEDBACK_CLASS[type]} border rounded-lg px-4 py-3 mt-3 text-sm leading-relaxed animate-fade-up`}>
      {title && <div className="font-medium mb-1">{title}</div>}
      {children}
    </div>
  );
};

// ── KeyBadge ──────────────────────────────────────────────────────────────────

export const KeyBadge: FC<{ k: string[]; isNew?: boolean }> = ({ k, isNew }) => (
  <span className={[
    "inline-block font-mono text-sm px-3 py-0.5 rounded-md m-0.5 border transition-all duration-200",
    isNew
      ? "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300"
      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
  ].join(" ")}>
    {"{"}{k.join(", ")}{"}"}
  </span>
);

// ── Toast ─────────────────────────────────────────────────────────────────────

export const Toast: FC<{ toast: { title: string; msg: string } | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-xl px-4 py-3 text-sm shadow-lg max-w-xs animate-fade-up">
      <div className="font-medium text-green-700 dark:text-green-400 mb-0.5">{toast.title}</div>
      <div className="text-gray-500 dark:text-gray-400">{toast.msg}</div>
    </div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────

export const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">
    {children}
  </div>
);
