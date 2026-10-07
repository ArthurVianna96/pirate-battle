import { playInterfaceSound } from '../audio';
import type { FeedbackAudio } from './types';

export function createMatchFeedback(audio: FeedbackAudio) {
  function startAmbience() {
    void audio.play('ocean_ambience_loop', 0.12, true);
  }

  startAmbience();
  return {
    setPaused(paused: boolean) {
      if (paused) {
        audio.stopAll();
      } else {
        startAmbience();
      }
      playInterfaceSound(paused ? 'game_pause' : 'game_resume');
    },
    score() {
      void audio.play('score_point', 0.2);
    },
    time(remainingSeconds: number) {
      if (remainingSeconds === 10) {
        void audio.play('time_warning');
      }
    },
    finish() {
      audio.stopLoop('ocean_ambience_loop');
      audio.stopLoop('ship_sailing_loop');
    },
  };
}
