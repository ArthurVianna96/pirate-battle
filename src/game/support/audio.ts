const SOUND_URLS = import.meta.glob('../../../assets/sounds/*.wav', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export type SoundName =
  | 'ocean_ambience_loop'
  | 'ship_sailing_loop'
  | 'cannon_fire_1'
  | 'cannon_broadside'
  | 'ship_wood_hit_1'
  | 'ship_collision'
  | 'ship_explosion_1'
  | 'score_point'
  | 'health_low'
  | 'time_warning'
  | 'game_start'
  | 'game_pause'
  | 'game_resume'
  | 'game_over'
  | 'game_complete'
  | 'ui_click'
  | 'ui_hover';

const AUDIO_CONFIG = { maxVoices: 24 } as const;

interface AudioLoop {
  source?: AudioBufferSourceNode;
}

let context: AudioContext | undefined;
const buffers = new Map<SoundName, Promise<AudioBuffer>>();
const soundFiles = new Map<SoundName, Promise<ArrayBuffer>>();

export function preloadSounds() {
  for (const path of Object.keys(SOUND_URLS)) {
    const name = path.split('/').pop()!.replace('.wav', '') as SoundName;
    void loadSoundFile(name).catch(() => {});
  }
}

export function unlockAudio() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    // Audio support or browser permissions must not prevent gameplay.
  }
}

async function fetchSoundFile(name: SoundName) {
  const response = await fetch(
    SOUND_URLS[`../../../assets/sounds/${name}.wav`],
  );
  if (!response.ok) {
    throw new Error('Unable to load sound');
  }
  return response.arrayBuffer();
}

function loadSoundFile(name: SoundName) {
  let file = soundFiles.get(name);
  if (!file) {
    file = fetchSoundFile(name).catch((error: unknown) => {
      soundFiles.delete(name);
      throw error;
    });
    soundFiles.set(name, file);
  }
  return file;
}

async function fetchSound(name: SoundName, audioContext: AudioContext) {
  const data = await loadSoundFile(name);
  return audioContext.decodeAudioData(data.slice(0));
}

function loadSound(name: SoundName) {
  if (!context) {
    return undefined;
  }
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = fetchSound(name, context);
    buffers.set(name, buffer);
  }
  return buffer;
}

export function createAudioChannel() {
  const voices = new Set<AudioBufferSourceNode>();
  const loops = new Map<SoundName, AudioLoop>();
  let generation = 0;
  let destroyed = false;

  function startVoice(
    buffer: AudioBuffer,
    volume: number,
    loopState?: AudioLoop,
  ) {
    if (!context) {
      return;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = !!loopState;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    voices.add(source);
    if (loopState) {
      loopState.source = source;
    }
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }

  function isCurrentRequest(
    requestGeneration: number,
    name: SoundName,
    loopState?: AudioLoop,
  ) {
    if (destroyed || requestGeneration !== generation) {
      return false;
    }
    return !loopState || loops.get(name) === loopState;
  }

  function clearPendingLoop(name: SoundName, loopState?: AudioLoop) {
    if (loopState && loops.get(name) === loopState) {
      loops.delete(name);
    }
  }

  async function play(name: SoundName, volume = 0.35, loop = false) {
    if (destroyed || !context || (loop && loops.has(name))) {
      return;
    }
    const loopState: AudioLoop | undefined = loop ? {} : undefined;
    if (loopState) {
      loops.set(name, loopState);
    }
    const requestGeneration = generation;
    try {
      const buffer = await loadSound(name);
      if (!buffer || !isCurrentRequest(requestGeneration, name, loopState)) {
        return;
      }
      if (voices.size >= AUDIO_CONFIG.maxVoices) {
        clearPendingLoop(name, loopState);
        return;
      }
      startVoice(buffer, volume, loopState);
    } catch {
      buffers.delete(name);
      clearPendingLoop(name, loopState);
    }
  }

  function stopLoop(name: SoundName) {
    const source = loops.get(name);
    loops.delete(name);
    source?.source?.stop();
  }

  function stopAll() {
    generation++;
    for (const source of voices) {
      source.stop();
    }
    voices.clear();
    loops.clear();
  }

  return {
    play,
    stopLoop,
    stopAll,
    destroy() {
      destroyed = true;
      stopAll();
    },
  };
}

const interfaceAudio = createAudioChannel();
export function playInterfaceSound(name: SoundName) {
  unlockAudio();
  void interfaceAudio.play(name, 0.3);
}
