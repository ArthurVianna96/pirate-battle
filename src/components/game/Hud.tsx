import { HealthMeter } from './HealthMeter';
import type { Ref } from 'react';

interface HudProps {
  score: number;
  health: number;
  maxHealth: number;
  remainingSeconds: number;
  paused: boolean;
  ready: boolean;
  onTogglePause: () => void;
  pauseButtonRef: Ref<HTMLButtonElement>;
}

export function Hud({
  score,
  health,
  maxHealth,
  remainingSeconds,
  paused,
  ready,
  onTogglePause,
  pauseButtonRef,
}: HudProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  return (
    <div className="hud">
      <HealthMeter health={health} maxHealth={maxHealth} />
      <p className="hud-counter score-counter" aria-live="polite">
        <span className="sr-only">Score: {score}</span>
        <span aria-hidden="true">{score}</span>
      </p>
      <p className="hud-counter time-counter">
        <span className="sr-only">Time: {remainingSeconds}s</span>
        <span aria-hidden="true">
          {minutes}:{seconds}
        </span>
      </p>
      <button
        className={`round-button ${paused ? 'resume-button' : 'pause-button'}`}
        ref={pauseButtonRef}
        onClick={onTogglePause}
        disabled={!ready}
        aria-label={paused ? 'Resume' : 'Pause'}
      />
    </div>
  );
}
