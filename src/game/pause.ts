import { pauseMatch, resumeMatch, type MatchState } from './mechanics/match';

interface PauseOptions {
  match: MatchState;
  stop: () => void;
  start: () => void;
  setInputEnabled: (enabled: boolean) => void;
  onPauseChange: (paused: boolean) => void;
}

export function createPauseControls({
  match,
  stop,
  start,
  setInputEnabled,
  onPauseChange,
}: PauseOptions) {
  function pause() {
    if (!pauseMatch(match)) return;
    setInputEnabled(false);
    stop();
    onPauseChange(true);
  }

  function resume() {
    if (document.hidden || !resumeMatch(match)) return;
    setInputEnabled(true);
    start();
    onPauseChange(false);
  }

  function pauseWhenHidden() {
    if (document.hidden) pause();
  }

  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', pauseWhenHidden);

  return {
    pause,
    resume,
    destroy() {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    },
  };
}
