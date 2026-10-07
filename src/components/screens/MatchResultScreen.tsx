import type { MatchResult } from '../../game/mechanics/match';

interface MatchResultProps {
  result: MatchResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  saveFailed?: boolean;
  registrationStatus: 'idle' | 'pending' | 'error' | 'success';
  onRetryRegistration: () => void;
}

export function MatchResultScreen({
  result,
  onPlayAgain,
  onMainMenu,
  saveFailed,
  registrationStatus,
  onRetryRegistration,
}: MatchResultProps) {
  return (
    <section aria-label="Match result" className="menu">
      <h2>Battle complete</h2>
      <p role="status">
        {result.endReason === 'death' ? 'Ship destroyed.' : 'Time expired.'}
      </p>
      <p className="result-score">Score: {result.score}</p>
      <p>Time played: {result.elapsedSeconds.toFixed(1)}s</p>
      {registrationStatus === 'pending' && (
        <p role="status">Recording match…</p>
      )}
      {registrationStatus === 'success' && <p role="status">Match recorded.</p>}
      {registrationStatus === 'error' && (
        <div role="alert">
          <p>Could not record this match. You can still play.</p>
          <button onClick={onRetryRegistration}>Retry registration</button>
        </div>
      )}
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
