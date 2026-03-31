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

export const StatCard: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center w-full shadow-sm">
    <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
      {label}
    </div>
    <div className="text-3xl font-extrabold text-gray-800">{value}</div>
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
      "inline-block px-5 py-2 m-1 rounded-sm text-lg font-mono font-bold transition-all duration-150 tracking-wider shadow border-b-4",
      selected
        ? "bg-amber-100 border-amber-500 text-amber-900 border-x-2 border-t-2 opacity-90 translate-y-1"
        : "bg-amber-200 border-amber-900/60 text-amber-950 border-x-2 border-t-2 hover:bg-amber-100 hover:border-amber-700 active:translate-y-1 active:border-b-2",
      disabled ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer",
    ].join(" ")}
  >
    {attr}
  </button>
);

// ── FDRow ─────────────────────────────────────────────────────────────────────

export const FDRow: FC<{ fd: FD; highlighted: boolean }> = ({ fd, highlighted }) => (
  <div className={[
    "flex items-center gap-4 px-5 py-4 mb-3 border-2 transition-all duration-300 transform",
    highlighted
      ? "bg-amber-100 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.02] rounded-md"
      : "bg-slate-800 border-slate-700 shadow-inner rounded opacity-90",
  ].join(" ")}>
    <span className={highlighted ? "text-amber-900 font-extrabold font-mono text-xl" : "text-sky-300 font-bold font-mono text-lg"}>{fd.lhs.join(", ")}</span>
    <span className="text-slate-400 text-2xl font-bold">→</span>
    <span className={highlighted ? "text-amber-700 font-extrabold font-mono text-xl" : "text-emerald-300 font-bold font-mono text-lg"}>{fd.rhs.join(", ")}</span>
  </div>
);

// ── Feedback ──────────────────────────────────────────────────────────────────

const FEEDBACK_META: Record<FeedbackType, { cls: string; darkCls: string; emoji: string }> = {
  correct: { cls: "bg-emerald-900/10 border-emerald-500/50 text-emerald-900", darkCls: "bg-emerald-900/40 border-emerald-400 text-emerald-100", emoji: "✨" },
  wrong:   { cls: "bg-rose-900/10   border-rose-500/50   text-rose-900",     darkCls: "bg-rose-900/40 border-rose-400 text-rose-100", emoji: "🩸" },
  hint:    { cls: "bg-amber-900/10 border-amber-500/50 text-amber-900",   darkCls: "bg-amber-900/50 border-amber-400 text-amber-100", emoji: "📜" },
  info:    { cls: "bg-sky-900/10  border-sky-500/50  text-sky-900",    darkCls: "bg-sky-900/40 border-sky-400 text-sky-100", emoji: "👁️" },
};

interface FeedbackProps {
  type:      FeedbackType;
  title:     string;
  children?: ReactNode;
  dark?:     boolean;
}

export const Feedback: FC<FeedbackProps> = ({ type, title, children, dark }) => {
  if (!title && !children) return null;
  const { cls, darkCls, emoji } = FEEDBACK_META[type];
  const activeCls = dark ? darkCls : cls;
  return (
    <div className={`${activeCls} border-l-4 rounded-r-md px-6 py-4 mt-4 leading-relaxed animate-fade-up shadow-sm`}>
      {title && (
        <div className="font-bold text-lg mb-2 flex items-center gap-3 font-serif tracking-wide border-b border-black/10 pb-1 inline-flex">
          <span>{emoji}</span>
          <span>{title}</span>
        </div>
      )}
      {children && <div className="text-base opacity-90">{children}</div>}
    </div>
  );
};

// ── KeyBadge ──────────────────────────────────────────────────────────────────

export const KeyBadge: FC<{ k: string[]; isNew?: boolean }> = ({ k, isNew }) => (
  <span className={[
    "inline-block font-mono text-lg px-4 py-1.5 rounded-sm m-1.5 border-t-2 border-l-2 border-b-4 border-r-2 transition-all duration-300 font-black tracking-wide",
    isNew
      ? "bg-amber-100 border-amber-500 text-amber-900 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-bounce"
      : "bg-slate-700 border-slate-900 text-slate-200 opacity-90",
  ].join(" ")}>
    {"{"}{k.join(", ")}{"}"}
  </span>
);

// ── Toast ─────────────────────────────────────────────────────────────────────

export const Toast: FC<{ toast: { title: string; msg: string } | null }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900 text-slate-100 border-2 border-amber-500 rounded-sm px-6 py-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] max-w-sm animate-fade-up font-serif">
      <div className="font-bold text-xl text-amber-400 mb-1">{toast.title}</div>
      <div className="text-sm opacity-90">{toast.msg}</div>
    </div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────

export const SectionLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 mb-4 border-b-2 border-slate-300 pb-1">
    ★ {children} ★
  </div>
);
