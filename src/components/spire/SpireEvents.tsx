import React from "react";
import { Store, Scroll, FlaskConical, FastForward, Coins, Gem, CircleHelp, Bug, Ghost, Tent, HeartPlus, HeartMinus } from "lucide-react";
import type { useGameState } from "../../hooks/useGameState";
import * as sfx from "../../lib/sfx";
import type { EnemyConfig } from "../../lib/spireMap";
import { saveScore } from "../../lib/leaderboardUtils";

export function ShopView({
  gold,
  setGold,
  game,
  appendLog,
  handleFightComplete,
}: {
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  game: ReturnType<typeof useGameState>;
  appendLog: (msg: string) => void;
  handleFightComplete: () => void;
}) {
  const potionCount = game.hintsLeft + game.closureUses + game.skipUses;

  return (
    <div className="max-w-xl w-full mx-auto flex flex-col gap-6">
      <div className="bg-amber-50 border-4 border-amber-600 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
        <Store size={64} className="mx-auto text-amber-600 mb-4" />
        <h3 className="text-3xl font-serif font-black text-amber-900 mb-2">Merchant's Tent</h3>
        <p className="text-amber-800/80 italic mb-8">"Potions of insight, fresh from the compiler. Buy while supplies last!"</p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              if (gold >= 30 && potionCount < 3) {
                setGold(g => g - 30);
                game.earnHint();
                sfx.sfxPurchase();
                appendLog(`Bought a Hint Potion (-30 Gold)`);
              }
            }}
            disabled={gold < 30 || potionCount >= 3}
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
              if (gold >= 40 && potionCount < 3) {
                setGold(g => g - 40);
                game.useClosurePotion();
                sfx.sfxPurchase();
                appendLog(`Bought a Closure Potion (-40 Gold)`);
              }
            }}
            disabled={gold < 40 || potionCount >= 3}
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
              if (gold >= 100 && potionCount < 3) {
                setGold(g => g - 100);
                game.earnSkipPotion();
                sfx.sfxPurchase();
                appendLog(`Bought a Skip Potion (-100 Gold)`);
              }
            }}
            disabled={gold < 100 || potionCount >= 3}
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

        {potionCount >= 3 && (
          <div className="mt-6 text-red-600 font-bold bg-red-100/50 py-2 rounded-lg border border-red-200">
            Potion belt is full! Discard a potion to acquire more.
          </div>
        )}

        <button
          onClick={handleFightComplete}
          className="mt-8 px-6 py-2 border-2 border-amber-500 text-amber-700 font-bold rounded-full hover:bg-amber-500 hover:text-white transition-colors"
        >
          Leave Shop
        </button>
      </div>
    </div>
  );
}

export function LootView({
  pendingPotions,
  setPendingPotions,
  game,
  handleFightComplete,
}: {
  pendingPotions: { id: string, type: "hint" | "closure" | "skip" }[];
  setPendingPotions: React.Dispatch<React.SetStateAction<{ id: string, type: "hint" | "closure" | "skip" }[]>>;
  game: ReturnType<typeof useGameState>;
  handleFightComplete: () => void;
}) {
  if (pendingPotions.length === 0) return null;
  const potionCount = game.hintsLeft + game.closureUses + game.skipUses;

  return (
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
                if (potionCount < 3) {
                  if (potion.type === "hint") game.earnHint();
                  if (potion.type === "closure") game.useClosurePotion();
                  if (potion.type === "skip") game.earnSkipPotion();

                  setPendingPotions(prev => {
                    const next = prev.filter(p => p.id !== potion.id);
                    if (next.length === 0) handleFightComplete();
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

        {potionCount >= 3 && (
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
  );
}

export function GameOverModal({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border-4 border-slate-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-up">
        <div className="text-3xl font-black text-rose-400 mb-2 font-serif tracking-widest uppercase mt-4">Game Over</div>
        <div className="text-base text-slate-400 mb-8 font-serif italic">The anomalies proved too much. Retreat and try again.</div>
        <button
          onClick={onBack}
          className="w-full font-serif text-xl font-bold py-4 px-6 rounded-xl bg-slate-700 text-white border-b-4 border-slate-900 shadow-sm hover:bg-slate-600 hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px] transition-all tracking-wider"
        >
          ↩ Return to Camp
        </button>
      </div>
    </div>
  );
}

export function VictoryOverlay({ activeEnemy }: { activeEnemy: EnemyConfig }) {
  return (
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
  );
}

export type OverlayEffect = "heal" | "trap" | "ambush" | "gold" | "hpGain"

export function EffectOverlay({ effect }: { effect: OverlayEffect }) {
  let effectProp, effectText, colorBg, colorBorder;
  switch (effect) {
    case "heal":
      effectProp = <HeartPlus size={48} className="text-green-500" />;
      effectText = "Drank from a revitalizing spring. (+20 HP)";
      colorBg = "from-green-100 to-green-50";
      colorBorder = "border-green-50";
      break;
    case "trap":
      effectProp = <HeartMinus size={48} className="text-red-500" />;
      effectText = "Fell into a spiked trap! (-10 HP)";
      colorBg = "from-red-100 to-red-50";
      colorBorder = "border-red-50";
      break;
    case "ambush":
      effectProp = <Ghost size={48} className="text-slate-500" />;
      effectText = "It's an ambush!";
      colorBg = "from-slate-200 to-slate-100";
      colorBorder = "border-slate-100";
      break;
    case "gold":
      effectProp = <Coins size={48} className="text-yellow-500" />;
      effectText = "Found a massive stash of coins! (+100 Gold)";
      colorBg = "from-yellow-100 to-yellow-50";
      colorBorder = "border-yellow-50";
      break;
    case "hpGain":
      effectProp = <HeartPlus size={48} className="text-green-500" />;
      effectText = "Found a Heart Container! (+20 Max HP and fully healed)";
      colorBg = "from-green-100 to-green-50";
      colorBorder = "border-green-50";
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[4px] px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-full max-w-sm text-center animate-fade-up relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-34 bg-gradient-to-br ${colorBg} z-0`} />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className={`bg-white w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg border-4 ${colorBorder}`}>
            {effectProp}
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{effectText}</h3>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Returning to the map...</p>
        </div>
      </div>
    </div>
  );
}

export function HowToPlayModal({ setShowHelp }: { setShowHelp: (show: boolean) => void }) {
  return (
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
  );
}

export function SpireVictoryModal({ 
  score, 
  onBack 
}: { 
  score: number; 
  onBack: () => void; 
}) {
  const [name, setName] = React.useState("");

  const handleSave = () => {
    saveScore(name, score);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-amber-400 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-up">
        <div className="text-4xl font-black text-amber-500 mb-2 font-serif tracking-widest uppercase mt-4">Spire Conquered!</div>
        <div className="text-sm text-slate-500 mb-6 font-serif italic">The anomalies have been purged. You are the ultimate candidate key.</div>
        
        <div className="bg-amber-50 p-4 rounded-xl mb-6 border border-amber-200">
          <div className="text-xs uppercase font-bold text-amber-700 tracking-wider">Total Score</div>
          <div className="text-4xl font-mono font-black text-amber-900">{score.toLocaleString()} PTS</div>
        </div>

        <div className="text-left mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Enter your name</label>
          <input
            type="text"
            className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
            placeholder="Anonymous Hero"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            autoFocus
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full font-serif text-xl font-bold py-4 px-6 rounded-xl bg-amber-500 text-white border-b-4 border-amber-600 shadow-sm hover:bg-amber-400 hover:border-b-2 hover:translate-y-[2px] active:border-b-0 active:translate-y-[4px] transition-all tracking-wider"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
}
