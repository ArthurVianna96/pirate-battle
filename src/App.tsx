import { useCallback, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { MatchResult } from './game/mechanics/match';
import { MatchResultScreen } from './screens/MatchResultScreen';

type Screen =
  { kind: 'menu' } | { kind: 'game' } | { kind: 'result'; result: MatchResult };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });

  function leaveGame() {
    setScreen({ kind: 'menu' });
  }

  function startGame() {
    setScreen({ kind: 'game' });
  }

  const finishGame = useCallback((result: MatchResult) => {
    setScreen({ kind: 'result', result });
  }, []);

  function renderScreen() {
    if (screen.kind === 'game') {
      return (
        <section aria-label="Game">
          <div className="toolbar">
            <h2>Arena</h2>
            <button autoFocus onClick={leaveGame}>
              Main Menu
            </button>
          </div>
          <GameCanvas onMatchEnd={finishGame} />
        </section>
      );
    }
    if (screen.kind === 'result') {
      return (
        <MatchResultScreen
          result={screen.result}
          onPlayAgain={startGame}
          onMainMenu={leaveGame}
        />
      );
    }
    return (
      <section aria-label="Main menu" className="menu">
        <p>Your voyage starts here.</p>
        <button autoFocus onClick={startGame}>
          Play
        </button>
      </section>
    );
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Pirate Battle</p>
        <h1>Set sail</h1>
      </header>
      {renderScreen()}
    </main>
  );
}
