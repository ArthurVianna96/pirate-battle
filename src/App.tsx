import { useCallback, useRef, useState, type MouseEvent } from 'react';
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
import { saveLastResult } from './storage/result';
import { loadPlayer } from './storage/player';
import type { MatchRecord } from './api/contracts';
import { useRegisterMatch } from './hooks/useRegisterMatch';
import { PendingRegistrations } from './components/shared/PendingRegistrations';
import { NetworkControls } from './components/shared/NetworkControls';

type Screen =
  | { kind: 'menu' }
  | { kind: 'options' }
  | { kind: 'game'; options: GameOptions }
  | { kind: 'result'; result: MatchRecord };

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [options, setOptions] = useState(loadOptions);
  const [player] = useState(loadPlayer);
  const [resultSaveFailed, setResultSaveFailed] = useState(false);
  const activeMatch = useRef<{ id: string; options: GameOptions } | undefined>(
    undefined,
  );
  const registration = useRegisterMatch();
  const { submit: submitMatch } = registration;

  function leaveGame() {
    activeMatch.current = undefined;
    setScreen({ kind: 'menu' });
  }

  function startGame() {
    const matchOptions = createOptionsSnapshot(options);
    activeMatch.current = { id: crypto.randomUUID(), options: matchOptions };
    playInterfaceSound('game_start');
    setScreen({ kind: 'game', options: matchOptions });
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

  const finishGame = useCallback(
    (result: MatchResult) => {
      const match = activeMatch.current;
      if (!match) {
        return;
      }
      activeMatch.current = undefined;
      const record: MatchRecord = {
        ...result,
        id: match.id,
        player,
        completedAt: new Date().toISOString(),
        configuration: match.options,
      };
      setResultSaveFailed(!saveLastResult(result));
      playInterfaceSound(
        result.endReason === 'death' ? 'game_over' : 'game_complete',
      );
      setScreen({ kind: 'result', result: record });
      void submitMatch(record);
    },
    [player, submitMatch],
  );

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
          registrationStatus={registration.statuses[screen.result.id] ?? 'idle'}
          pendingSaveFailed={
            registration.storageFailed && registration.pending.length > 0
          }
          onRetryRegistration={() => void submitMatch(screen.result)}
          onPlayAgain={startGame}
          onMainMenu={leaveGame}
        />
      );
    }
    return (
      <MainMenu
        options={options}
        playerId={player.id}
        playerName={player.name}
        onPlay={startGame}
        onOptions={openOptions}
        registrationNotice={
          <>
            <PendingRegistrations
              count={registration.pending.length}
              sending={registration.sending}
              storageFailed={registration.storageFailed}
              onRetry={() => void registration.retryAll()}
            />
            <NetworkControls
              sending={registration.sending}
              onResetPending={registration.clear}
            />
          </>
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
