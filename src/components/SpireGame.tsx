import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { Bug, Ghost, Crown, Gem, CircleHelp, Tent, Timer, Rat, Droplet, Skull, Flame, Sword, Shield, Coins, Heart, Scroll, Store, FlaskConical, UserKey, FastForward } from "lucide-react";
import { generateSpireMap, generateEnemy, getRandomEnemyProblem } from "../lib/spireMap";
import * as sfx from "../lib/sfx";
import { DIFF_TEXT } from "../lib/difficultyColors";
import type { SpireNode, EnemyConfig } from "../lib/spireMap";
import { useGameState } from "../hooks/useGameState";

import { SchemaPanel } from "./SchemaPanel";
import { FDPanel } from "./FDPanel";
import { ActionBar } from "./ActionBar";
import { FoundKeysPanel } from "./FoundKeysPanel";
import { Toast, Feedback } from "./ui";

interface SpireGameProps {
  onBack: () => void;
  game: ReturnType<typeof useGameState>;
}

export const SpireGame: FC<SpireGameProps> = ({ onBack, game }) => {
  const [map, setMap] = useState<SpireNode[][]>([]);
  const [currentNode, setCurrentNode] = useState<SpireNode | null>(null);
  const [activeEnemy, setActiveEnemy] = useState<EnemyConfig | null>(null);
  const [currentProblem, setCurrentProblem] = useState<{ difficulty: "easy" | "medium" | "hard" | "expert", damage: number, timer: number } | null>(null);

  const [showVictory, setShowVictory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMaxHealth, setPlayerMaxHealth] = useState(100);
  const [gold, setGold] = useState(0);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number, val: number, isPlayer: boolean }[]>([]);
  const [discardPrompt, setDiscardPrompt] = useState<{ type: "hint" | "closure" | "skip", index: number } | null>(null);
  const [pendingPotions, setPendingPotions] = useState<{ id: string, type: "hint" | "closure" | "skip" }[]>([]);

  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [projectiles, setProjectiles] = useState<{ id: number, type: "rune" | "enemy", label: string, emoji: string }[]>([]);

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleTimer, setBattleTimer] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = (message: string) => {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setBattleLog(prev => [...prev, `${ts} - ${message}`]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [battleLog]);

  const enemyIntentDamage = activeEnemy?.Damage ?? 0;

  // Track last selected attrs so we can show them in rune projectile
  // (game.selected is cleared before the problemSolved effect fires)
  const lastSelectedRef = useRef<string[]>([]);
  useEffect(() => {
    if (game.selected.length > 0) {
      lastSelectedRef.current = game.selected;
    }
  }, [game.selected]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      setMap(generateSpireMap(15, 5));
      appendLog("Run started. Map generated.");
      game.clearPotions();
      initialized.current = true;
    }
  }, []);

  const handleNodeClick = (node: SpireNode) => {
    if (currentNode?.id === node.id) return;

    if (node.status === "available" || node.status === "current") {
      sfx.sfxMapSelect();
      appendLog(`Player entered ${node.type.toUpperCase()} (layer ${node.layer}).`);

      setCurrentNode(node);

      setMap(prev =>
        prev.map(layer =>
          layer.map(n =>
            n.layer === node.layer
              ? { ...n, status: n.id === node.id ? "current" : "locked" }
              : n
          )
        )
      );

      if (["minion", "elite", "boss"].includes(node.type)) {
        const enemy = generateEnemy(node.type as any);

        const enemyWithMax = {
          ...enemy,
          maxHealth: enemy.totalHealth,
        };

        setActiveEnemy(enemyWithMax);
        sfx.sfxEnemyAppear();

        const newProb = getRandomEnemyProblem(enemyWithMax);

        setCurrentProblem(newProb);

        appendLog(
          `A ${enemyWithMax.name} appears! (${enemyWithMax.totalHealth} HP)`
        );
        appendLog(`Enemy intent: ${enemyWithMax.Damage} dmg`);

        game.changeDifficulty(newProb.difficulty);
        setBattleTimer(newProb.timer);
      } else if (node.type === "treasure") {
        sfx.sfxTreasure();
        const rand = Math.random();
        let drops: { id: string, type: "hint" | "closure" | "skip" }[] = [];
        let shouldAutoComplete = true;

        if (rand < 0.25) {
          drops.push({ id: Math.random().toString(), type: "skip" });
          appendLog(`Treasure: Found a Skip Potion!`);
        } else if (rand < 0.5) {
          setGold(g => g + 100);
          sfx.sfxGold();
          appendLog(`Treasure: Found a massive stash of coins! (+100 Gold)`);
        } else if (rand < 0.75) {
          setPlayerMaxHealth(max => {
            const newMax = max + 20;
            setPlayerHealth(playerHealth + 20);
            return newMax;
          });
          appendLog(`Treasure: Found a Heart Container! (+20 Max HP and fully healed)`);
        } else {
          drops.push({ id: Math.random().toString(), type: "hint" });
          drops.push({ id: Math.random().toString(), type: "closure" });
          appendLog(`Treasure: Found the Alchemist's Stash! (Hint + Closure Potion)`);
        }

        if (drops.length > 0) {
          setPendingPotions(drops);
          shouldAutoComplete = false;
        }

        if (shouldAutoComplete) {
          // Auto-complete the treasure room
          setMap(prev =>
            prev.map(layer =>
              layer.map(n => {
                if (n.id === node.id)
                  return { ...n, status: "completed" };

                if (n.layer === node.layer + 1 && node.nextIds.includes(n.id))
                  return { ...n, status: "available" };

                return n;
              })
            )
          );

          setCurrentNode(null);
        }
      } else if (node.type === "mystery") {
        sfx.sfxMystery();
        const rand = Math.random();
        let shouldAutoComplete = false;
        let drops: { id: string, type: "hint" | "closure" | "skip" }[] = [];

        if (rand < 0.2) {
          if (Math.random() < 0.5) {
            drops.push({ id: Math.random().toString(), type: "hint" });
            appendLog(`Mystery: Found a strange liquid... it's a Hint Potion!`);
          } else {
            drops.push({ id: Math.random().toString(), type: "closure" });
            appendLog(`Mystery: Found a strange liquid... it's a Closure Potion!`);
          }
          setPendingPotions(drops);
        } else if (rand < 0.4) {
          setPlayerHealth(hp => Math.min(playerMaxHealth, hp + 20));
          sfx.sfxHeal();
          appendLog(`Mystery: Drank from a revitalizing spring. (+20 HP)`);
          shouldAutoComplete = true;
        } else if (rand < 0.6) {
          setPlayerHealth(hp => hp - 10);
          sfx.sfxTrap();
          appendLog(`Mystery: Fell into a spiked trap! (-10 HP)`);
          shouldAutoComplete = true;
        } else if (rand < 0.8) {
          sfx.sfxEnemyAppear();
          appendLog(`Mystery: It's an ambush!`);
          const enemy = generateEnemy("minion");
          const enemyWithMax = { ...enemy, maxHealth: enemy.totalHealth };

          setActiveEnemy(enemyWithMax);

          const newProb = getRandomEnemyProblem(enemyWithMax);

          setCurrentProblem(newProb);
          appendLog(`A ${enemyWithMax.name} appears! (${enemyWithMax.totalHealth} HP)`);
          appendLog(`Enemy intent: ${enemyWithMax.Damage} dmg`);
          game.changeDifficulty(newProb.difficulty);
          setBattleTimer(newProb.timer);
        } else {
          sfx.sfxShop();
          appendLog(`Mystery: Stumbled upon a hidden Merchant's Tent!`);
          setCurrentNode({ ...node, type: "shop" });
          setActiveEnemy(null);
        }

        if (shouldAutoComplete) {
          setMap(prev =>
            prev.map(layer =>
              layer.map(n => {
                if (n.id === node.id)
                  return { ...n, status: "completed" };

                if (n.layer === node.layer + 1 && node.nextIds.includes(n.id))
                  return { ...n, status: "available" };

                return n;
              })
            )
          );

          setCurrentNode(null);
        }
      } else if (node.type === "rest") {
        sfx.sfxHeal();
        setPlayerHealth(() => {
          appendLog(`Rested at the Checkpoint. Fully Healed to ${playerMaxHealth} HP.`);
          return playerMaxHealth;
        });

        // Auto-complete the rest room
        setMap(prev =>
          prev.map(layer =>
            layer.map(n => {
              if (n.id === node.id)
                return { ...n, status: "completed" };

              if (n.layer === node.layer + 1 && node.nextIds.includes(n.id))
                return { ...n, status: "available" };

              return n;
            })
          )
        );

        setCurrentNode(null);
      } else if (node.type === "shop") {
        sfx.sfxShop();
        appendLog(`Entered the Merchant's Shop.`);
        setCurrentNode(node);
        setActiveEnemy(null);
      } else {
        setActiveEnemy(null);
      }
    }
  };

  const handleFightComplete = () => {
    if (!currentNode) return;

    if (activeEnemy) {
      const droppedGold = activeEnemy.type === "boss" ? 100 : activeEnemy.type === "elite" ? 40 : 15;
      setGold(g => g + droppedGold);
      sfx.sfxGold();
      appendLog(`${activeEnemy.name} defeated! Dropped ${droppedGold} gold.`);
    } else {
      appendLog(`${currentNode.type.toUpperCase()} cleared.`);
    }

    setMap(prev =>
      prev.map(layer =>
        layer.map(n => {
          if (n.id === currentNode.id)
            return { ...n, status: "completed" };

          if (
            n.layer === currentNode.layer + 1 &&
            currentNode.nextIds.includes(n.id)
          )
            return { ...n, status: "available" };

          return n;
        })
      )
    );

    setCurrentNode(null);
    setActiveEnemy(null);
    setBattleTimer(null);
  };

  // Victory transition: show overlay briefly, then return to map
  useEffect(() => {
    if (!activeEnemy) return;
    if (activeEnemy.totalHealth > 0) return;
    if (showVictory) return;

    setShowVictory(true);
    sfx.sfxVictory();
    window.setTimeout(() => {
      setShowVictory(false);
      handleFightComplete();
    }, 1200);

    // Don't clear timeout so it has a chance to execute.
    // It's safe since the component doesn't hard unmount, only re-renders.
  }, [activeEnemy, showVictory]);

  const spawnFloatingDamage = (val: number, isPlayer: boolean) => {
    const id = Date.now() + Math.random();
    setFloatingDamage(prev => [...prev, { id, val, isPlayer }]);
    setTimeout(() => {
      setFloatingDamage(prev => prev.filter(d => d.id !== id));
    }, 1000);
  };

  const ENEMY_ATTACK_THEME: Record<string, { emoji: string, label: string }> = {
    "Cave Rat": { emoji: "🐀", label: "Bite" },
    "Corrosive Slime": { emoji: "🧪", label: "Acid" },
    "Giant Beetle": { emoji: "🪲", label: "Sting" },
    "Lost Skeleton": { emoji: "🦴", label: "Bone" },
    "Phantom": { emoji: "👻", label: "Haunt" },
    "Fire Elemental": { emoji: "🔥", label: "Fire" },
    "Mercenary": { emoji: "⚔️", label: "Slash" },
    "The Corrupted King": { emoji: "👑", label: "Decree" },
    "Iron Golem": { emoji: "🛡️", label: "Crush" },
    "Ancient Lich": { emoji: "💀", label: "Curse" },
  };

  const spawnProjectile = (type: "rune" | "enemy", label: string, emoji: string) => {
    const id = Date.now() + Math.random();
    setProjectiles(prev => [...prev, { id, type, label, emoji }]);
    setTimeout(() => {
      setProjectiles(prev => prev.filter(p => p.id !== id));
    }, 700);
  };

  const triggerShake = (target: "player" | "enemy") => {
    if (target === "player") {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 450);
    } else {
      setEnemyShake(true);
      setTimeout(() => setEnemyShake(false), 450);
    }
  };

  useEffect(() => {
    if (activeEnemy && game.problemSolved && currentProblem) {
      const timeRemaining = battleTimer !== null ? battleTimer : currentProblem.timer;
      const weightedDamage = Math.max(1, Math.round(currentProblem.damage * (timeRemaining / currentProblem.timer)));

      const newHp = activeEnemy.totalHealth - weightedDamage;

      // Rune projectile with selected attrs (use ref since selected is already cleared)
      const runeLabel = lastSelectedRef.current.join(",");
      spawnProjectile("rune", runeLabel, "✦");
      sfx.sfxRuneLaunch();

      // Delay damage to sync with projectile hitting
      setTimeout(() => {
        setActiveEnemy(prev => prev ? { ...prev, totalHealth: Math.max(0, newHp) } : prev);
        spawnFloatingDamage(weightedDamage, false);
        triggerShake("enemy");
        sfx.sfxRuneHit();
      }, 450);

      appendLog(`Solved! Dealt ${weightedDamage} damage.`);

      if (newHp > 0) {
        setTimeout(() => {
          const nextProb = getRandomEnemyProblem(activeEnemy);

          setCurrentProblem(nextProb);
          setBattleTimer(nextProb.timer);
          game.changeDifficulty(nextProb.difficulty);
        }, 600);
      } else {
        appendLog("Enemy defeated.");
      }
    }
  }, [game.problemSolved]);

  useEffect(() => {
    if (activeEnemy && game.gameOver) {
      // Enemy projectile themed to the enemy
      const theme = ENEMY_ATTACK_THEME[activeEnemy.name] ?? { emoji: "💥", label: "Attack" };
      spawnProjectile("enemy", theme.label, theme.emoji);
      sfx.sfxEnemyLaunch();

      setTimeout(() => {
        setPlayerHealth(hp => hp - activeEnemy.Damage);
        spawnFloatingDamage(activeEnemy.Damage, true);
        triggerShake("player");
        sfx.sfxPlayerHit();
      }, 450);

      sfx.sfxWrong();
      appendLog("Wrong answer! You took " + activeEnemy.Damage + " damage. The enemy hits you for trying a faulty key!");
      game.dismissGameOver();
      setBattleTimer(currentProblem?.timer ?? 30);
    }
  }, [game.gameOver]);

  //BattleTimer Logic
  useEffect(() => {
    if (activeEnemy && activeEnemy.totalHealth > 0 && !showVictory && battleTimer !== null && battleTimer > 0) {

      if (battleTimer <= 5) sfx.sfxTimerTick();
      const timer = setTimeout(() => {
        setBattleTimer(t => (t ? t - 1 : 0));
      }, 1000);
      return () => clearTimeout(timer);

    } else if (battleTimer === 0 && activeEnemy && activeEnemy.totalHealth > 0 && currentProblem) {
      setPlayerHealth(hp => hp - activeEnemy.Damage);
      spawnFloatingDamage(activeEnemy.Damage, true);
      sfx.sfxPlayerHit();
      appendLog("Time ran out! The enemy strikes! You took " + activeEnemy.Damage + " damage.");

      setBattleTimer(currentProblem.timer);
    }
  }, [activeEnemy, showVictory, battleTimer]);
  // Game over sound
  useEffect(() => {
    if (playerHealth <= 0) sfx.sfxGameOver();
  }, [playerHealth <= 0]);

  const colorizeLog = (text: string) => {
    const rules: { pattern: RegExp, className: string }[] = [
      // Damage numbers: "10 dmg", "15 damage", "-10 HP"
      { pattern: /(\d+)\s*(dmg|damage)/gi, className: "text-red-600 font-bold" },
      { pattern: /(-\d+\s*(?:HP|Gold))/gi, className: "text-red-600 font-bold" },
      // Healing / HP gain
      { pattern: /(\+\d+\s*(?:HP|Max HP))/gi, className: "text-green-600 font-bold" },
      { pattern: /(Fully Healed|fully healed)/g, className: "text-green-600 font-bold" },
      // Gold
      { pattern: /(\+?\d+\s*[Gg]old)/g, className: "text-yellow-600 font-bold" },
      { pattern: /(-\d+\s*[Gg]old)/g, className: "text-yellow-600 font-bold" },
      // Enemy names
      { pattern: /(Cave Rat|Corrosive Slime|Giant Beetle|Lost Skeleton|Phantom|Fire Elemental|Mercenary|The Corrupted King|Iron Golem|Ancient Lich)/g, className: "text-red-500 font-semibold" },
      // Positive events
      { pattern: /(Solved!|Victory|defeated!?)/gi, className: "text-emerald-600 font-bold" },
      { pattern: /(Enemy defeated\.)/g, className: "text-emerald-600 font-bold" },
      // Items / potions
      { pattern: /(Hint Potion|Closure Potion|Skip Potion|Heart Container|Alchemist's Stash)/g, className: "text-purple-600 font-semibold" },
      // Negative events
      { pattern: /(Wrong answer!)/g, className: "text-red-600 font-bold" },
      { pattern: /(ambush|spiked trap)/gi, className: "text-red-500 font-semibold" },
      // Intent
      { pattern: /(Enemy intent:)/g, className: "text-orange-600 font-semibold" },
      // Node types
      { pattern: /(MINION|ELITE|BOSS|MYSTERY|TREASURE|REST|SHOP)/g, className: "text-indigo-600 font-semibold" },
    ];

    // Split text into timestamp and message
    const dashIdx = text.indexOf(" - ");
    if (dashIdx === -1) return text;
    const timestamp = text.slice(0, dashIdx);
    let message = text.slice(dashIdx + 3);

    // Build colorized fragments
    type Fragment = { text: string, className?: string };
    let fragments: Fragment[] = [{ text: message }];

    for (const rule of rules) {
      const next: Fragment[] = [];
      for (const frag of fragments) {
        if (frag.className) { next.push(frag); continue; }
        let last = 0;
        const str = frag.text;
        for (const m of str.matchAll(new RegExp(rule.pattern))) {
          if (m.index! > last) next.push({ text: str.slice(last, m.index!) });
          next.push({ text: m[0], className: rule.className });
          last = m.index! + m[0].length;
        }
        if (last < str.length) next.push({ text: str.slice(last) });
      }
      fragments = next;
    }

    return (
      <>
        <span className="text-gray-400">{timestamp}</span>
        <span className="text-gray-400"> - </span>
        {fragments.map((f, i) =>
          f.className
            ? <span key={i} className={f.className}>{f.text}</span>
            : <span key={i}>{f.text}</span>
        )}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-mono">
      <Toast toast={game.toast} />

      {/* Game Over Modal */}
      {playerHealth <= 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-4 border-slate-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-up">
            <div className="text-3xl font-black text-rose-400 mb-2 font-serif tracking-widest uppercase mt-4">Game Over</div>
            <div className="text-base text-slate-400 mb-8 font-serif italic">The anomalies proved too much. Retreat and try again.</div>

            <button
              onClick={onBack}
              className="w-full font-serif text-xl font-bold py-4 px-6 rounded-xl
                         bg-slate-700 text-white border-b-4 border-slate-900 shadow-sm
                         hover:bg-slate-600 hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px] transition-all tracking-wider"
            >
              ↩ Return to Camp
            </button>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR — Enemy (top) + Player (bottom) */}
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

      {/* BATTLE COLUMN */}
      <div className="flex-1 relative flex flex-col bg-stone-50 overflow-hidden h-full">
        {/* HEADER AREA */}
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

        <div className="flex-1 p-8 overflow-y-auto flex flex-col">
          {/* MAP — shown in center when selecting a node */}
          {!currentNode && (
            <div className="max-w-2xl w-full mx-auto flex flex-col items-center">
              <h2 className="text-xl font-extrabold text-center text-slate-800 mb-2 flex items-center justify-center gap-2">
                <Scroll size={22} className="text-indigo-600" />
                Spire of FDs
              </h2>
              <div className="text-xs text-slate-600 text-center px-2 space-y-2 leading-relaxed mb-4">
                <p className="italic font-medium text-indigo-700">"The Great Schemas have shattered. Anomalies ravage the once-pristine tables."</p>
                <p>As a rogue <span className="font-bold text-blue-600">Data Knight</span>, ascend the Spire to restore <strong>BCNF</strong>!</p>
              </div>
              <div className="text-lg text-gray-500 mb-4 font-bold">Select a room to proceed</div>

              <div className="relative w-full shrink-0" style={{ minHeight: `${map.length * 90 + 50}px` }}>
                {/* PATHS SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
                  {map.flatMap((layer, lIdx) =>
                    layer.flatMap(node =>
                      node.nextIds.map(nextId => {
                        const nextNode = map[lIdx + 1]?.find(n => n.id === nextId);
                        if (!nextNode) return null;

                        const isAvailable = node.status === 'completed' || node.status === 'current';
                        const isNextAvailable = isAvailable && (nextNode.status === 'available' || nextNode.status === 'current' || nextNode.status === 'completed');
                        const strokeColor = isNextAvailable ? '#4ade80' : '#e2e8f0';
                        const strokeWidth = isNextAvailable ? 4 : 3;
                        const opacity = (nextNode.status === 'locked' && !isNextAvailable) ? 0.6 : 1;

                        const y1 = (map.length - 1 - node.layer) * 90 + 45;
                        const x1 = `${node.x * 100}%`;
                        const y2 = (map.length - 1 - nextNode.layer) * 90 + 45;
                        const x2 = `${nextNode.x * 100}%`;

                        return (
                          <line
                            key={`${node.id}-${nextId}`}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeOpacity={opacity}
                            strokeDasharray={isNextAvailable ? "none" : "4 4"}
                          />
                        );
                      })
                    )
                  )}
                </svg>

                {/* NODES */}
                {map.map((layer) =>
                  layer.map(node => {
                    const theme = {
                      minion: { border: "border-slate-500", bg: "bg-slate-200", shadow: "shadow-slate-300" },
                      elite: { border: "border-red-500", bg: "bg-red-100", shadow: "shadow-red-300" },
                      boss: { border: "border-purple-600", bg: "bg-purple-200", shadow: "shadow-purple-300" },
                      treasure: { border: "border-yellow-500", bg: "bg-yellow-100", shadow: "shadow-yellow-300" },
                      mystery: { border: "border-blue-500", bg: "bg-blue-100", shadow: "shadow-blue-300" },
                      rest: { border: "border-green-500", bg: "bg-green-100", shadow: "shadow-green-300" },
                      shop: { border: "border-amber-600", bg: "bg-amber-100", shadow: "shadow-amber-300" }
                    }[node.type] || { border: "border-gray-400", bg: "bg-white", shadow: "shadow-gray-300" };

                    const isAvailable = node.status === "available" || node.status === "current";
                    const isCompleted = node.status === "completed";

                    const statusClasses = isAvailable
                      ? `${theme.border} ${theme.bg} shadow-lg ${theme.shadow} ${node.status === "current" ? "ring-4 ring-green-400 scale-110" : ""}`
                      : isCompleted
                        ? `${theme.border} bg-gray-200 opacity-50`
                        : `border-gray-300 bg-gray-50 opacity-50 grayscale`;

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleNodeClick(node)}
                        className={`absolute w-12 h-12 -ml-6 -mt-6 flex items-center justify-center rounded-full border-2 cursor-pointer transition-all hover:scale-110 z-10 ${statusClasses}`}
                        style={{
                          left: `${node.x * 100}%`,
                          top: `${(map.length - 1 - node.layer) * 90 + 45}px`
                        }}
                      >
                        {node.type === "minion" && <Bug size={24} className="text-gray-700" />}
                        {node.type === "elite" && <Ghost size={24} className="text-red-700" />}
                        {node.type === "boss" && <Crown size={28} className="text-purple-700" />}
                        {node.type === "treasure" && <Gem size={24} className="text-blue-500" />}
                        {node.type === "mystery" && <CircleHelp size={24} className="text-green-600" />}
                        {node.type === "rest" && <Tent size={24} className="text-orange-600" />}
                        {node.type === "shop" && <Store size={24} className="text-amber-700" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {currentNode && currentNode.type === "shop" && (
            <div className="max-w-xl w-full mx-auto flex flex-col gap-6">
              <div className="bg-amber-50 border-4 border-amber-600 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
                <Store size={64} className="mx-auto text-amber-600 mb-4" />
                <h3 className="text-3xl font-serif font-black text-amber-900 mb-2">Merchant's Tent</h3>
                <p className="text-amber-800/80 italic mb-8">"Potions of insight, fresh from the compiler. Buy while supplies last!"</p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      if (gold >= 30 && game.hintsLeft + game.closureUses + game.skipUses < 3) {
                        setGold(g => g - 30);
                        game.earnHint();
                        sfx.sfxPurchase();
                        appendLog(`Bought a Hint Potion (-30 Gold)`);
                      }
                    }}
                    disabled={gold < 30 || game.hintsLeft + game.closureUses + game.skipUses >= 3}
                    className="flex-1 bg-white border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-amber-100 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                  >
                    <div className="bg-amber-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <Scroll size={32} className="text-amber-600" />
                    </div>
                    <div className="font-bold text-amber-900">Hint Potion</div>
                    <div className="text-xs text-amber-700/70 text-center leading-tight">Reveals partial key</div>
                    <div className="mt-auto bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Coins size={14} /> 30
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (gold >= 40 && game.hintsLeft + game.closureUses + game.skipUses < 3) {
                        setGold(g => g - 40);
                        game.useClosurePotion();
                        sfx.sfxPurchase();
                        appendLog(`Bought a Closure Potion (-40 Gold)`);
                      }
                    }}
                    disabled={gold < 40 || game.hintsLeft + game.closureUses + game.skipUses >= 3}
                    className="flex-1 bg-white border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-amber-100 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                  >
                    <div className="bg-purple-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <FlaskConical size={32} className="text-purple-600" />
                    </div>
                    <div className="font-bold text-amber-900">Closure Potion</div>
                    <div className="text-xs text-amber-700/70 text-center leading-tight">Calculates attribute closure</div>
                    <div className="mt-auto bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Coins size={14} /> 40
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (gold >= 100 && game.hintsLeft + game.closureUses + game.skipUses < 3) {
                        setGold(g => g - 100);
                        game.earnSkipPotion();
                        sfx.sfxPurchase();
                        appendLog(`Bought a Skip Potion (-100 Gold)`);
                      }
                    }}
                    disabled={gold < 100 || game.hintsLeft + game.closureUses + game.skipUses >= 3}
                    className="flex-1 bg-white border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-amber-100 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                  >
                    <div className="bg-rose-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <FastForward size={32} className="text-rose-600" />
                    </div>
                    <div className="font-bold text-amber-900">Skip Potion</div>
                    <div className="text-xs text-amber-700/70 text-center leading-tight">Skips current combat</div>
                    <div className="mt-auto bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Coins size={14} /> 100
                    </div>
                  </button>
                </div>

                {game.hintsLeft + game.closureUses + game.skipUses >= 3 && (
                  <div className="mt-6 text-red-600 font-bold bg-red-100/50 py-2 rounded-lg border border-red-200">
                    Potion belt is full! Discard a potion to acquire more.
                  </div>
                )}

                <button
                  onClick={() => {
                    handleFightComplete();
                  }}
                  className="mt-8 px-6 py-2 border-2 border-amber-500 text-amber-700 font-bold rounded-full hover:bg-amber-500 hover:text-white transition-colors"
                >
                  Leave Shop
                </button>
              </div>
            </div>
          )}

          {currentNode && !activeEnemy && pendingPotions.length > 0 && (
            <div className="max-w-xl w-full mx-auto flex flex-col gap-6">
              <div className="bg-white border-4 border-blue-200 rounded-3xl p-8 shadow-xl text-center">
                <Gem size={48} className="mx-auto text-blue-500 mb-4" />
                <h3 className="text-2xl font-black text-slate-800 mb-6">Loot Recovered!</h3>
                <p className="text-slate-600 mb-6 font-medium">You found mysterious potions. Take what you can carry.</p>

                <div className="flex flex-wrap gap-4 justify-center mb-6">
                  {pendingPotions.map(potion => (
                    <button
                      key={potion.id}
                      onClick={() => {
                        if (game.hintsLeft + game.closureUses + game.skipUses < 3) {
                          if (potion.type === "hint") game.earnHint();
                          if (potion.type === "closure") game.useClosurePotion();
                          if (potion.type === "skip") game.earnSkipPotion();

                          setPendingPotions(prev => {
                            const next = prev.filter(p => p.id !== potion.id);
                            if (next.length === 0) handleFightComplete(); // auto close if done
                            return next;
                          });
                        }
                      }}
                      className="flex-1 min-w-[120px] bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all active:scale-95 group"
                    >
                      <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${potion.type === "hint" ? "bg-amber-100 text-amber-600" :
                        potion.type === "closure" ? "bg-purple-100 text-purple-600" :
                          "bg-rose-100 text-rose-600"
                        }`}>
                        {potion.type === "hint" && <Scroll size={32} />}
                        {potion.type === "closure" && <FlaskConical size={32} />}
                        {potion.type === "skip" && <FastForward size={32} />}
                      </div>
                      <div className="font-bold text-slate-800 capitalize">{potion.type} Potion</div>
                    </button>
                  ))}
                </div>

                {game.hintsLeft + game.closureUses + game.skipUses >= 3 && (
                  <div className="mb-8 text-red-600 font-bold text-sm bg-red-50 py-2.5 px-4 rounded-xl border border-red-200 shadow-sm">
                    Potion belt is full! Discard a potion (click top right) or leave it.
                  </div>
                )}

                <button
                  onClick={() => {
                    setPendingPotions([]);
                    handleFightComplete();
                  }}
                  className="px-6 py-2.5 border-2 border-slate-300 text-slate-600 font-bold rounded-full hover:bg-slate-100 transition-colors"
                >
                  Leave Potions & Continue
                </button>
              </div>
            </div>
          )}

          {currentNode && activeEnemy && (
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">

              {showVictory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[4px] px-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-full max-w-sm text-center animate-fade-up relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-green-100 to-green-50 z-0" />
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-green-50">
                        <span className="text-6xl drop-shadow-md pb-1">🏆</span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 mb-2">Victory!</h3>
                      <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 shadow-sm">
                        +{activeEnemy.type === "boss" ? 100 : activeEnemy.type === "elite" ? 40 : 15} Gold
                      </div>
                      <p className="text-sm font-medium text-slate-500 animate-pulse">Returning to the map...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PROBLEM UI */}
              {game.problem && (
                <div className="mt-4">
                <div className="bg-slate-800 border-4 border-slate-700 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
                  {/* Decorative old-school border line */}
                  <div className="absolute inset-2 border border-slate-600/50 pointer-events-none rounded-xl" />

                  <div className="absolute top-0 right-0 bg-slate-900 border-b-2 border-l-2 border-slate-600 px-4 py-1 rounded-bl-xl z-20">
                    <span className={`text-xs font-bold uppercase tracking-widest ${DIFF_TEXT[game.difficulty]}`}>
                      {game.difficulty}
                    </span>
                  </div>

                  <SchemaPanel
                    problem={game.problem}
                    selected={game.selected}
                    allSolved={game.allSolved}
                    onToggleAttr={(a: string) => { sfx.sfxAttrSelect(); game.toggleAttr(a); }}
                    game={game}
                  />

                  <FDPanel
                    fds={game.problem.fds}
                    highlightedFDs={game.getHighlightedFDs()}
                  />

                  <FoundKeysPanel
                    foundKeys={game.foundKeys}
                    totalKeys={game.problem.candidateKeys.length}
                    newKey={game.newKey}
                  />

                  <ActionBar
                    onSubmit={() => { sfx.sfxClick(); game.submitAnswer(); }}
                    onHint={() => { sfx.sfxPotion(); game.showHint(); }}
                    onClear={() => { sfx.sfxClick(); game.clearSelection(); }}
                    onSkip={() => { sfx.sfxPotion(); game.consumeSkipPotion(); }}
                    onNext={undefined}
                    hintsLeft={game.hintsLeft}
                    skipUses={game.skipUses}
                    problemSolved={game.problemSolved}
                    allSolved={game.allSolved}
                    gameMode={game.gameMode}
                  />

                  {game.feedback && (
                    <div className="mt-4">
                      <Feedback type={game.feedback.type} title={game.feedback.title} dark={true}>
                        {game.feedback.body && <div>{game.feedback.body}</div>}
                      </Feedback>
                    </div>
                  )}
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BATTLE LOG COLUMN */}
      <div className="w-80 border-l border-gray-300 bg-gray-100 p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-3 text-gray-900">📜 Battle Log</h2>

        <div ref={logRef} className="flex-1 overflow-y-auto text-sm space-y-2">
          {battleLog.map((entry, i) => (
            <div key={i} className="text-gray-800 border-b border-gray-200 pb-1">
              {colorizeLog(entry)}
            </div>
          ))}
        </div>
      </div>

      {/* HOW TO PLAY MODAL */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-stone-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border-4 border-slate-300 overflow-hidden">
            <div className="bg-slate-800 text-amber-50 p-4 border-b-4 border-amber-600 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                <CircleHelp size={28} className="text-amber-400" /> How to Play
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              <section>
                <h3 className="text-xl font-bold border-b-2 border-slate-200 pb-2 mb-3 text-slate-900">The Spire</h3>
                <p className="leading-relaxed">
                  Navigate the map by clicking adjacent glowing nodes. Reaching new layers provides harder Relational Schema problems! Look out for different encounters. Find ALL candidate keys to defeat enemies.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold border-b-2 border-slate-200 pb-2 mb-3 text-slate-900">Node Types</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <Bug size={24} className="text-gray-700" />
                    </div>
                    <div>
                      <strong className="block text-gray-800">Minion Fight</strong>
                      <span className="text-sm text-gray-600">Standard combat. Defeat to earn 15 Gold. Health depends on the layer.</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <Ghost size={24} className="text-red-700" />
                    </div>
                    <div>
                      <strong className="block text-red-700">Elite Fight</strong>
                      <span className="text-sm text-gray-600">Difficult combat. Drops 40 Gold.</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <Tent size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <strong className="block text-orange-700">Rest Stop</strong>
                      <span className="text-sm text-gray-600">Breathe and relax. <strong className="text-green-600">Fully heals</strong> your health back to maximum.</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <Store size={24} className="text-amber-700" />
                    </div>
                    <div>
                      <strong className="block text-amber-700">Merchant's Shop</strong>
                      <span className="text-sm text-gray-600">Spend the Gold dropping from enemies to buy potions to insert into your belt (maximum 3 items): Hint Potions (30G), Closure Potions (40G), and Skip Potions (100G).</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                      <Gem size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <strong className="block text-blue-600">Treasure Room</strong>
                      <span className="text-sm text-gray-600 space-y-1 block mt-1">
                        Open a chest with a random chance for one of four immense rewards:
                        <ul className="list-disc ml-5 mt-1 text-xs">
                          <li><strong>Massive Wealth:</strong> Gain +100 gold instantly!</li>
                          <li><strong>Heart Container:</strong> Increase Max HP by +20 and fully heal!</li>
                          <li><strong>Skip Potion:</strong> A legendary brew that instantly solves one question!</li>
                          <li><strong>Alchemist's Stash:</strong> Grants both a Closure Potion and a Hint Potion!</li>
                        </ul>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-gray-50 border-2 border-gray-300 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                      <CircleHelp size={24} className="text-green-600" />
                    </div>
                    <div>
                      <strong className="block text-green-700">Mystery Room</strong>
                      <span className="text-sm text-gray-600 space-y-1 block mt-1">
                        Test your luck! Can result in any of the following events:
                        <ul className="list-disc ml-5 mt-1 text-xs">
                          <li>Stumble upon a <em>Hidden Shop Tent.</em></li>
                          <li>Drink from a spring and <em>Heal 20 HP.</em></li>
                          <li>Find a <em>Hint Potion</em> or <em>Closure Potion.</em></li>
                          <li>Fall into a spiked trap and <em>lose 10 HP!</em></li>
                          <li>Experience an <em>Ambush</em> by a Minion!</li>
                        </ul>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-4 bg-gray-100 border-t-2 border-gray-200 text-center shrink-0">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-8 rounded-lg shadow-sm border-b-4 border-amber-800 active:translate-y-1 active:border-b-0 transition-all uppercase tracking-wider"
              >
                Understood!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
