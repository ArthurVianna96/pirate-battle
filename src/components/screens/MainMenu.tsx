import { useState, type ReactNode } from 'react';
import titleImage from '../../../assets/png/retina/ui/menu/title_pirate_battle.png';
import playerImage from '../../../assets/png/default/ships/ship_2.png';
import type { GameOptions } from '../../game/support/options';
import { CaptainsLog, type LogTab } from './CaptainsLog';

interface MainMenuProps {
  onPlay: () => void;
  onOptions: () => void;
  options: GameOptions;
  playerId: string;
  playerName: string;
  registrationNotice: ReactNode;
}

export function MainMenu({
  onPlay,
  onOptions,
  options,
  playerId,
  playerName,
  registrationNotice,
}: MainMenuProps) {
  const [logTab, setLogTab] = useState<LogTab | undefined>();

  if (logTab) {
    return (
      <CaptainsLog
        tab={logTab}
        onTabChange={setLogTab}
        options={options}
        playerId={playerId}
        playerName={playerName}
        onMainMenu={() => setLogTab(undefined)}
        registrationNotice={registrationNotice}
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
        <button autoFocus onClick={onPlay}>
          Play
        </button>
        <button onClick={onOptions}>Options</button>
      </div>
      <img className="menu-ship" src={playerImage} alt="" />
      <p>Navigate the islands. Survive the battle.</p>
      <p className="controls-help">
        W or Up move. A or D turn. Space fires forward. Q or E fire left or
        right.
      </p>
      <div className="log-links">
        <button
          className="secondary-button"
          onClick={() => setLogTab('Ranking')}
        >
          Ranking
        </button>
        <button
          className="secondary-button"
          onClick={() => setLogTab('Match History')}
        >
          Match History
        </button>
      </div>
      {registrationNotice}
    </section>
  );
}
