/**
 * App.tsx
 * Root component. Owns screen routing and wires the game-state hook to screens.
 */

import { useState, useEffect } from "react";
import type { FC } from "react";
import { useGameState }  from "./hooks/useGameState";
import { StartScreen }   from "./screens/StartScreen";
import { GameScreen }    from "./screens/GameScreen";
import { SpireGame }     from "./components/SpireGame";
import { clearSpireSave, loadSpireSave } from "./hooks/useSpirePersistence";

type Screen = "start" | "game" | "spire";

const App: FC = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const game = useGameState();
  const hasSavedSpireRun = loadSpireSave() !== null;

  useEffect(() => {
    if (screen === "game" && !game.problem) {
      game.loadProblem(game.difficulty);
    }
  }, [screen]);

  if (screen === "start") {
    return (
      <StartScreen
        difficulty={game.difficulty}
        onSelectDifficulty={game.changeDifficulty}
        hasSavedSpireRun={hasSavedSpireRun}
        onStart={() => {
          game.setGameMode("practice");
          game.loadProblem(game.difficulty);
          setScreen("game");
        }}
        onStartSpire={() => {
          game.setGameMode("spire");
          setScreen("spire");
        }}
        onContinueSpire={() => {
          game.setGameMode("spire");
          setScreen("spire");
        }}
        onStartNewSpire={() => {
          clearSpireSave();
          game.restoreStats({
            score: 0,
            streak: 0,
            round: 1,
            hintsLeft: 0,
            closureUses: 0,
            skipUses: 0,
          });
          game.setGameMode("spire");
          setScreen("spire");
        }}
      />
    );
  }

  if (screen === "spire") {
    return (
      <SpireGame 
        onBack={() => setScreen("start")}
        game={game}
      />
    );
  }

  return (
    <GameScreen
      game={game}
      onGoToMenu={() => setScreen("start")}
    />
  );
};

export default App;
