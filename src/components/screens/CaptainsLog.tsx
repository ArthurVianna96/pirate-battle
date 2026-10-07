import type { KeyboardEvent } from 'react';
import type { GameOptions } from '../../game/support/options';
import { RankingPanel } from './RankingPanel';
import { MatchHistoryPanel } from './MatchHistoryPanel';

const LOG_TABS = ['Ranking', 'Match History'] as const;
export type LogTab = (typeof LOG_TABS)[number];

interface CaptainsLogProps {
  tab: LogTab;
  onTabChange: (tab: LogTab) => void;
  options: GameOptions;
  playerId: string;
  playerName: string;
  onMainMenu: () => void;
}

export function CaptainsLog({
  tab,
  onTabChange,
  options,
  playerId,
  playerName,
  onMainMenu,
}: CaptainsLogProps) {
  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    let next: LogTab;
    if (event.key === 'Home') {
      next = 'Ranking';
    } else if (event.key === 'End') {
      next = 'Match History';
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      next = tab === 'Ranking' ? 'Match History' : 'Ranking';
    } else {
      return;
    }
    event.preventDefault();
    onTabChange(next);
    const buttons =
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[LOG_TABS.indexOf(next)]?.focus();
  }

  return (
    <section className="menu captains-log" aria-label="Captain's Log">
      <h2>Captain's Log</h2>
      <div
        role="tablist"
        aria-label="Captain's Log sections"
        className="log-tabs"
        onKeyDown={navigateTabs}
      >
        {LOG_TABS.map((name, index) => (
          <button
            key={name}
            role="tab"
            id={`log-tab-${index}`}
            aria-controls={`log-panel-${index}`}
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            autoFocus={tab === name}
            className={tab === name ? undefined : 'secondary-button'}
            onClick={() => onTabChange(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`log-panel-${LOG_TABS.indexOf(tab)}`}
        aria-labelledby={`log-tab-${LOG_TABS.indexOf(tab)}`}
        className="log-panel"
      >
        {tab === 'Ranking' ? (
          <RankingPanel options={options} playerId={playerId} />
        ) : (
          <MatchHistoryPanel playerId={playerId} playerName={playerName} />
        )}
      </div>
      <button className="log-back-button" onClick={onMainMenu}>
        Main Menu
      </button>
    </section>
  );
}
