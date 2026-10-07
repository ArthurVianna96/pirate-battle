import { useState, useSyncExternalStore } from 'react';

const PORTRAIT_TOUCH_QUERY = '(pointer: coarse) and (orientation: portrait)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(PORTRAIT_TOUCH_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function isPortraitTouchScreen() {
  return window.matchMedia(PORTRAIT_TOUCH_QUERY).matches;
}

export function usePortraitPrompt() {
  const portrait = useSyncExternalStore(subscribe, isPortraitTouchScreen);
  const [portraitAllowed, setPortraitAllowed] = useState(false);

  return {
    shouldPrompt: portrait && !portraitAllowed,
    allowPortrait: () => setPortraitAllowed(true),
  };
}
