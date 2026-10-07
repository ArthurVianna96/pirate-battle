const SOUND_URLS = import.meta.glob('../../assets/sounds/*.wav', {
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

let context: AudioContext | undefined;
const buffers = new Map<SoundName, Promise<AudioBuffer>>();

export function unlockAudio() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    // Audio support or browser permissions must not prevent gameplay.
  }
}

async function loadSound(name: SoundName) {
  if (!context) return undefined;
  let buffer = buffers.get(name);
  if (!buffer) {
    const audioContext = context;
    buffer = fetch(SOUND_URLS[`../../assets/sounds/${name}.wav`])
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load sound');
        return response.arrayBuffer();
      })
      .then((data) => audioContext.decodeAudioData(data));
    buffers.set(name, buffer);
  }
  return buffer;
}

export function createAudioChannel() {
  const voices = new Set<AudioBufferSourceNode>();
  const loops = new Map<SoundName, { source?: AudioBufferSourceNode }>();
  let generation = 0;
  let destroyed = false;

  async function play(name: SoundName, volume = 0.35, loop = false) {
    if (destroyed || !context || (loop && loops.has(name))) return;
    const loopState: { source?: AudioBufferSourceNode } = {};
    if (loop) loops.set(name, loopState);
    const requestGeneration = generation;
    try {
      const buffer = await loadSound(name);
      if (
        !buffer ||
        destroyed ||
        requestGeneration !== generation ||
        (loop && loops.get(name) !== loopState)
      )
        return;
      if (voices.size >= 24) {
        if (loop) loops.delete(name);
        return;
      }
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = loop;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(context.destination);
      voices.add(source);
      if (loop) loopState.source = source;
      source.onended = () => {
        voices.delete(source);
        source.disconnect();
        gain.disconnect();
      };
      source.start();
    } catch {
      buffers.delete(name);
      if (loop && loops.get(name) === loopState) loops.delete(name);
    }
  }

  function stopLoop(name: SoundName) {
    const source = loops.get(name);
    loops.delete(name);
    source?.source?.stop();
  }

  function stopAll() {
    generation++;
    for (const source of voices) source.stop();
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
