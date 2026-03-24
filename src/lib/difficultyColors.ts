/**
 * difficultyColors.ts
 * Shared color config for difficulty — used by buttons, badges, and text.
 */

import type { Difficulty } from "./problemGenerator";

export const DIFF_SELECTED_BTN: Record<Difficulty, string> = {
  easy:   "bg-green-100  border-green-400  text-green-700",
  medium: "bg-amber-100  border-amber-400  text-amber-700",
  hard:   "bg-red-100    border-red-400    text-red-700",
  expert: "bg-purple-100 border-purple-400 text-purple-700",
};

export const DIFF_TEXT: Record<Difficulty, string> = {
  easy:   "text-green-600",
  medium: "text-amber-600",
  hard:   "text-red-600",
  expert: "text-purple-600",
};
