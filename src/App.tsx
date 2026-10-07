import { useCallback, useState, type MouseEvent } from 'react';
import { GameCanvas } from './components/game/GameCanvas';
import type { MatchResult } from './game/mechanics/match';
import { MatchResultScreen } from './components/screens/MatchResultScreen';
import { OptionsScreen } from './components/screens/OptionsScreen';
import {
  createOptionsSnapshot,
  type GameOptions,
} from './game/support/options';
import { loadOptions, saveOptions } from './storage/options';
import { MainMenu } from './components/screens/MainMenu';
import { playInterfaceSound } from './game/support/audio';
import { loadLastResult, saveLastResult } from './storage/result';

type Screen =
  | { kind: 'menu' }
  | { kind: 'options' }
  | { kind: 'game'; options: GameOptions }
  | { kind: 'result'; result: MatchResult };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [options, setOptions] = useState(loadOptions);
  const [lastResult, setLastResult] = useState(loadLastResult);
  const [resultSaveFailed, setResultSaveFailed] = useState(false);

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
    setLastResult(result);
    setResultSaveFailed(!saveLastResult(result));
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
          saveFailed={resultSaveFailed}
          onPlayAgain={startGame}
          onMainMenu={leaveGame}
        />
      );
    }
    return (
      <MainMenu
        onPlay={startGame}
        onOptions={openOptions}
        onLastResult={
          lastResult
            ? () => setScreen({ kind: 'result', result: lastResult })
            : undefined
        }
      />
    );
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
