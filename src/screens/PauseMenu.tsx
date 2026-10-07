import { useState } from 'react';
import { PauseScreen } from '../game/PauseScreen';
import type { GameOptions } from '../game/support/options';
import { OptionsScreen } from './OptionsScreen';

interface PauseMenuProps {
  options: GameOptions;
  onSaveOptions: (options: GameOptions) => void;
  onResume: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({
  options,
  onSaveOptions,
  onResume,
  onMainMenu,
}: PauseMenuProps) {
  const [showOptions, setShowOptions] = useState(false);

  function saveOptions(nextOptions: GameOptions) {
    onSaveOptions(nextOptions);
    setShowOptions(false);
  }

  return (
    <PauseScreen>
      {showOptions ? (
        <OptionsScreen options={options} onSave={saveOptions} />
      ) : (
        <section className="menu pause-menu">
          <h2>Paused</h2>
          <p>Ready when you are.</p>
          <p className="sr-only" role="status">
            Game paused. Select Resume to continue.
          </p>
          <div className="menu-actions">
            <button autoFocus onClick={onResume}>
              Resume
            </button>
            <button onClick={() => setShowOptions(true)}>Options</button>
            <button onClick={onMainMenu}>Main Menu</button>
          </div>
        </section>
      )}
    </PauseScreen>
  );
}
