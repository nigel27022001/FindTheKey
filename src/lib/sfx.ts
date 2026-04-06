/**
 * Sound Effects System — Web Audio API synthesized sounds
 * Theme: Fantasy RPG / Database dungeon crawler
 */

let ctx: AudioContext | null = null;
let _muted = false;

export function isMuted() { return _muted; }
export function setMuted(m: boolean) {
  _muted = m;
  if (bossBgm) bossBgm.volume = m ? 0 : 0.35;
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/* ─── helpers ─── */

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  detune = 0,
) {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  if (_muted) return;
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  // bandpass for more textured noise
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 1;

  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration);
}

/* ═══════════════════════════════════════════
   UI / NAVIGATION
   ═══════════════════════════════════════════ */

/** Generic button click — soft tick */
export function sfxClick() {
  playTone(800, 0.06, "sine", 0.08);
  playTone(1200, 0.04, "sine", 0.05);
}

/** Map node selected */
export function sfxMapSelect() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;
  // ascending chime
  [523, 659, 784].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.12, t + i * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.15);
  });
}

/* ═══════════════════════════════════════════
   COMBAT — PLAYER ATTACK (Rune / Key Forging)
   ═══════════════════════════════════════════ */

/** Rune projectile launched — magical whoosh */
export function sfxRuneLaunch() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  // sweeping sine
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.3);

  // shimmer
  playTone(1800, 0.15, "sine", 0.05);
}

/** Rune hits enemy — impactful hit with magic sparkle */
export function sfxRuneHit() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  // impact thud
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.2);

  // sparkle
  playTone(1400, 0.1, "sine", 0.08);
  setTimeout(() => playTone(1800, 0.08, "sine", 0.06), 50);

  // crunch noise
  playNoise(0.08, 0.1);
}

/* ═══════════════════════════════════════════
   COMBAT — ENEMY ATTACK
   ═══════════════════════════════════════════ */

/** Enemy launches attack projectile */
export function sfxEnemyLaunch() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

/** Player takes damage — heavy thud + pain */
export function sfxPlayerHit() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  // low thud
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.25);

  // crunch
  playNoise(0.12, 0.12);
}

/* ═══════════════════════════════════════════
   COMBAT EVENTS
   ═══════════════════════════════════════════ */

/** Enemy encounter start — soft low tone */
export function sfxEnemyAppear() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  // gentle low hum
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.5);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.06, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.5);

  // subtle accent
  const osc2 = c.createOscillator();
  const gain2 = c.createGain();
  osc2.type = "triangle";
  osc2.frequency.value = 260;
  gain2.gain.setValueAtTime(0, t + 0.15);
  gain2.gain.linearRampToValueAtTime(0.04, t + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc2.connect(gain2).connect(c.destination);
  osc2.start(t + 0.15);
  osc2.stop(t + 0.45);
}

/** Enemy defeated — triumphant fanfare */
export function sfxVictory() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.4);
  });
}

/** Game over — descending defeat */
export function sfxGameOver() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  const notes = [392, 330, 262, 196]; // G4 E4 C4 G3
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.18);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.18 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.5);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.18);
    osc.stop(t + i * 0.18 + 0.5);
  });
}

/* ═══════════════════════════════════════════
   ITEMS / EVENTS
   ═══════════════════════════════════════════ */

/** Heal / Rest — warm chime */
export function sfxHeal() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  [440, 554, 659].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, t + i * 0.1 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.35);
  });
}

/** Gold collected — coin jingle */
export function sfxGold() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  [2200, 2600, 3000].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.05);
    gain.gain.linearRampToValueAtTime(0.08, t + i * 0.05 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.05);
    osc.stop(t + i * 0.05 + 0.12);
  });
}

/** Treasure / loot found */
export function sfxTreasure() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  const notes = [784, 988, 1175, 1319]; // G5 B5 D6 E6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.25);
  });
}

/** Mystery event — eerie/curious */
export function sfxMystery() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  [330, 415, 330, 370].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = i % 2 === 0 ? -10 : 10;
    gain.gain.setValueAtTime(0, t + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.12 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.3);
  });
}

/** Shop enter — welcoming bell */
export function sfxShop() {
  playTone(1319, 0.15, "sine", 0.1);  // E6
  setTimeout(() => playTone(1568, 0.2, "sine", 0.08), 80); // G6
}

/** Purchase item */
export function sfxPurchase() {
  sfxGold();
  setTimeout(() => playTone(880, 0.15, "triangle", 0.1), 120);
}

/** Potion use — bubbly quaff */
export function sfxPotion() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;

  [400, 500, 600, 800].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.04);
    gain.gain.linearRampToValueAtTime(0.08, t + i * 0.04 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.04);
    osc.stop(t + i * 0.04 + 0.1);
  });
}

/** Trap damage — sharp sting */
export function sfxTrap() {
  playNoise(0.1, 0.15);
  playTone(200, 0.15, "sawtooth", 0.12);
  setTimeout(() => playTone(100, 0.2, "sine", 0.1), 60);
}

/** Timer warning tick (last 5 seconds) */
export function sfxTimerTick() {
  playTone(1000, 0.05, "square", 0.06);
}

/** Attribute chip selected — small magical click */
export function sfxAttrSelect() {
  playTone(1100, 0.06, "triangle", 0.07);
  playTone(1400, 0.05, "sine", 0.04);
}

/** Wrong answer buzz */
export function sfxWrong() {
  playTone(150, 0.2, "sawtooth", 0.1);
  playTone(140, 0.2, "sawtooth", 0.08);
}

/** Correct answer in practice — satisfying chime */
export function sfxCorrect() {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime;
  [659, 880].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.25);
  });
}

/* ═══════════════════════════════════════════
   BGM
   ═══════════════════════════════════════════ */

let bossBgm: HTMLAudioElement | null = null;
// let _bossPlaying = false;

/** Start boss BGM — loops until stopped */
export function playBossBgm() {
  // _bossPlaying = true;
  if (bossBgm) { bossBgm.pause(); bossBgm = null; }
  bossBgm = new Audio("/bgm-boss.mp3");
  bossBgm.loop = true;
  bossBgm.volume = _muted ? 0 : 0.35;
  bossBgm.play().catch(() => { });
}

/** Stop boss BGM with a short fade-out */
export function stopBossBgm() {
  // _bossPlaying = false;
  if (!bossBgm) return;
  const audio = bossBgm;
  bossBgm = null;
  const fade = setInterval(() => {
    if (audio.volume > 0.05) {
      audio.volume = Math.max(0, audio.volume - 0.05);
    } else {
      clearInterval(fade);
      audio.pause();
      audio.currentTime = 0;
    }
  }, 50);
}
