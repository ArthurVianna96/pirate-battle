import type { createAudioChannel } from '../audio';
import type { createViewFeedback } from './views';

export type FeedbackAudio = ReturnType<typeof createAudioChannel>;
export type FeedbackViews = ReturnType<typeof createViewFeedback>;
