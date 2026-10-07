import { useCallback, useState, type MouseEvent } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { MatchResult } from './game/mechanics/match';
import { MatchResultScreen } from './screens/MatchResultScreen';
import { OptionsScreen } from './screens/OptionsScreen';
import { createOptionsSnapshot, type GameOptions } from './game/options';
import { loadOptions, saveOptions } from './storage/options';
import { MainMenu } from './screens/MainMenu';
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
    storeOptions(nextOptions);
    leaveGame();
  }

  function storeOptions(nextOptions: GameOptions) {
    saveOptions(nextOptions);
    setOptions(nextOptions);
  }

  function openOptions() {
    setScreen({ kind: 'options' });
  }

  const finishGame = useCallback((result: MatchResult) => {
    playInterfaceSound(
      result.endReason === 'death' ? 'game_over' : 'game_complete',
    );
    setScreen({ kind: 'result', result });
  }, []);

  function playClickSound(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button')) {
      playInterfaceSound('ui_click');
    }
  }

  function renderScreen() {
    if (screen.kind === 'game') {
      return (
        <section aria-label="Game" className="game-screen">
          <GameCanvas
            options={screen.options}
            savedOptions={options}
            onSaveOptions={storeOptions}
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
    return <MainMenu onPlay={startGame} onOptions={openOptions} />;
  }

  return (
    <main
      className={screen.kind === 'game' ? 'playing' : undefined}
      onClickCapture={playClickSound}
    >
      {renderScreen()}
    </main>
  );
}
