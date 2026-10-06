import { useRef, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';

export function App() {
  const [playing, setPlaying] = useState(false);
  const playButton = useRef<HTMLButtonElement>(null);

  function leaveGame() {
    setPlaying(false);
    requestAnimationFrame(() => playButton.current?.focus());
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Pirate Battle</p>
        <h1>Set sail</h1>
      </header>
      {playing ? (
        <section aria-label="Game">
          <div className="toolbar">
            <h2>Arena</h2>
            <button autoFocus onClick={leaveGame}>
              Main Menu
            </button>
          </div>
          <GameCanvas />
        </section>
      ) : (
        <section aria-label="Main menu" className="menu">
          <p>Your voyage starts here.</p>
          <button ref={playButton} onClick={() => setPlaying(true)}>
            Play
          </button>
        </section>
      )}
    </main>
  );
}
