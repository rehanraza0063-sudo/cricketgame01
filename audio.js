/* Procedural sound effects — no copyrighted audio used. */

const SFX = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
  },

  _tone(freq, duration, type, gainStart) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainStart || 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  _noise(duration, gainStart) {
    if (!this.enabled) return;
    this.init();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = gainStart || 0.3;
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  },

  batHit() { this._tone(900, 0.08, 'square', 0.25); this._noise(0.05, 0.15); },
  bounce() { this._tone(220, 0.06, 'sine', 0.15); },
  wicket() { this._tone(120, 0.4, 'sawtooth', 0.3); this._noise(0.2, 0.2); },
  boundary() { this._tone(660, 0.2, 'triangle', 0.2); setTimeout(() => this._tone(880, 0.2, 'triangle', 0.2), 120); },
  six() { this._tone(660, 0.15, 'triangle', 0.25); setTimeout(() => this._tone(880, 0.15, 'triangle', 0.25), 100); setTimeout(() => this._tone(1100, 0.25, 'triangle', 0.25), 200); },
  click() { this._tone(500, 0.05, 'square', 0.1); },
  appeal() { this._tone(300, 0.3, 'sawtooth', 0.15); },
  crowd() { this._noise(0.6, 0.08); }
};
