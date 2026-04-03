/**
 * useSpirePersistence.ts
 * Typed save / load / clear helpers for a Spire run.
 *
 * What is saved
 * ─────────────
 * SpireGame local state  : map, playerHealth, playerMaxHealth, gold, battleLog
 * useGameState stats     : score, streak, round, hintsLeft, closureUses, skipUses
 *
 * What is NOT saved (intentionally)
 * ──────────────────────────────────
 * activeEnemy / currentProblem / battleTimer – mid-battle state is complex to
 * restore safely.  On return the player lands on the map; the node they were
 * fighting still shows as "current" so they can re-enter the battle fresh.
 */

import { useEffect } from "react";
import type { SpireNode } from "../lib/spireMap";

// ── Bump the version string whenever the save schema changes ──────────────────
const SAVE_KEY = "spire_run_v1";

// ── Saved-state shape ─────────────────────────────────────────────────────────

export interface SpireSave {
  // SpireGame local state
  map:             SpireNode[][];
  playerHealth:    number;
  playerMaxHealth: number;
  gold:            number;
  battleLog:       string[];

  // useGameState stats
  score:       number;
  streak:      number;
  round:       number;
  hintsLeft:   number;
  closureUses: number;
  skipUses:    number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the persisted save or null if none / corrupted. */
export function loadSpireSave(): SpireSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SpireSave) : null;
  } catch {
    return null;
  }
}

/** Removes the persisted save (call at game-over or when starting a fresh run). */
export function clearSpireSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore – e.g. private-browsing environments that disallow storage writes
  }
}

// ── Auto-save hook ────────────────────────────────────────────────────────────

/**
 * Call inside SpireGame.  Writes to localStorage whenever any piece of the
 * save state changes.
 *
 * @example
 * useSpirePersistence({
 *   map, playerHealth, playerMaxHealth, gold, battleLog,
 *   score: game.score, streak: game.streak, round: game.round,
 *   hintsLeft: game.hintsLeft, closureUses: game.closureUses, skipUses: game.skipUses,
 * });
 */
export function useSpirePersistence(state: SpireSave): void {
  useEffect(() => {
    // Don't persist an empty map – the run hasn't started yet
    if (!state.map.length) return;
    if (state.playerHealth <= 0) return;

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded or private-browsing write failure – fail silently
    }
  }, [
    state.map,
    state.playerHealth,
    state.playerMaxHealth,
    state.gold,
    state.battleLog,
    state.score,
    state.streak,
    state.round,
    state.hintsLeft,
    state.closureUses,
    state.skipUses,
  ]);
}
