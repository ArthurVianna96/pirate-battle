import { useCallback, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { MatchResult } from './game/mechanics/match';
import { MatchResultScreen } from './screens/MatchResultScreen';
import { OptionsScreen } from './screens/OptionsScreen';
import { createOptionsSnapshot, type GameOptions } from './game/options';
import { loadOptions, saveOptions } from './storage/options';

type Screen =
  | { kind: 'menu' }
  | { kind: 'options' }
  | { kind: 'game'; options: GameOptions }
  | { kind: 'result'; result: MatchResult };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [options, setOptions] = useState(loadOptions);

  function leaveGame() {
    setScreen({ kind: 'menu' });
  }

  function startGame() {
    setScreen({ kind: 'game', options: createOptionsSnapshot(options) });
  }

  function saveGameOptions(nextOptions: GameOptions) {
    saveOptions(nextOptions);
    setOptions(nextOptions);
    leaveGame();
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
          <GameCanvas options={screen.options} onMatchEnd={finishGame} />
        </section>
      );
    }
    if (screen.kind === 'options') {
      return (
        <OptionsScreen
          options={options}
          onSave={saveGameOptions}
          onMainMenu={leaveGame}
        />
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
        <div className="menu-actions">
          <button autoFocus onClick={startGame}>
            Play
          </button>
          <button onClick={() => setScreen({ kind: 'options' })}>
            Options
          </button>
        </div>
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
