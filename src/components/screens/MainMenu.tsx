import titleImage from '../../../assets/png/retina/ui/menu/title_pirate_battle.png';
import playerImage from '../../../assets/png/default/ships/ship_1.png';

export function MainMenu({
  onPlay,
  onOptions,
}: {
  onPlay: () => void;
  onOptions: () => void;
}) {
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
        W / ↑ move · A / D turn
        <br />
        Space fires forward · Q / E fire left / right
      </p>
    </section>
  );
}
