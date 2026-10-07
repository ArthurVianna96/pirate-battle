import { useCallback, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { MatchResult } from './game/mechanics/match';
import { MatchResultScreen } from './screens/MatchResultScreen';
import { OptionsScreen } from './screens/OptionsScreen';
import { createOptionsSnapshot, type GameOptions } from './game/options';
import { loadOptions, saveOptions } from './storage/options';
import titleImage from '../assets/png/retina/ui/menu/title_pirate_battle.png';
import playerImage from '../assets/png/default/ships/ship_1.png';
import { playInterfaceSound } from './game/audio';

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
    playInterfaceSound('game_start');
    setScreen({ kind: 'game', options: createOptionsSnapshot(options) });
  }

  function saveGameOptions(nextOptions: GameOptions) {
    saveOptions(nextOptions);
    setOptions(nextOptions);
    leaveGame();
  }

  const finishGame = useCallback((result: MatchResult) => {
    playInterfaceSound(
      result.endReason === 'death' ? 'game_over' : 'game_complete',
    );
    setScreen({ kind: 'result', result });
  }, []);

  function renderScreen() {
    if (screen.kind === 'game') {
      return (
        <section aria-label="Game" className="game-screen">
          <GameCanvas
            options={screen.options}
            savedOptions={options}
            onSaveOptions={(nextOptions) => {
              saveOptions(nextOptions);
              setOptions(nextOptions);
            }}
            onMainMenu={leaveGame}
            onMatchEnd={finishGame}
          />
        </section>
      );
    }
    if (screen.kind === 'options') {
      return <OptionsScreen options={options} onSave={saveGameOptions} />;
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
      <section aria-label="Main menu" className="menu main-menu">
        <h1>
          <img className="game-title" src={titleImage} alt="Pirate Battle" />
        </h1>
        <p className="tagline">Set sail. Take command.</p>
        <div className="menu-actions">
          <button autoFocus onClick={startGame}>
            Play
          </button>
          <button onClick={() => setScreen({ kind: 'options' })}>
            Options
          </button>
        </div>
        <img className="menu-ship" src={playerImage} alt="" />
        <p>Navigate the islands. Survive the battle.</p>
        <p className="controls-help">
          W / ↑ move · A / D turn
          <br />
          Space fires forward · Q / E fire left / right
        </p>
      </section>
    );
  }

  return (
    <main
      className={screen.kind === 'game' ? 'playing' : undefined}
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('button'))
          playInterfaceSound('ui_click');
      }}
    >
      {renderScreen()}
    </main>
  );
}
