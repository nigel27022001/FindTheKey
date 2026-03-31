import React from "react";
import { Bug, Ghost, Crown, Flame, Sword, Shield, Skull, Rat, Droplet, UserKey } from "lucide-react";
import type { EnemyConfig } from "../../lib/spireMap";

interface FloatingDamage {
  id: number;
  val: number;
  isPlayer: boolean;
}

interface Projectile {
  id: number;
  type: "rune" | "enemy";
  label: string;
  emoji: string;
}

interface SpireSidebarProps {
  projectiles: Projectile[];
  activeEnemy: EnemyConfig | null;
  floatingDamage: FloatingDamage[];
  enemyShake: boolean;
  playerShake: boolean;
  enemyIntentDamage: number;
  playerHealth: number;
  playerMaxHealth: number;
}

export function SpireSidebar({
  projectiles,
  activeEnemy,
  floatingDamage,
  enemyShake,
  playerShake,
  enemyIntentDamage,
  playerHealth,
  playerMaxHealth,
}: SpireSidebarProps) {
  return (
    <div className="w-72 p-4 border-r border-gray-300 flex flex-col justify-between relative overflow-hidden" style={{ backgroundColor: "#fafaf9" }}>
      {/* PROJECTILES */}
      {projectiles.map(p => (
        <div
          key={p.id}
          className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5 ${p.type === "rune" ? "bottom-44 animate-rune-up" : "top-48 animate-attack-down"}`}
        >
          {p.type === "rune" ? (
            <div className="flex items-center gap-1">
              {p.label.split(",").map((ch, i) => (
                <div key={i} className="w-10 h-10 bg-amber-100 border-2 border-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-300/50">
                  <span className="text-lg font-black text-amber-900">{ch}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-5xl drop-shadow-xl">{p.emoji}</span>
          )}
        </div>
      ))}

      {/* ENEMY (top) */}
      <div className="flex flex-col items-center gap-2">
        {activeEnemy ? (
          <>
            {floatingDamage.filter(d => !d.isPlayer).map(d => (
              <div key={d.id} className="text-red-500 font-bold text-3xl animate-float-dmg pointer-events-none">
                -{d.val}
              </div>
            ))}
            <div className={`relative flex items-center justify-center w-24 h-24 text-gray-800 rounded-full shrink-0 ${enemyShake ? "animate-hit-shake" : ""}`} style={{ backgroundColor: `${activeEnemy.spriteFill}33` }}>
              {activeEnemy.spriteId === "rat" && <Rat size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "droplet" && <Droplet size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "bug" && <Bug size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "skull" && <Skull size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "ghost" && <Ghost size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "flame" && <Flame size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "sword" && <Sword size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "crown" && <Crown size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
              {activeEnemy.spriteId === "shield" && <Shield size={56} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
            </div>
            <div className="text-gray-800 font-bold text-center truncate w-full" title={activeEnemy.name}>{activeEnemy.name}</div>
            <div className="w-full bg-gray-300 h-4 rounded-full overflow-hidden shadow-inner">
              <div
                className="bg-red-500 h-4 transition-all duration-500 ease-out"
                style={{ width: `${(activeEnemy.totalHealth / (activeEnemy as any).maxHealth) * 100}%` }}
              />
            </div>
            <div className="text-red-700 font-bold text-sm">
              {activeEnemy.totalHealth}/{(activeEnemy as any).maxHealth} HP
            </div>
            <div className="text-red-600 font-bold animate-pulse">
              ⚔️ Intent: {enemyIntentDamage}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-sm italic text-center pt-8">No enemy</div>
        )}
      </div>

      {/* PLAYER (bottom) */}
      <div className="flex flex-col items-center gap-2 relative">
        {floatingDamage.filter(d => d.isPlayer).map(d => (
          <div key={d.id} className="absolute -top-12 text-red-500 font-bold text-3xl animate-float-dmg pointer-events-none">
            -{d.val}
          </div>
        ))}
        <div className={`relative flex items-center justify-center w-24 h-24 text-slate-800 bg-slate-100 rounded-full border-4 border-slate-300 shadow-sm shrink-0 ${playerShake ? "animate-hit-shake" : ""}`}>
          <UserKey size={56} strokeWidth={2.5} className="z-10 text-slate-700" />
        </div>
        <div className="text-gray-800 font-bold">Data Knight (You)</div>
        <div className="w-full bg-gray-300 h-4 rounded-full overflow-hidden shadow-inner">
          <div
            className="bg-green-500 h-4 transition-all duration-500 ease-out"
            style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
          />
        </div>
        <div className="text-green-700 font-bold text-sm">
          {playerHealth}/{playerMaxHealth} HP
        </div>
      </div>
    </div>
  );
}
