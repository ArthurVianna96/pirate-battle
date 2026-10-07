import { SecondsControl } from './SecondsControl';
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
}

export function OptionsScreen({ options, onSave }: OptionsProps) {
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
    <section aria-label="Options" className="menu options-screen">
      <h2>Options</h2>
      <form onSubmit={save} noValidate className="options-form">
        <SecondsControl
          id="session-duration"
          label="Game session time"
          value={duration}
          min={MATCH_CONFIG.minDuration}
          max={MATCH_CONFIG.maxDuration}
          invalid={durationInvalid}
          autoFocus
          inputRef={durationInput}
          onChange={setDuration}
        />
        <SecondsControl
          id="spawn-interval"
          label="Enemy spawn time"
          value={spawnInterval}
          min={OPTIONS_CONFIG.minSpawnInterval}
          max={OPTIONS_CONFIG.maxSpawnInterval}
          invalid={spawnInvalid}
          inputRef={spawnInput}
          onChange={setSpawnInterval}
        />
        {saveError && <p role="alert">Unable to save options. Try again.</p>}
        <div className="menu-actions">
          <button type="submit">Main Menu</button>
        </div>
      </form>
    </section>
  );
}
