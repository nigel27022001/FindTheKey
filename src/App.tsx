/**
 * App.tsx
 * Root component. Owns screen routing and wires the game-state hook to screens.
 */

import { useState, useEffect } from "react";
import type { FC } from "react";
import { useGameState }  from "./hooks/useGameState";
import { StartScreen }   from "./screens/StartScreen";
import { GameScreen }    from "./screens/GameScreen";

type Screen = "start" | "game";

const App: FC = () => {
  const [screen, setScreen] = useState<Screen>("start");
  const game = useGameState();

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
        onStart={() => {
          game.loadProblem(game.difficulty);
          setScreen("game");
        }}
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
