import { PauseModal } from '../game/PauseModal';

export function RotatePrompt({
  onContinue,
  onMainMenu,
}: {
  onContinue: () => void;
  onMainMenu: () => void;
}) {
  return (
    <PauseModal label="Rotate your phone">
      <section className="menu pause-menu">
        <h2>Rotate your phone to play</h2>
        <p>Landscape gives you a larger view of the battle.</p>
        <p role="status">The game is paused while you rotate.</p>
        <div className="menu-actions">
          <button onClick={onContinue}>Continue in portrait</button>
          <button onClick={onMainMenu}>Main Menu</button>
        </div>
      </section>
    </PauseModal>
  );
}
