import type { RunnerPhase, RunnerSound } from "./runner-engine";
import type { BrainrotKind } from "./drink-game-engine";
import type { BrainrotSound } from "./brainrot-engine";

type UltraStopResult = "success" | "overheat" | "cancel";
type UltraVoice = {
    noise: AudioBufferSourceNode;
    flame: OscillatorNode;
    rumble: OscillatorNode;
    lfo: OscillatorNode;
    output: GainNode;
    nodes: AudioNode[];
};
type WebkitWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};
/**
 * Small procedural sound engine for KNOPIK GO.
 * AudioContext is created only after the first call, so importing is SSR-safe.
 */
export class KnopikSoundEngine {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private noise: AudioBuffer | null = null;
    private ultra: UltraVoice | null = null;
    private enabled = true;
    private volume = 0.72;
    private lastUltraPulse = 0;
    private runnerTrack: HTMLAudioElement | null = null;
    private runnerTrackSource: MediaElementAudioSourceNode | null = null;
    private runnerTrackGain: GainNode | null = null;
    private runnerTrackPhase: RunnerPhase = "ready";
    constructor(options?: {
        enabled?: boolean;
        volume?: number;
    }) {
        this.enabled = options?.enabled ?? true;
        this.volume = clamp(options?.volume ?? 0.72, 0, 1);
    }
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled)
            this.disposeUltra(0.04);
        this.setRunnerMusicPhase(this.runnerTrackPhase);
    }
    setVolume(volume: number) {
        this.volume = clamp(volume, 0, 1);
        if (!this.context || !this.master)
            return;
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.volume, now, 0.025);
    }
    /** Call from a pointer/touch event to satisfy mobile autoplay policies. */
    unlock() {
        const ctx = this.getContext();
        if (ctx?.state === "suspended")
            void ctx.resume();
    }
    tap(intensity = 0.5) {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const force = clamp(intensity, 0, 1);
        this.tonalHit(now, {
            type: "triangle",
            from: 178 + force * 55,
            to: 92 + force * 18,
            duration: 0.085,
            gain: 0.045 + force * 0.025,
        });
        this.tonalHit(now + 0.006, {
            type: "sine",
            from: 520 + force * 140,
            to: 250 + force * 55,
            duration: 0.045,
            gain: 0.018 + force * 0.012,
        });
        this.noiseHit(now, 0.055, 950 + force * 850, 2.4, 0.028 + force * 0.014);
        this.tonalHit(now + 0.012, {
            type: "sine",
            from: 1150 + force * 420,
            to: 760 + force * 180,
            duration: 0.032,
            gain: 0.01 + force * 0.008,
            attack: 0.002,
        });
    }
    /** Quiet tactile click shared by ordinary interface controls. */
    uiPress() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.tonalHit(now, {
            type: "sine",
            from: 520,
            to: 390,
            duration: 0.045,
            gain: 0.018,
            attack: 0.002,
        });
        this.noiseHit(now, 0.026, 2300, 4.2, 0.011);
    }
    nav(direction = 0) {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const base = 360 + clamp(direction, -1, 1) * 45;
        this.tonalHit(now, {
            type: "sine",
            from: base,
            to: base * 1.34,
            duration: 0.12,
            gain: 0.028,
            attack: 0.004,
        });
        this.tonalHit(now + 0.035, {
            type: "triangle",
            from: base * 1.48,
            to: base * 1.2,
            duration: 0.1,
            gain: 0.016,
            attack: 0.003,
        });
    }
    purchase() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.noiseHit(now, 0.08, 1900, 3.4, 0.025);
        [440, 554.37, 659.25].forEach((frequency, index) => {
            this.tonalHit(now + index * 0.055, {
                type: index === 1 ? "triangle" : "sine",
                from: frequency,
                to: frequency * 1.025,
                duration: 0.24,
                gain: 0.027 - index * 0.003,
                attack: 0.006,
            });
        });
    }
    caseCharge() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 1.05, 180, 3600, 0.055);
        this.tonalHit(now, {
            type: "sawtooth",
            from: 72,
            to: 148,
            duration: 1.04,
            gain: 0.04,
            attack: 0.08,
            lowpass: 680,
        });
        [0, .22, .44, .66, .84].forEach((offset, index) => {
            this.tonalHit(now + offset, {
                type: "triangle",
                from: 240 + index * 75,
                to: 170 + index * 58,
                duration: .1,
                gain: .022 + index * .003,
                attack: .004,
            });
        });
    }
    itemUse(kind: "food" | "drink" = "food") {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        if (kind === "drink") {
            this.filteredSweep(now, 0.28, 780, 3300, 0.032);
            this.noiseHit(now, 0.17, 2650, 4.2, 0.03);
            this.tonalHit(now + 0.045, {
                type: "sine",
                from: 420,
                to: 740,
                duration: 0.3,
                gain: 0.03,
                attack: 0.012,
            });
            return;
        }
        this.noiseHit(now, 0.12, 1100, 1.8, 0.038);
        this.tonalHit(now + 0.02, {
            type: "triangle",
            from: 210,
            to: 142,
            duration: 0.18,
            gain: 0.034,
            attack: 0.008,
            lowpass: 720,
        });
    }
    warning(level = 0.65) {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        const danger = clamp(level, 0, 1);
        this.tonalHit(now, {
            type: "sawtooth",
            from: 112 + danger * 24,
            to: 72,
            duration: 0.28,
            gain: 0.035 + danger * 0.025,
            attack: 0.025,
            lowpass: 620,
        });
        this.tonalHit(now + 0.08, {
            type: "triangle",
            from: 170,
            to: 112,
            duration: 0.22,
            gain: 0.03,
            attack: 0.018,
            lowpass: 480,
        });
        this.noiseHit(now + 0.01, 0.24, 430, 1.1, 0.024 + danger * 0.02);
    }
    caseOpen() {
        const ctx = this.ready();
        if (!ctx) return;
        const now = ctx.currentTime;
        this.noiseHit(now, .3, 1200, 1.6, .075);
        this.tonalHit(now, { type: "triangle", from: 100, to: 42, duration: .35, gain: .08 });
        this.filteredSweep(now + .04, .7, 600, 4200, .035);
        [392, 523.25, 659.25, 783.99, 1046.5, 1568].forEach((frequency, index) => {
            this.tonalHit(now + .16 + index * .095, { type: index % 2 ? "triangle" : "square", from: frequency, to: frequency, duration: .32, gain: .024 - index * .002, attack: .006 });
        });
        for (let i = 0; i < 10; i += 1) this.noiseHit(now + .12 + i * .067, .035, 2300 + i * 120, 3, .008);
    }
    bite() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.noiseHit(now + .28, .12, 2400, 2, .035);
        this.tonalHit(now, {
            type: "triangle",
            from: 140,
            to: 780,
            duration: .28,
            gain: .025,
            lowpass: 1600,
        });
        this.tonalHit(now + .28, {
            type: "square",
            from: 1480,
            to: 170,
            duration: .65,
            gain: .035,
            lowpass: 2200,
        });
        this.tonalHit(now + .3, {
            type: "sawtooth",
            from: 980,
            to: 110,
            duration: .55,
            gain: .018,
            lowpass: 1700,
        });
    }
    /** Called from Play: unlock the supplied track through the same mobile audio context. */
    startRunnerMusic() {
        if (!this.enabled) return;
        const ctx = this.getContext();
        if (!ctx || !this.master) return;
        if (!this.runnerTrack) {
            const base = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
            const track = new Audio(`${base}/audio/sahur-chase.mp3`);
            track.loop = true;
            track.preload = "none";
            const gain = ctx.createGain();
            gain.gain.value = 0;
            const source = ctx.createMediaElementSource(track);
            source.connect(gain);
            gain.connect(this.master);
            this.runnerTrack = track;
            this.runnerTrackGain = gain;
            this.runnerTrackSource = source;
        }
        this.runnerTrackGain!.gain.setValueAtTime(0, ctx.currentTime);
        this.runnerTrack.currentTime = 0;
        // Silent playback during the cinematic retains the gesture permission on iPhone.
        void this.runnerTrack.play().catch(() => {});
    }
    setRunnerMusicPhase(phase: RunnerPhase) {
        const previous = this.runnerTrackPhase;
        this.runnerTrackPhase = phase;
        if (phase === "intro" && !this.runnerTrack && this.enabled) this.startRunnerMusic();
        const track = this.runnerTrack, gain = this.runnerTrackGain, ctx = this.context;
        if (!track || !gain || !ctx) return;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(this.enabled && phase === "running" ? .28 : 0, now, .09);
        if (this.enabled && (phase === "running" || phase === "intro")) {
            if (phase === "running" && previous === "intro") track.currentTime = 0;
            if (track.paused) void track.play().catch(() => {});
        } else track.pause();
    }
    stopRunnerMusic() {
        this.runnerTrack?.pause();
        if (this.runnerTrack) { this.runnerTrack.removeAttribute("src"); this.runnerTrack.load(); }
        this.runnerTrackSource?.disconnect();
        this.runnerTrackGain?.disconnect();
        this.runnerTrack = this.runnerTrackSource = this.runnerTrackGain = null;
        this.runnerTrackPhase = "ready";
    }
    runner(kind: RunnerSound, index = 0) {
        const ctx = this.ready();
        if (!ctx) return;
        const now = ctx.currentTime;
        if (kind === "beat") {
            if (this.runnerTrack && !this.runnerTrack.paused && !this.runnerTrack.error) return;
            const melody = [523, 0, 784, 0, 932, 784, 622, 0, 523, 0, 1047, 932, 784, 0, 622, 466];
            const note = melody[index % melody.length];
            if (note) this.tonalHit(now, { type: "square", from: note, to: note, duration: .11, gain: .009, lowpass: 1800 });
            if (index % 4 === 0) this.tonalHit(now, { type: "triangle", from: [131, 104, 117, 98][Math.floor(index / 4) % 4], to: 65, duration: .14, gain: .025 });
            this.noiseHit(now, .025, index % 4 === 2 ? 1700 : 4300, 3, index % 4 === 2 ? .009 : .003);
        } else if (kind === "coin") {
            const note = [1047, 1175, 1319, 1568][index % 4];
            this.tonalHit(now, { type: "square", from: note, to: note * 1.5, duration: .085, gain: .017, lowpass: 4200 });
        } else if (kind === "jump") {
            this.tonalHit(now, { type: "square", from: 210, to: 780, duration: .2, gain: .027, lowpass: 2100 });
        } else if (kind === "roll") {
            this.filteredSweep(now, .25, 1800, 180, .02);
            this.noiseHit(now, .14, 800, 1.6, .028);
        } else if (kind === "left" || kind === "right") {
            this.tonalHit(now, { type: "triangle", from: 430, to: kind === "left" ? 290 : 580, duration: .065, gain: .018 });
        } else if (kind === "magnet") {
            [659, 988, 1319, 1976].forEach((note, i) => this.tonalHit(now + i * .045, { type: "square", from: note, to: note * 1.04, duration: .13, gain: .018 }));
        } else if (kind === "rocket") {
            this.filteredSweep(now, .7, 130, 3300, .025);
            this.noiseHit(now, .42, 1100, 1.8, .028);
            [392, 587, 784, 1175].forEach((note, i) => this.tonalHit(now + .12 + i * .08, { type: "square", from: note, to: note * 1.5, duration: .16, gain: .015 }));
        } else if (kind === "flight") {
            this.noiseHit(now, .21, 1800, 2.5, .008);
            this.tonalHit(now, { type: "triangle", from: 784, to: 880, duration: .16, gain: .006 });
        } else if (kind === "land") {
            this.noiseHit(now, .12, 410, 1.4, .028);
            [392, 523, 784].forEach((note, i) => this.tonalHit(now + .06 + i * .04, { type: "triangle", from: note, to: note, duration: .14, gain: .022 }));
        } else if (kind === "boost" || kind === "slow") {
            const notes = kind === "boost" ? [392, 587, 880, 1319] : [988, 740, 494, 330];
            notes.forEach((note, i) => this.tonalHit(now + i * .055, { type: "square", from: note, to: note, duration: .12, gain: .017 }));
            this.filteredSweep(now, .22, kind === "boost" ? 220 : 1800, kind === "boost" ? 2400 : 170, .017);
        } else if (kind === "flyby") {
            this.noiseHit(now, 1.4, 350, .7, .011);
            this.tonalHit(now, { type: "triangle", from: 165, to: 110, duration: 1.2, gain: .009, lowpass: 900 });
        } else if (kind === "thunder") {
            this.noiseHit(now, .8, 190, .7, .027);
            this.tonalHit(now, { type: "triangle", from: 73, to: 39, duration: .65, gain: .022, lowpass: 250 });
        } else if (kind === "shield") {
            [784, 1047, 1568].forEach((note, i) => this.tonalHit(now + i * .04, { type: "triangle", from: note, to: note * 1.1, duration: .16, gain: .035 }));
            this.noiseHit(now, .1, 2800, 2, .023);
        } else if (kind === "hit") {
            this.noiseHit(now, .22, 560, .9, .065);
            this.tonalHit(now, { type: "sawtooth", from: 190, to: 52, duration: .32, gain: .05, lowpass: 700 });
        } else if (kind === "near") {
            this.tonalHit(now, { type: "triangle", from: 784, to: 1047, duration: .12, gain: .017 });
        } else {
            [523, 622, 784, 1047].forEach((note, i) => this.tonalHit(now + i * .07, { type: "square", from: note, to: note, duration: .18, gain: .018 }));
            for (let i = 0; i < 3; i++) {
                this.tonalHit(now + 1.05 + i * .17, { type: "triangle", from: 130, to: 62, duration: .13, gain: .045 });
                this.noiseHit(now + 1.05 + i * .17, .035, 500, 1.1, .026);
            }
        }
    }
    levelUp() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 0.56, 520, 4200, 0.038);
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
            this.tonalHit(now + index * 0.055, {
                type: index % 2 === 0 ? "sine" : "triangle",
                from: frequency,
                to: frequency * 1.018,
                duration: 0.46,
                gain: 0.035 - index * 0.003,
                attack: 0.012,
            });
        });
    }
    safe() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.tonalHit(now, {
            type: "square",
            from: 118,
            to: 82,
            duration: 0.16,
            gain: 0.065,
            lowpass: 790,
        });
        this.noiseHit(now, 0.11, 1350, 2.1, 0.065);
        [523.25, 659.25, 783.99].forEach((frequency, index) => {
            this.tonalHit(now + 0.1 + index * 0.065, {
                type: "sine",
                from: frequency,
                to: frequency * 1.012,
                duration: 0.3,
                gain: 0.035 - index * 0.004,
                attack: 0.008,
            });
        });
    }
    rest() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 0.72, 1900, 480, 0.052);
        this.tonalHit(now + 0.05, {
            type: "sine",
            from: 246.94,
            to: 196,
            duration: 0.55,
            gain: 0.034,
            attack: 0.06,
        });
        this.tonalHit(now + 0.12, {
            type: "sine",
            from: 185,
            to: 147,
            duration: 0.58,
            gain: 0.025,
            attack: 0.08,
        });
    }
    riskEnter() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 0.34, 260, 1700, 0.036);
        this.tonalHit(now + 0.03, {
            type: "sine",
            from: 164,
            to: 246,
            duration: 0.31,
            gain: 0.038,
            attack: 0.025,
        });
    }
    brainrotCue(kind: BrainrotKind, sound: BrainrotSound, lane = 0) {
        const ctx = this.ready();
        if (!ctx) return;
        const now = ctx.currentTime;
        const base = kind === "ballerina" ? 330 : kind === "tralalero" ? 220 : kind === "verity" ? 261.63 : 164.81;
        if (sound === "beat") {
            const notes = [1, 1.25, 1.5, 1.125, 1, 1.5, 1.25, 2];
            const index = Math.floor(now / .48) % notes.length;
            this.tonalHit(now, { type: "triangle", from: base * notes[index], to: base * notes[index], duration: .16, gain: .018, attack: .006 });
            this.tonalHit(now, { type: "square", from: base / 2, to: base / 2, duration: .08, gain: .007 });
        } else if (sound === "hurt") {
            this.tonalHit(now, { type: "sawtooth", from: 180, to: 65, duration: .2, gain: .032 });
            this.noiseHit(now, .13, 650, 1.5, .024);
        } else if (sound === "drop") {
            this.tonalHit(now, { type: "square", from: 600, to: 180, duration: .15, gain: .018 });
        } else if (sound === "jump") {
            this.tonalHit(now, { type: "triangle", from: 230, to: 780, duration: .18, gain: .025 });
        } else {
            const frequency = base * (sound === "perfect" ? 3 : 2) * [1,1.25,1.5][Math.max(0,Math.min(2,lane))];
            this.tonalHit(now, { type: "square", from: frequency, to: frequency * 1.12, duration: .1, gain: .02 });
            if (sound === "perfect") this.tonalHit(now + .06, { type: "triangle", from: frequency * 1.5, to: frequency * 1.5, duration: .12, gain: .014 });
        }
    }
    memoryNote(pad: number) {
        const ctx = this.ready();
        if (!ctx) return;
        const notes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33];
        const frequency = notes[Math.min(8, Math.max(0, Math.floor(pad)))];
        const now = ctx.currentTime;
        this.tonalHit(now, { type: "square", from: frequency, to: frequency, duration: .14, gain: .055, attack: .003 });
        this.tonalHit(now, { type: "triangle", from: frequency / 2, to: frequency / 2, duration: .1, gain: .035 });
        this.noiseHit(now, .035, 600, 1.8, .018);
    }
    cocoa(kind: "start" | "tick" | "stop" | "win" | "loss", index = 0) {
        const ctx = this.ready();
        if (!ctx) return;
        const now = ctx.currentTime;
        if (kind === "start") {
            this.tonalHit(now, { type: "triangle", from: 110, to: 58, duration: .17, gain: .052 });
            this.noiseHit(now, .1, 950, 1.5, .036);
            this.filteredSweep(now + .1, .65, 180, 1400, .015);
            [392, 523, 659].forEach((note, i) => this.tonalHit(now + .09 + i * .05, { type: "square", from: note, to: note, duration: .075, gain: .012, lowpass: 2600 }));
        } else if (kind === "tick") {
            this.noiseHit(now, .025, 1150 + index % 3 * 280, 2, .009);
            this.tonalHit(now, { type: "triangle", from: 175 + index % 3 * 20, to: 125, duration: .033, gain: .012 });
        } else if (kind === "stop") {
            this.noiseHit(now, .065, 650, 1.2, .042);
            this.tonalHit(now, { type: "triangle", from: 160, to: 64, duration: .1, gain: .04 });
            this.tonalHit(now + .025, { type: "square", from: [659, 784, 1047][index % 3], to: [659, 784, 1047][index % 3], duration: .16, gain: .018, lowpass: 3400 });
        } else if (kind === "win") {
            const notes = index ? [523, 659, 784, 1047, 1319, 1568, 2093] : [523, 659, 784, 1047];
            notes.forEach((note, i) => {
                this.tonalHit(now + i * .085, { type: "square", from: note, to: note, duration: .23, gain: .021, lowpass: 4300 });
                this.tonalHit(now + i * .085, { type: "triangle", from: note / 2, to: note / 2, duration: .18, gain: .022 });
            });
            for (let i = 0; i < 10; i++) this.tonalHit(now + .4 + i * .105, { type: "triangle", from: 1800 + i % 3 * 280, to: 950, duration: .085, gain: .012 });
        } else {
            [330, 262, 196].forEach((note, i) => this.tonalHit(now + i * .11, { type: "triangle", from: note, to: note * .96, duration: .16, gain: .026 }));
        }
    }
    riskTick(edge = false) {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.tonalHit(now, {
            type: "triangle",
            from: edge ? 205 : 520,
            to: edge ? 154 : 350,
            duration: edge ? 0.105 : 0.062,
            gain: edge ? 0.024 : 0.038,
            attack: 0.003,
            lowpass: edge ? 720 : 1900,
        });
        this.noiseHit(now, edge ? 0.055 : 0.034, edge ? 620 : 2100, edge ? 1.4 : 3.2, edge ? 0.014 : 0.02);
    }
    riskSpin() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 4.7, 260, 2800, 0.042);
        this.tonalHit(now, {
            type: "triangle",
            from: 88,
            to: 174,
            duration: 3.8,
            gain: 0.026,
            attack: 0.09,
            lowpass: 1100,
        });
        this.tonalHit(now + 0.1, {
            type: "sine",
            from: 132,
            to: 82,
            duration: 4.9,
            gain: 0.018,
            attack: 0.12,
            lowpass: 620,
        });
    }
    riskSlow() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 0.9, 2400, 360, 0.035);
        this.tonalHit(now, {
            type: "triangle",
            from: 210,
            to: 92,
            duration: 0.82,
            gain: 0.027,
            attack: 0.04,
        });
    }
    riskWin() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.filteredSweep(now, 0.5, 620, 4600, 0.045);
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
            this.tonalHit(now + index * 0.065, {
                type: index % 2 ? "triangle" : "sine",
                from: frequency,
                to: frequency * 1.02,
                duration: 0.42,
                gain: 0.042 - index * 0.005,
                attack: 0.009,
            });
        });
        [1318.5, 1568, 1975.5, 2093].forEach((frequency, index) => {
            this.tonalHit(now + 0.17 + index * 0.038, {
                type: "sine",
                from: frequency,
                to: frequency * 1.08,
                duration: 0.2,
                gain: 0.018 - index * 0.002,
                attack: 0.004,
            });
        });
        this.noiseHit(now + 0.12, 0.32, 3800, 5.2, 0.027);
    }
    riskLose() {
        const ctx = this.ready();
        if (!ctx)
            return;
        const now = ctx.currentTime;
        this.tonalHit(now, {
            type: "sine",
            from: 196,
            to: 108,
            duration: 0.48,
            gain: 0.035,
            attack: 0.035,
        });
        this.noiseHit(now + 0.03, 0.28, 520, 0.9, 0.025);
    }
    /** Starts a continuous, layered fire sound. Safe to call repeatedly. */
    ultraStart() {
        const ctx = this.ready();
        if (!ctx || this.ultra)
            return;
        const now = ctx.currentTime;
        const master = this.master!;
        this.filteredSweep(now, 0.48, 280, 3600, 0.09);
        this.tonalHit(now, {
            type: "sawtooth",
            from: 72,
            to: 154,
            duration: 0.34,
            gain: 0.055,
            attack: 0.025,
            lowpass: 720,
        });
        this.tonalHit(now + 0.055, {
            type: "sine",
            from: 196,
            to: 392,
            duration: 0.52,
            gain: 0.032,
            attack: 0.035,
        });
        const output = ctx.createGain();
        output.gain.setValueAtTime(0.0001, now);
        output.gain.exponentialRampToValueAtTime(0.075, now + 0.26);
        output.connect(master);
        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoise(ctx);
        noise.loop = true;
        const fireBand = ctx.createBiquadFilter();
        fireBand.type = "bandpass";
        fireBand.frequency.setValueAtTime(1250, now);
        fireBand.Q.value = 0.7;
        const fireGain = ctx.createGain();
        fireGain.gain.value = 0.62;
        noise.connect(fireBand).connect(fireGain).connect(output);
        const flame = ctx.createOscillator();
        flame.type = "square";
        flame.frequency.value = 94;
        const flameFilter = ctx.createBiquadFilter();
        flameFilter.type = "lowpass";
        flameFilter.frequency.value = 430;
        const flameGain = ctx.createGain();
        flameGain.gain.value = 0.18;
        flame.connect(flameFilter).connect(flameGain).connect(output);
        const rumble = ctx.createOscillator();
        rumble.type = "triangle";
        rumble.frequency.value = 47;
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.28;
        rumble.connect(rumbleGain).connect(output);
        const lfo = ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 7.3;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.22;
        lfo.connect(lfoGain).connect(fireGain.gain);
        noise.start(now);
        flame.start(now);
        rumble.start(now);
        lfo.start(now);
        this.lastUltraPulse = 0;
        this.ultra = {
            noise,
            flame,
            rumble,
            lfo,
            output,
            nodes: [fireBand, fireGain, flameFilter, flameGain, rumbleGain, lfoGain],
        };
    }
    /** Adds a short ember crackle while ultra mode is charging. */
    ultraPulse(intensity = 0.5) {
        const ctx = this.ready();
        if (!ctx || !this.ultra)
            return;
        const now = ctx.currentTime;
        if (now - this.lastUltraPulse < 0.055)
            return;
        this.lastUltraPulse = now;
        const heat = clamp(intensity, 0, 1);
        this.noiseHit(now, 0.035 + heat * 0.035, 1900 + Math.random() * 2600, 4.5, 0.018 + heat * 0.025);
        if (Math.random() < 0.46 + heat * 0.34) {
            this.tonalHit(now, {
                type: "triangle",
                from: 360 + Math.random() * 420,
                to: 145 + Math.random() * 90,
                duration: 0.045 + Math.random() * 0.045,
                gain: 0.014 + heat * 0.014,
            });
        }
        this.ultra.flame.frequency.setTargetAtTime(94 + heat * 58, now, 0.06);
        this.ultra.rumble.frequency.setTargetAtTime(47 + heat * 13, now, 0.08);
    }
    stopUltraLoop(result: UltraStopResult = "success") {
        const ctx = this.context;
        if (!ctx || !this.ultra)
            return;
        const now = ctx.currentTime;
        this.disposeUltra(result === "overheat" ? 0.075 : 0.16);
        if (result === "success") {
            [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
                this.tonalHit(now + index * 0.055, {
                    type: index % 2 ? "triangle" : "sine",
                    from: frequency,
                    to: frequency * 1.025,
                    duration: 0.42,
                    gain: 0.04 - index * 0.004,
                    attack: 0.012,
                });
            });
            this.filteredSweep(now, 0.28, 780, 3400, 0.045);
        }
        else if (result === "overheat") {
            this.noiseHit(now, 0.62, 560, 0.72, 0.17);
            this.noiseHit(now + 0.018, 0.24, 2300, 2.1, 0.08);
            this.tonalHit(now, {
                type: "sawtooth",
                from: 174,
                to: 36,
                duration: 0.68,
                gain: 0.12,
                lowpass: 690,
            });
        }
    }
    /** Alias convenient for pointer-up handlers. */
    ultraStop(result: UltraStopResult = "success") {
        this.stopUltraLoop(result);
    }
    close() {
        this.disposeUltra(0.02);
        const ctx = this.context;
        this.context = null;
        this.master = null;
        this.noise = null;
        if (ctx && ctx.state !== "closed")
            void ctx.close();
    }
    private ready() {
        if (!this.enabled)
            return null;
        const ctx = this.getContext();
        if (ctx?.state === "suspended")
            void ctx.resume();
        return ctx;
    }
    private getContext() {
        if (this.context)
            return this.context;
        if (typeof window === "undefined")
            return null;
        const AudioContextCtor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
        if (!AudioContextCtor)
            return null;
        const ctx = new AudioContextCtor({ latencyHint: "interactive" });
        const master = ctx.createGain();
        master.gain.value = this.volume;
        master.connect(ctx.destination);
        this.context = ctx;
        this.master = master;
        return ctx;
    }
    private getNoise(ctx: AudioContext) {
        if (this.noise)
            return this.noise;
        const length = Math.floor(ctx.sampleRate * 1.5);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const channel = buffer.getChannelData(0);
        let previous = 0;
        for (let index = 0; index < length; index += 1) {
            const white = Math.random() * 2 - 1;
            previous = previous * 0.72 + white * 0.28;
            channel[index] = (index % 6 === 0 ? (white > 0 ? .7 : -.7) : channel[index - 1]);
        }
        this.noise = buffer;
        return buffer;
    }
    private tonalHit(when: number, options: {
        type: OscillatorType;
        from: number;
        to: number;
        duration: number;
        gain: number;
        attack?: number;
        lowpass?: number;
    }) {
        const ctx = this.context;
        const master = this.master;
        if (!ctx || !master)
            return;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const attack = options.attack ?? 0.004;
        const end = when + options.duration;
        oscillator.type = (options.type === "sine" ? "triangle" : "square");
        const note = (frequency: number) => 440 * Math.pow(2, Math.round(12 * Math.log2(Math.max(1, frequency) / 440)) / 12);
        oscillator.frequency.setValueAtTime(note(options.from), when);
        for (let step = 1; step <= 6; step++)
            oscillator.frequency.setValueAtTime(note(options.from + (options.to - options.from) * step / 6), when + options.duration * step / 7);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(options.gain * (.65), when + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        if (options.lowpass) {
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = options.lowpass;
            oscillator.connect(filter).connect(gain);
            oscillator.addEventListener("ended", () => filter.disconnect(), { once: true });
        }
        else {
            oscillator.connect(gain);
        }
        gain.connect(master);
        oscillator.start(when);
        oscillator.stop(end + 0.01);
        oscillator.addEventListener("ended", () => {
            oscillator.disconnect();
            gain.disconnect();
        }, { once: true });
    }
    private noiseHit(when: number, duration: number, frequency: number, q: number, gainValue: number) {
        const ctx = this.context;
        const master = this.master;
        if (!ctx || !master)
            return;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const end = when + duration;
        source.buffer = this.getNoise(ctx);
        filter.type = "bandpass";
        filter.frequency.value = frequency;
        filter.Q.value = q;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(gainValue, when + Math.min(0.012, duration * 0.2));
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        source.connect(filter).connect(gain).connect(master);
        source.start(when, Math.random() * 0.8);
        source.stop(end + 0.01);
        source.addEventListener("ended", () => {
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
        }, { once: true });
    }
    private filteredSweep(when: number, duration: number, from: number, to: number, gainValue: number) {
        const ctx = this.context;
        const master = this.master;
        if (!ctx || !master)
            return;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const end = when + duration;
        source.buffer = this.getNoise(ctx);
        filter.type = "bandpass";
        filter.Q.value = 0.8;
        filter.frequency.setValueAtTime(from, when);
        filter.frequency.exponentialRampToValueAtTime(to, end);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(gainValue, when + duration * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        source.connect(filter).connect(gain).connect(master);
        source.start(when, Math.random() * 0.5);
        source.stop(end + 0.02);
        source.addEventListener("ended", () => {
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
        }, { once: true });
    }
    private disposeUltra(fadeSeconds: number) {
        const voice = this.ultra;
        const ctx = this.context;
        if (!voice || !ctx)
            return;
        this.ultra = null;
        const now = ctx.currentTime;
        const stopAt = now + fadeSeconds + 0.025;
        voice.output.gain.cancelScheduledValues(now);
        voice.output.gain.setTargetAtTime(0.0001, now, Math.max(0.008, fadeSeconds / 3));
        [voice.noise, voice.flame, voice.rumble, voice.lfo].forEach((source) => {
            try {
                source.stop(stopAt);
            }
            catch {
                // A stopped source is already safe to discard.
            }
        });
        voice.noise.addEventListener("ended", () => {
            voice.nodes.forEach((node) => node.disconnect());
            voice.output.disconnect();
        }, { once: true });
    }
}
export function createSoundEngine(options?: {
    enabled?: boolean;
    volume?: number;
}) {
    return new KnopikSoundEngine(options);
}
function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
export type { UltraStopResult };
