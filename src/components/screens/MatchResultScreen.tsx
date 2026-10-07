import type { MatchResult } from '../../game/mechanics/match';

interface MatchResultProps {
  result: MatchResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  saveFailed?: boolean;
}

export function MatchResultScreen({
  result,
  onPlayAgain,
  onMainMenu,
  saveFailed,
}: MatchResultProps) {
  return (
    <section aria-label="Match result" className="menu">
      <h2>Battle complete</h2>
      <p role="status">
        {result.endReason === 'death' ? 'Ship destroyed.' : 'Time expired.'}
      </p>
      <p className="result-score">Score: {result.score}</p>
      <p>Time played: {result.elapsedSeconds.toFixed(1)}s</p>
      {saveFailed && (
        <p role="alert">
          Could not save this result. It will be lost on refresh.
        </p>
      )}
      <div className="menu-actions">
        <button autoFocus onClick={onPlayAgain}>
          Play Again
        </button>
        <button onClick={onMainMenu}>Main Menu</button>
      </div>
    </section>
  );
}
