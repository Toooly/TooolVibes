"use client";

import { useEffect, useRef } from "react";

import {
  MUSIC_CHANGE_EVENT,
  MUSIC_STORAGE_KEY,
} from "@/lib/config/sound";

const LOOP_SECONDS = 8;
const MASTER_VOLUME = 0.044;
const NOTE_NAMES = {
  cSharp4: 277.18,
  e4: 329.63,
  fSharp4: 369.99,
  gSharp4: 415.3,
  b4: 493.88,
  cSharp5: 554.37,
  e5: 659.25,
  fSharp5: 739.99,
  gSharp5: 830.61,
};

type MusicChangeDetail = {
  enabled?: boolean;
};

function getInitialMusicEnabled() {
  try {
    return window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function createAudioContext() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

class TooolVibesMusicEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private loopTimer: number | null = null;
  private readonly sustainedNodes: AudioScheduledSourceNode[] = [];

  constructor(context: AudioContext) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0.0001;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -34;
    compressor.knee.value = 24;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.32;

    this.master.connect(compressor);
    compressor.connect(context.destination);
  }

  async start() {
    await this.context.resume();
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(MASTER_VOLUME, now + 1.2);
    this.startDrone(now);
    this.scheduleLoop(now + 0.08);
    this.loopTimer = window.setInterval(() => {
      this.scheduleLoop(this.context.currentTime + 0.08);
    }, LOOP_SECONDS * 1000);
  }

  stop() {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.0001, now, 0.18);
    window.setTimeout(() => {
      this.sustainedNodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          // The node may already be stopped by the browser scheduler.
        }
      });
      void this.context.close();
    }, 420);
  }

  private startDrone(startTime: number) {
    const droneFrequencies = [NOTE_NAMES.cSharp4 / 2, NOTE_NAMES.gSharp4 / 2];

    droneFrequencies.forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.detune.setValueAtTime(index === 0 ? -4 : 6, startTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(index === 0 ? 420 : 620, startTime);
      filter.Q.value = 0.48;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.16 : 0.1, startTime + 2.6);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      oscillator.start(startTime);
      this.sustainedNodes.push(oscillator);
    });
  }

  private scheduleLoop(baseTime: number) {
    const chords = [
      [NOTE_NAMES.cSharp4, NOTE_NAMES.e4, NOTE_NAMES.gSharp4],
      [NOTE_NAMES.b4 / 2, NOTE_NAMES.e4, NOTE_NAMES.gSharp4],
      [NOTE_NAMES.fSharp4, NOTE_NAMES.gSharp4, NOTE_NAMES.cSharp5],
      [NOTE_NAMES.e4, NOTE_NAMES.gSharp4, NOTE_NAMES.b4],
    ];

    chords.forEach((chord, index) => {
      this.playPad(baseTime + index * 2, chord, 2.6);
    });

    const pulseLine = [
      NOTE_NAMES.cSharp5,
      NOTE_NAMES.e5,
      NOTE_NAMES.gSharp5,
      NOTE_NAMES.fSharp5,
      NOTE_NAMES.e5,
      NOTE_NAMES.b4,
      NOTE_NAMES.cSharp5,
      NOTE_NAMES.gSharp4,
    ];

    pulseLine.forEach((frequency, index) => {
      this.playPulse(baseTime + index * 0.5 + 0.12, frequency, index % 2 === 0 ? -0.24 : 0.24);
    });
  }

  private playPad(time: number, frequencies: number[], duration: number) {
    frequencies.forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime((index - 1) * 5, time);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(860 + index * 90, time);
      filter.Q.value = 0.58;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.055, time + 0.55);
      gain.gain.setTargetAtTime(0.0001, time + duration - 0.75, 0.42);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.45);
    });
  }

  private playPulse(time: number, frequency: number, panValue: number) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const panner = this.context.createStereoPanner();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.996, time + 0.18);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency * 2.04, time);
    filter.Q.value = 5.5;
    panner.pan.setValueAtTime(panValue, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.11, time + 0.028);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.36);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + 0.42);
  }
}

export function MusicAmbienceLayer() {
  const engineRef = useRef<TooolVibesMusicEngine | null>(null);

  useEffect(() => {
    let disposed = false;

    async function setMusicEnabled(enabled: boolean) {
      if (!enabled) {
        engineRef.current?.stop();
        engineRef.current = null;
        return;
      }

      if (engineRef.current) {
        return;
      }

      const context = createAudioContext();
      if (!context || disposed) {
        return;
      }

      const engine = new TooolVibesMusicEngine(context);
      engineRef.current = engine;
      await engine.start();
    }

    function handleMusicChange(event: Event) {
      const musicChange = event as CustomEvent<MusicChangeDetail>;
      void setMusicEnabled(musicChange.detail?.enabled === true);
    }

    function startStoredMusicOnce() {
      if (getInitialMusicEnabled()) {
        void setMusicEnabled(true);
      }
      window.removeEventListener("pointerdown", startStoredMusicOnce);
      window.removeEventListener("keydown", startStoredMusicOnce);
    }

    window.addEventListener(MUSIC_CHANGE_EVENT, handleMusicChange);

    if (getInitialMusicEnabled()) {
      window.addEventListener("pointerdown", startStoredMusicOnce, { once: true });
      window.addEventListener("keydown", startStoredMusicOnce, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener(MUSIC_CHANGE_EVENT, handleMusicChange);
      window.removeEventListener("pointerdown", startStoredMusicOnce);
      window.removeEventListener("keydown", startStoredMusicOnce);
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  return null;
}
