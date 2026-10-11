import assert from 'node:assert/strict';
import test from 'node:test';
import { KnopikSoundEngine } from '../app/sound-engine.ts';

class Param {
  value = 0;
  notes = [];
  ramps = [];
  setValueAtTime(v) { this.notes.push(v); }
  exponentialRampToValueAtTime(v) { this.ramps.push(v); }
  linearRampToValueAtTime(v) { this.ramps.push(v); }
  setTargetAtTime() {}
  cancelScheduledValues() {}
}
class AudioNode {
  gain = new Param();
  frequency = new Param();
  Q = new Param();
  type = '';
  connect(node) { return node; }
  disconnect() {}
  addEventListener() {}
  start() {}
  stop() {}
}
class Context {
  static created = [];
  oscillators = [];
  buffers = [];
  state = 'running';
  currentTime = 0;
  sampleRate = 8000;
  destination = new AudioNode();
  constructor() { Context.created.push(this); }
  createGain() { return new AudioNode(); }
  createBiquadFilter() { return new AudioNode(); }
  createBufferSource() { return new AudioNode(); }
  createOscillator() { const node = new AudioNode(); this.oscillators.push(node); return node; }
  createBuffer(_channels, length) { const samples = new Float32Array(length); this.buffers.push(samples); return { getChannelData: () => samples }; }
  close() { this.state = 'closed'; }
}

test('procedural sounds are SSR-safe and muted sounds allocate no audio context', () => {
  const engine = new KnopikSoundEngine();
  assert.doesNotThrow(() => { engine.tap(); engine.uiPress(); engine.levelUp(); engine.close(); });
  globalThis.window = { AudioContext: Context };
  try {
    Context.created = [];
    const muted = new KnopikSoundEngine({ enabled: false });
    muted.tap(); muted.purchase();
    for (const kind of ['tralalero','ballerina','bombardiro','verity']) for (const cue of ['beat','perfect','collect','hurt','jump','drop']) muted.brainrotCue(kind,cue,1);
    assert.equal(Context.created.length, 0);
  } finally { delete globalThis.window; }
});

test('pixel cues use stepped musical notes and binary noise', () => {
  globalThis.window = { AudioContext: Context };
  try {
    Context.created = [];
    const engine = new KnopikSoundEngine();
    engine.tap(.7);
    for (const cue of ['magnet','rocket','flight','land','boost','slow','flyby','thunder']) engine.runner(cue);
    for (const kind of ['tralalero','ballerina','bombardiro','verity']) for (const cue of ['beat','perfect','collect','hurt','jump','drop']) engine.brainrotCue(kind,cue,2);
    const ctx = Context.created[0];
    assert.ok(ctx.oscillators.length > 0);
    for (const tone of ctx.oscillators) {
      assert.ok(['square','triangle'].includes(tone.type));
      assert.equal(tone.frequency.ramps.length, 0);
      assert.ok(tone.frequency.notes.length > 1);
      for (const frequency of tone.frequency.notes) {
        const note = 12 * Math.log2(frequency / 440);
        assert.ok(Math.abs(note - Math.round(note)) < 1e-8);
      }
    }
    assert.equal(new Set(ctx.buffers[0]).size, 2);
    engine.setEnabled(false);
    const mutedCount = ctx.oscillators.length;
    engine.uiPress();
    assert.equal(ctx.oscillators.length, mutedCount);
    engine.close();
    assert.equal(ctx.state, 'closed');
  } finally { delete globalThis.window; }
});
