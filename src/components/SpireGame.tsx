import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { Bug, Ghost, Crown, Gem, CircleHelp, Tent, Rat, Droplet, Skull, Flame, Sword, Shield, Coins, Heart, Scroll, Store, FlaskConical, UserKey } from "lucide-react";
import { generateSpireMap, generateEnemy } from "../lib/spireMap";
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
  const [problemIndex, setProblemIndex] = useState(0);

  const [showVictory, setShowVictory] = useState(false);

  const [playerHealth, setPlayerHealth] = useState(100);
  const [gold, setGold] = useState(0);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number, val: number, isPlayer: boolean }[]>([]);

  const [battleLog, setBattleLog] = useState<string[]>([]);
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

  const enemyIntentDamage =
    activeEnemy?.problems?.[problemIndex]?.damage ?? 0;

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      setMap(generateSpireMap(15, 5));
      appendLog("Run started. Map generated.");
      initialized.current = true;
    }
  }, []);

  const handleNodeClick = (node: SpireNode) => {
    if (currentNode?.id === node.id) return;

    if (node.status === "available" || node.status === "current") {
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
        setProblemIndex(0);

        appendLog(
          `A ${enemyWithMax.name} appears! (${enemyWithMax.totalHealth} HP)`
        );
        appendLog(`Enemy intent: ${enemyWithMax.problems[0]?.damage ?? 0} dmg`);

        game.changeDifficulty(enemyWithMax.problems[0].difficulty);
      } else if (node.type === "treasure") {
        setGold(g => g + 50);
        game.earnHint();
        appendLog(`Player collected Treasure! (+50 Gold, +1 Hint)`);

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
      } else if (node.type === "mystery") {
        const rand = Math.random();
        let shouldAutoComplete = false;

        if (rand < 0.2) {
          if (Math.random() < 0.5) {
            game.earnHint();
            appendLog(`Mystery: Found a strange liquid... it's a Hint Potion!`);
          } else {
            game.useClosurePotion();
            appendLog(`Mystery: Found a strange liquid... it's a Closure Potion!`);
          }
          shouldAutoComplete = true;
        } else if (rand < 0.4) {
          setPlayerHealth(hp => Math.min(100, hp + 20));
          appendLog(`Mystery: Drank from a revitalizing spring. (+20 HP)`);
          shouldAutoComplete = true;
        } else if (rand < 0.6) {
          setPlayerHealth(hp => hp - 10);
          appendLog(`Mystery: Fell into a spiked trap! (-10 HP)`);
          shouldAutoComplete = true;
        } else if (rand < 0.8) {
          appendLog(`Mystery: It's an ambush!`);
          const enemy = generateEnemy("minion");
          const enemyWithMax = { ...enemy, maxHealth: enemy.totalHealth };
          
          setActiveEnemy(enemyWithMax);
          setProblemIndex(0);
          appendLog(`A ${enemyWithMax.name} appears! (${enemyWithMax.totalHealth} HP)`);
          appendLog(`Enemy intent: ${enemyWithMax.problems[0]?.damage ?? 0} dmg`);
          game.changeDifficulty(enemyWithMax.problems[0].difficulty);
        } else {
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
        }
      } else if (node.type === "rest") {
        setPlayerHealth(hp => Math.min(100, hp + 30));
        appendLog(`Rested at the Checkpoint. (+30 HP)`);

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
      } else if (node.type === "shop") {
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
  };

  // Victory transition: show overlay briefly, then return to map
  useEffect(() => {
    if (!activeEnemy) return;
    if (activeEnemy.totalHealth > 0) return;
    if (showVictory) return;

    setShowVictory(true);
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

  useEffect(() => {
    if (activeEnemy && game.problemSolved) {
      const prob = activeEnemy.problems[problemIndex];
      const newHp = activeEnemy.totalHealth - prob.damage;

      setActiveEnemy({
        ...activeEnemy,
        totalHealth: Math.max(0, newHp),
      });

      spawnFloatingDamage(prob.damage, false);
      appendLog(`Solved! Dealt ${prob.damage} damage.`);

      if (newHp > 0 && problemIndex + 1 < activeEnemy.problems.length) {
        setTimeout(() => {
          const nextIdx = problemIndex + 1;
          setProblemIndex(nextIdx);
          appendLog(
            `Enemy intent: ${activeEnemy.problems[nextIdx]?.damage ?? 0} dmg`
          );
          game.changeDifficulty(
            activeEnemy.problems[nextIdx].difficulty
          );
        }, 600);
      }

      if (newHp <= 0) appendLog("Enemy defeated.");
    }
  }, [game.problemSolved]);

  useEffect(() => {
    if (activeEnemy && game.gameOver) {
      setPlayerHealth(hp => hp - 15);
      spawnFloatingDamage(15, true);
      appendLog("Wrong answer! You took 15 damage. The enemy hits you for trying a faulty key!");

      // Dismiss game over but keep on the same problem so they can try again.
      game.dismissGameOver();
    }
  }, [game.gameOver]);

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

      {/* MAP COLUMN */}
      <div className="w-1/3 p-4 border-r border-gray-300 overflow-y-auto flex flex-col relative" style={{ backgroundColor: "#fafaf9" }}>
        <div className="sticky top-0 z-20 py-3 pb-4 rounded-b-xl border-b border-gray-200 shadow-sm transition-all" style={{ backgroundColor: "#fafaf9" }}>
          <h2 className="text-xl font-extrabold text-center text-slate-800 mb-2 flex items-center justify-center gap-2">
            <Scroll size={22} className="text-indigo-600" />
            Spire of FDs
          </h2>
          <div className="text-xs text-slate-600 text-center px-2 space-y-2 leading-relaxed mb-3">
            <p className="italic font-medium text-indigo-700">"The Great Schemas have shattered. Anomalies ravage the once-pristine tables."</p>
            <p>As a rogue <span className="font-bold text-blue-600">Data Knight</span>, ascend the Spire to restore <strong>BCNF</strong>!</p>
          </div>

          {/* MAP LEGEND / LORE */}
          <div className="mx-2 mt-2 pt-3 border-t border-gray-200/60 grid grid-cols-2 gap-x-2 gap-y-2 text-[15px] text-slate-600 font-medium">
            <div className="flex items-center gap-1.5"><Bug size={14} className="text-gray-600" /> <span>Schema Bugs (Minion)</span></div>
            <div className="flex items-center gap-1.5"><Ghost size={14} className="text-red-500" /> <span className="text-red-700">Anomalies (Elite)</span></div>
            <div className="flex items-center gap-1.5"><Crown size={14} className="text-purple-600" /> <span className="text-purple-700 font-bold">Rogue DB (Boss)</span></div>
            <div className="flex items-center gap-1.5"><Store size={14} className="text-amber-600" /> <span>Merchant (Shop)</span></div>
            <div className="flex items-center gap-1.5"><Gem size={14} className="text-blue-500" /> <span>Data Cache (Treasure)</span></div>
            <div className="flex items-center gap-1.5"><CircleHelp size={14} className="text-blue-400" /> <span>Unknown Query</span></div>
            <div className="flex items-center gap-1.5"><Tent size={14} className="text-green-600" /> <span>Checkpoint (Rest)</span></div>
          </div>
        </div>

        <div className="relative w-full mt-4 shrink-0" style={{ minHeight: `${map.length * 90 + 50}px` }}>
          {/* PATHS SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
            {map.flatMap((layer, lIdx) =>
              layer.flatMap(node =>
                node.nextIds.map(nextId => {
                  // Find next node layer + node
                  const nextNode = map[lIdx + 1]?.find(n => n.id === nextId);
                  if (!nextNode) return null;

                  const isAvailable = node.status === 'completed' || node.status === 'current';
                  const isNextAvailable = isAvailable && (nextNode.status === 'available' || nextNode.status === 'current' || nextNode.status === 'completed');
                  const strokeColor = isNextAvailable ? '#4ade80' : '#e2e8f0';
                  const strokeWidth = isNextAvailable ? 4 : 3;
                  const opacity = (nextNode.status === 'locked' && !isNextAvailable) ? 0.6 : 1;

                  // bottom-up calculation: lIdx=0 is bottom
                  const y1 = (map.length - 1 - node.layer) * 90 + 45;
                  const x1 = `${node.x * 100}%`;
                  const y2 = (map.length - 1 - nextNode.layer) * 90 + 45;
                  const x2 = `${nextNode.x * 100}%`;

                  return (
                    <line
                      key={`${node.id}-${nextId}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
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

      {/* BATTLE COLUMN */}
      <div className="flex-1 overflow-y-auto relative flex flex-col bg-stone-50">
        {/* TOP STATUS BAR */}
        <div className="absolute top-4 right-8 flex gap-6 bg-white border border-gray-200 shadow-sm px-6 py-3 rounded-full z-20 items-center">
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <Heart size={20} className="fill-green-500 text-green-600" />
            {playerHealth} / 100
          </div>
          <div className="flex items-center gap-2 border-x border-gray-200 px-6">
            {Array.from({ length: 3 }).map((_, i) => {
              if (i < game.hintsLeft) {
                return (
                  <div key={i} className="w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center shadow-sm" title="Hint Scroll">
                    <Scroll size={16} className="text-amber-600" fill="currentColor" />
                  </div>
                );
              } else if (i < game.hintsLeft + game.closureUses) {
                return (
                  <div key={i} className="w-8 h-8 rounded-full bg-purple-50 border-2 border-purple-300 flex items-center justify-center shadow-sm" title="Closure Potion">
                    <FlaskConical size={16} className="text-purple-600" fill="currentColor" />
                  </div>
                );
              } else {
                return (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 shadow-inner" title="Empty Slot"></div>
                );
              }
            })}
          </div>
          <div className="flex items-center gap-2 text-yellow-600 font-bold">
            <Coins size={20} className="fill-yellow-400 text-yellow-500" />
            {gold}
          </div>
        </div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 z-20 flex items-center px-4 py-2 border border-transparent rounded-lg hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>

        <div className="flex-1 p-8 pt-24 overflow-y-auto flex flex-col justify-center">
          {!currentNode && (
            <div className="text-2xl text-gray-400 m-auto text-center">
              Select a room to proceed
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
                      if (gold >= 30 && game.hintsLeft + game.closureUses < 3) {
                        setGold(g => g - 30);
                        game.earnHint();
                        appendLog(`Bought a Hint Potion (-30 Gold)`);
                      }
                    }}
                    disabled={gold < 30 || game.hintsLeft + game.closureUses >= 3}
                    className="flex-1 bg-white border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-amber-100 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                  >
                    <div className="bg-amber-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <Scroll size={32} className="text-amber-600" />
                    </div>
                    <div className="font-bold text-amber-900">Hint Potion</div>
                    <div className="text-xs text-amber-700/70">Reveals partial key</div>
                    <div className="mt-2 bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Coins size={14} /> 30
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (gold >= 40 && game.hintsLeft + game.closureUses < 3) {
                        setGold(g => g - 40);
                        game.useClosurePotion();
                        appendLog(`Bought a Closure Potion (-40 Gold)`);
                      }
                    }}
                    disabled={gold < 40 || game.hintsLeft + game.closureUses >= 3}
                    className="flex-1 bg-white border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center gap-3 hover:bg-amber-100 hover:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                  >
                    <div className="bg-purple-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <FlaskConical size={32} className="text-purple-600" />
                    </div>
                    <div className="font-bold text-amber-900">Closure Potion</div>
                    <div className="text-xs text-amber-700/70">Calculates attribute closure</div>
                    <div className="mt-2 bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Coins size={14} /> 40
                    </div>
                  </button>
                </div>

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

              {/* BATTLE ARENA */}
              <div className="flex justify-between items-end relative">

                {/* PLAYER */}
                <div className="flex flex-col items-center gap-2 relative">
                  {floatingDamage.filter(d => d.isPlayer).map(d => (
                    <div key={d.id} className="absolute -top-12 text-red-500 font-bold text-3xl animate-float-dmg pointer-events-none">
                      -{d.val}
                    </div>
                  ))}

                  <div className="relative flex items-center justify-center text-slate-800 bg-slate-100 p-4 rounded-full border-4 border-slate-300 shadow-sm overflow-hidden">
                    <UserKey size={64} strokeWidth={2.5} className="z-10 text-slate-700" />
                  </div>
                  <div className="text-gray-800">Player</div>
                  <div className="w-48 bg-gray-300 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-4 transition-all duration-500 ease-out"
                      style={{ width: `${playerHealth}%` }}
                    />
                  </div>

                  <div className="text-green-700 font-bold text-sm">
                    {playerHealth}/100 HP
                  </div>
                </div>

                {/* ENEMY */}
                <div className="flex flex-col items-center gap-2 relative">
                  {floatingDamage.filter(d => !d.isPlayer).map(d => (
                    <div key={d.id} className="absolute -top-12 text-red-500 font-bold text-3xl animate-float-dmg pointer-events-none">
                      -{d.val}
                    </div>
                  ))}

                  <div className="text-gray-800 p-4 rounded-full" style={{ backgroundColor: `${activeEnemy.spriteFill}33` }}>
                    {activeEnemy.spriteId === "rat" && <Rat size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "droplet" && <Droplet size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "bug" && <Bug size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "skull" && <Skull size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "ghost" && <Ghost size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "flame" && <Flame size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "sword" && <Sword size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "crown" && <Crown size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                    {activeEnemy.spriteId === "shield" && <Shield size={64} fill={activeEnemy.spriteFill} color={activeEnemy.spriteColor} />}
                  </div>
                  <div className="text-gray-800"> {activeEnemy.name}</div>
                  <div className="w-48 bg-gray-300 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-4 transition-all duration-500 ease-out"
                      style={{
                        width: `${(activeEnemy.totalHealth /
                          (activeEnemy as any).maxHealth) *
                          100
                          }%`,
                      }}
                    />
                  </div>

                  <div className="text-red-700 text-sm">
                    {activeEnemy.totalHealth}/
                    {(activeEnemy as any).maxHealth} HP
                  </div>

                  <div className="text-red-600 font-bold animate-pulse">
                    ⚔️ Intent: {enemyIntentDamage}
                  </div>
                </div>
              </div>

              {/* PROBLEM UI */}
              {game.problem && (
                <div className="bg-slate-800 border-4 border-slate-700 shadow-2xl rounded-2xl p-6 relative overflow-hidden mt-4">
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
                    onToggleAttr={game.toggleAttr}
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
                    onSubmit={game.submitAnswer}
                    onHint={game.showHint}
                    onClear={game.clearSelection}
                    onNext={undefined}
                    hintsLeft={game.hintsLeft}
                    problemSolved={game.problemSolved}
                    allSolved={game.allSolved}
                    gameMode={game.gameMode}
                  />

                  {game.feedback && (
                    <div className="mt-4">
                      <Feedback type={game.feedback.type} title={game.feedback.title}>
                        {game.feedback.body && <div>{game.feedback.body}</div>}
                      </Feedback>
                    </div>
                  )}
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
            <div key={i} className="text-gray-600 border-b border-gray-200 pb-1">
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
