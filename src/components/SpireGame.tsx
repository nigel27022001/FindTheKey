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

import { SpireLog } from "./spire/SpireLog";
import { SpireMap } from "./spire/SpireMap";
import { SpireSidebar } from "./spire/SpireSidebar";
import { SpireTopBar } from "./spire/SpireTopBar";
import { ShopView, LootView, GameOverModal, VictoryOverlay, HowToPlayModal } from "./spire/SpireEvents";

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
  const [pendingPotions, setPendingPotions] = useState<{ id: string, type: "hint" | "closure" | "skip" }[]>([]);

  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [projectiles, setProjectiles] = useState<{ id: number, type: "rune" | "enemy", label: string, emoji: string }[]>([]);

  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleTimer, setBattleTimer] = useState<number | null>(null);

  const appendLog = (message: string) => {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setBattleLog(prev => [...prev, `${ts} - ${message}`]);
  };

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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-mono">
      <Toast toast={game.toast} />

      {playerHealth <= 0 && <GameOverModal onBack={onBack} />}

      <SpireSidebar
        projectiles={projectiles}
        activeEnemy={activeEnemy}
        floatingDamage={floatingDamage}
        enemyShake={enemyShake}
        playerShake={playerShake}
        enemyIntentDamage={enemyIntentDamage}
        playerHealth={playerHealth}
        playerMaxHealth={playerMaxHealth}
      />

      <div className="flex-1 relative flex flex-col bg-stone-50 overflow-hidden h-full">
        <SpireTopBar
          onBack={onBack}
          setShowHelp={setShowHelp}
          battleTimer={battleTimer}
          playerHealth={playerHealth}
          playerMaxHealth={playerMaxHealth}
          gold={gold}
          game={game}
        />

        <div className="flex-1 p-8 overflow-y-auto flex flex-col">
          <SpireMap map={map} currentNode={currentNode} onNodeClick={handleNodeClick} />

          {currentNode && currentNode.type === "shop" && (
            <ShopView
              gold={gold}
              setGold={setGold}
              game={game}
              appendLog={appendLog}
              handleFightComplete={handleFightComplete}
            />
          )}

          {currentNode && !activeEnemy && pendingPotions.length > 0 && (
            <LootView
              pendingPotions={pendingPotions}
              setPendingPotions={setPendingPotions}
              game={game}
              handleFightComplete={handleFightComplete}
            />
          )}

          {currentNode && activeEnemy && (
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
              {showVictory && <VictoryOverlay activeEnemy={activeEnemy} />}

              {game.problem && (
                <div className="mt-4">
                  <div className="bg-slate-800 border-4 border-slate-700 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
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

      <SpireLog battleLog={battleLog} />

      { showHelp && <HowToPlayModal setShowHelp={setShowHelp} /> }
    </div >
  );
};