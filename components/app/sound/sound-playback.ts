import {
  SOUND_PROFILES,
  type SoundKind,
  type SoundProfile,
  type SoundStep,
} from "./sound-profiles";

/* ═══════════════════════════════════════════════════════════════
   sound-playback — playback engine puro (B26).
   Scheduling oscillator/noise su un AudioContext fornito:
   nessuno stato, nessun listener. Estratto invariato dal
   monolite interaction-sound-layer-v2.
   ═══════════════════════════════════════════════════════════════ */

export function scheduleStep(
  context: AudioContext,
  output: AudioNode,
  now: number,
  step: SoundStep
) {
  const start = now + step.at;
  const attack = Math.min(0.018, step.duration * 0.32);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = step.type ?? "sine";
  oscillator.frequency.setValueAtTime(step.frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    step.endFrequency ?? step.frequency,
    start + step.duration
  );
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(
    step.volume,
    start + attack
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + step.duration
  );
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + step.duration + 0.025);
}

export function scheduleNoise(
  context: AudioContext,
  output: AudioNode,
  now: number,
  profile: NonNullable<SoundProfile["noise"]>
) {
  const sampleRate = context.sampleRate;
  const frameCount = Math.max(
    1,
    Math.floor(sampleRate * profile.duration)
  );
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] =
      (Math.random() * 2 - 1) * (1 - index / frameCount);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = now + profile.at;
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(profile.frequency, start);
  filter.Q.setValueAtTime(profile.q, start);
  gain.gain.setValueAtTime(profile.volume, start);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + profile.duration
  );
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(start);
  source.stop(start + profile.duration + 0.01);
}

export function playTone(context: AudioContext, kind: SoundKind) {
  const now = context.currentTime;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const profile = SOUND_PROFILES[kind];
  const tail = Math.max(
    ...profile.steps.map((step) => step.at + step.duration),
    profile.noise
      ? profile.noise.at + profile.noise.duration
      : 0
  );
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.filterStart, now);
  filter.frequency.exponentialRampToValueAtTime(
    profile.filterEnd,
    now + tail + 0.04
  );
  master.gain.setValueAtTime(0.72, now);
  master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + tail + 0.08
  );
  filter.connect(master);
  master.connect(context.destination);
  profile.steps.forEach((step) =>
    scheduleStep(context, filter, now, step)
  );
  if (profile.noise) {
    scheduleNoise(context, filter, now, profile.noise);
  }
  window.setTimeout(() => {
    filter.disconnect();
    master.disconnect();
  }, (tail + 0.14) * 1000);
}
