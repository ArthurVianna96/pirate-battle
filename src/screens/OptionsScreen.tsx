import { useRef, useState, type FormEvent } from 'react';
import {
  isDurationValid,
  isSpawnIntervalValid,
  OPTIONS_CONFIG,
  type GameOptions,
} from '../game/options';
import { MATCH_CONFIG } from '../game/mechanics/match';

interface OptionsProps {
  options: GameOptions;
  onSave: (options: GameOptions) => void;
  onMainMenu: () => void;
}

export function OptionsScreen({ options, onSave, onMainMenu }: OptionsProps) {
  const durationInput = useRef<HTMLInputElement>(null);
  const spawnInput = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState(String(options.sessionDuration));
  const [spawnInterval, setSpawnInterval] = useState(
    String(options.enemySpawnInterval),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const durationInvalid = submitted && !isDurationValid(Number(duration));
  const spawnInvalid =
    submitted && !isSpawnIntervalValid(Number(spawnInterval));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSaveError(false);
    const nextOptions = {
      sessionDuration: Number(duration),
      enemySpawnInterval: Number(spawnInterval),
    };
    if (!isDurationValid(nextOptions.sessionDuration)) {
      durationInput.current?.focus();
      return;
    }
    if (!isSpawnIntervalValid(nextOptions.enemySpawnInterval)) {
      spawnInput.current?.focus();
      return;
    }
    try {
      onSave(nextOptions);
    } catch {
      setSaveError(true);
    }
  }

  return (
    <section aria-label="Options" className="menu">
      <h2>Options</h2>
      <form onSubmit={save} noValidate className="options-form">
        <div className="option-field">
          <label htmlFor="session-duration">Game session time</label>
          <input
            autoFocus
            ref={durationInput}
            id="session-duration"
            type="number"
            required
            min={MATCH_CONFIG.minDuration}
            max={MATCH_CONFIG.maxDuration}
            step="1"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            aria-invalid={durationInvalid}
            aria-describedby="duration-help duration-error"
          />
          <span id="duration-help">
            {MATCH_CONFIG.minDuration} to {MATCH_CONFIG.maxDuration} seconds, in
            whole seconds.
          </span>
          <span id="duration-error">
            {durationInvalid && (
              <span role="alert">Enter a whole number from 60 to 180.</span>
            )}
          </span>
        </div>
        <div className="option-field">
          <label htmlFor="spawn-interval">Enemy spawn time</label>
          <input
            ref={spawnInput}
            id="spawn-interval"
            type="number"
            required
            min={OPTIONS_CONFIG.minSpawnInterval}
            max={OPTIONS_CONFIG.maxSpawnInterval}
            step="1"
            value={spawnInterval}
            onChange={(event) => setSpawnInterval(event.target.value)}
            aria-invalid={spawnInvalid}
            aria-describedby="spawn-help spawn-error"
          />
          <span id="spawn-help">
            {OPTIONS_CONFIG.minSpawnInterval} to{' '}
            {OPTIONS_CONFIG.maxSpawnInterval} seconds, in whole seconds.
          </span>
          <span id="spawn-error">
            {spawnInvalid && (
              <span role="alert">Enter a whole number from 1 to 30.</span>
            )}
          </span>
        </div>
        {saveError && <p role="alert">Unable to save options. Try again.</p>}
        <div className="menu-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </form>
    </section>
  );
}
