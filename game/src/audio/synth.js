// Procedural Web Audio: engine hum, police siren, helicopter rotor,
// gunshots, and three synthwave radio stations. No audio files, no network.
// Audio starts only after a user gesture; screenshot mode stays silent.
import { RADIO } from '../core/config.js';

export class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.station = 0;
    this.engineOsc = null;
    this.engineGain = null;
    this.radioTimer = null;
    this.step = 0;
  }
  ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      return true;
    } catch { return false; }
  }
  unlock() { if (this.ensure() && this.ctx.state === 'suspended') this.ctx.resume(); }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }
  setStation(i) {
    this.station = ((i % RADIO.length) + RADIO.length) % RADIO.length;
    return RADIO[this.station];
  }
  // Engine: two detuned saws whose pitch follows speed.
  engine(speed01) {
    if (!this.ctx || this.muted) return;
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.04;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 700;
      this.engineOsc.connect(filt); filt.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
    }
    this.engineOsc.frequency.value = 55 + speed01 * 165;
    this.engineGain.gain.value = 0.03 + speed01 * 0.05;
  }
  siren(on) {
    if (!this.ctx || this.muted) return;
    if (on && !this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0.05;
      this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.master);
      this.sirenOsc.start();
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.frequency.value = 0.7;
      const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 320;
      this.sirenLfo.connect(lfoGain); lfoGain.connect(this.sirenOsc.frequency);
      this.sirenOsc.frequency.value = 780;
      this.sirenLfo.start();
    }
    if (!on && this.sirenOsc) {
      try { this.sirenOsc.stop(); this.sirenLfo.stop(); } catch { /* already stopped */ }
      this.sirenOsc = null; this.sirenLfo = null;
    }
  }
  gunshot() {
    if (!this.ctx || this.muted) return;
    const dur = 0.14;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = 0.35;
    src.connect(g); g.connect(this.master); src.start();
  }
  // Radio: a tiny step sequencer — bass root notes + sparkle arp, per station.
  radioTick() {
    if (!this.ctx || this.muted) return;
    const roots = [55, 65.41, 49, 58.27];
    const scales = [[220, 261.6, 329.6, 392], [207.6, 246.9, 311.1, 370], [233.1, 277.2, 349.2, 415.3]];
    const root = roots[(this.step >> 2) % 4];
    const arp = scales[this.station][this.step % 4];
    this.blip(root, 0.22, 'sawtooth', 0.1);
    if (this.step % 2 === 0) this.blip(arp * 2, 0.12, 'square', 0.045);
    this.step++;
  }
  blip(freq, dur, type, vol) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  startRadio() {
    if (!this.ctx || this.radioTimer) return;
    this.radioTimer = setInterval(() => this.radioTick(), 240);
  }
  stopRadio() {
    if (this.radioTimer) { clearInterval(this.radioTimer); this.radioTimer = null; }
  }
}
