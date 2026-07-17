/* ═══════════════════════════════════════════════════════════════
   ambient-drone — drone ambient con lifecycle isolato (B26).
   init/setVolume/setMuted/stop invariati dal monolite
   interaction-sound-layer-v2; nessuna dipendenza React.
   ═══════════════════════════════════════════════════════════════ */

export class AmbientDrone {
  context: AudioContext | null = null;
  masterGain: GainNode | null = null;
  oscillators: OscillatorNode[] = [];
  filter: BiquadFilterNode | null = null;
  lfo: OscillatorNode | null = null;
  lfoGain: GainNode | null = null;
  running = false;
  baseVolume = 0.004;

  init(ctx: AudioContext) {
    if (this.running) return;
    this.context = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.baseVolume;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 280;
    this.filter.Q.value = 0.6;

    const freqs = [55, 82.5, 110, 165];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 1 / freqs.length;
      osc.connect(g);
      g.connect(this.filter!);
      osc.start();
      this.oscillators.push(osc);
    });

    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = 0.07;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 120;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    this.filter.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
    this.running = true;
  }

  setVolume(v: number) {
    this.baseVolume = v;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        v,
        this.context!.currentTime,
        0.5
      );
    }
  }

  setMuted(muted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0.0001 : this.baseVolume,
        this.context!.currentTime,
        muted ? 0.3 : 1.2
      );
    }
  }

  stop() {
    this.oscillators.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        /* noop */
      }
    });
    this.oscillators = [];
    try {
      this.lfo?.stop();
      this.lfo?.disconnect();
    } catch {
      /* noop */
    }
    try {
      this.filter?.disconnect();
      this.masterGain?.disconnect();
    } catch {
      /* noop */
    }
    this.running = false;
  }
}
