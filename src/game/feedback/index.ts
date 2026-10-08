import { createAudioChannel } from '../support/audio';
import type { ArenaView } from '../arena/types';
import { createCombatFeedback } from './combat';
import { createMatchFeedback } from './match';
import { createMovementFeedback } from './movement';
import { createViewFeedback } from './views';

export function createGameFeedback(arena: ArenaView) {
  const views = createViewFeedback(arena);
  const audio = createAudioChannel();
  const combat = createCombatFeedback(arena, audio, views);
  const movement = createMovementFeedback(audio);
  const match = createMatchFeedback(audio);

  function destroy() {
    audio.destroy();
    views.destroy();
  }

  return {
    ...combat,
    ...movement,
    ...match,
    updateEffects: views.updateEffects,
    syncViews: views.syncViews,
    resizeProjectiles: views.resizeProjectiles,
    destroy,
  };
}
