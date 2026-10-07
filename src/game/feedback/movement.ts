import type { FeedbackAudio } from './types';

export function createMovementFeedback(audio: FeedbackAudio) {
  return {
    movement(forward: boolean) {
      if (forward) {
        void audio.play('ship_sailing_loop', 0.08, true);
      } else {
        audio.stopLoop('ship_sailing_loop');
      }
    },
  };
}
