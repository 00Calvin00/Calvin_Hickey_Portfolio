/**
 * "A groove I wrote": a 16-step drum machine.
 *
 * The pattern lives in the page's <pre> drum notation, so there is one source
 * of truth that also works as the no-JavaScript fallback. This module turns it
 * into an editable grid and plays it with drum sounds synthesized in the
 * Web Audio API (no audio files to download).
 *
 * Timing uses the standard look-ahead scheduler: a coarse JS timer queues
 * notes slightly ahead on the precise audio clock, and the step highlight is
 * drawn from that same clock so sound and visuals stay in sync.
 */

const STEPS = 16;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

const VOICES = {
  HH: { name: 'Hi-hat', className: 'voice-hh' },
  SN: { name: 'Snare', className: 'voice-sn' },
  BD: { name: 'Bass drum', className: 'voice-bd' },
};

/** Reads lines like "HH |x-xx -x-- x-xx -xx-|" into { HH: [true, false, ...], ... }. */
export function parseNotation(text) {
  const pattern = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Z]{2})\s*\|([^|]+)\|/);
    if (!match || !VOICES[match[1]]) continue;
    const hits = [...match[2].replace(/\s/g, '')].map((char) => char !== '-');
    if (hits.length === STEPS) pattern[match[1]] = hits;
  }
  return pattern;
}

/* ---------- Synthesized drum kit ---------- */

function createKit(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.7;
  const compressor = ctx.createDynamicsCompressor();
  master.connect(compressor).connect(ctx.destination);

  // One second of white noise, reused by the snare and hi-hat
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const envelope = (time, peak, decay) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    gain.connect(master);
    return gain;
  };

  const noiseBurst = (time, filterType, frequency, peak, decay) => {
    const source = ctx.createBufferSource();
    source.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    source.connect(filter).connect(envelope(time, peak, decay));
    source.start(time);
    source.stop(time + decay);
  };

  return {
    BD(time) {
      // A sine wave that drops quickly in pitch reads as a kick drum
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      osc.connect(envelope(time, 1, 0.35));
      osc.start(time);
      osc.stop(time + 0.35);
    },
    SN(time) {
      // Filtered noise for the wires plus a short tone for the drum body
      noiseBurst(time, 'highpass', 1200, 0.6, 0.18);
      const body = ctx.createOscillator();
      body.type = 'triangle';
      body.frequency.value = 185;
      body.connect(envelope(time, 0.35, 0.1));
      body.start(time);
      body.stop(time + 0.1);
    },
    HH(time) {
      noiseBurst(time, 'highpass', 7500, 0.22, 0.05);
    },
  };
}

/* ---------- Grid UI ---------- */

function buildGrid(gridEl, pattern) {
  const cells = {}; // voice -> [button, ...]
  gridEl.replaceChildren();

  for (const [voice, { name, className }] of Object.entries(VOICES)) {
    const row = document.createElement('div');
    row.className = `groove-row ${className}`;
    row.setAttribute('role', 'row');

    const header = document.createElement('span');
    header.className = 'groove-voice';
    header.setAttribute('role', 'rowheader');
    header.textContent = name;
    row.append(header);

    cells[voice] = [];
    for (let step = 0; step < STEPS; step++) {
      const cell = document.createElement('span');
      cell.setAttribute('role', 'gridcell');
      // Shade every other beat (group of four steps), like the step buttons on a TR-808
      if (Math.floor(step / 4) % 2 === 1) cell.classList.add('beat-alt');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'step';
      button.tabIndex = -1;
      button.setAttribute('aria-label', `${name}, step ${step + 1}`);
      button.setAttribute('aria-pressed', String(Boolean(pattern[voice]?.[step])));
      button.dataset.voice = voice;
      button.dataset.step = String(step);

      cell.append(button);
      row.append(cell);
      cells[voice].push(button);
    }
    gridEl.append(row);
  }

  cells.HH[0].tabIndex = 0;
  return cells;
}

/** Roving tabindex: the grid is one tab stop, and arrow keys move between steps. */
function enableKeyboard(gridEl, cells) {
  const voices = Object.keys(cells);

  gridEl.addEventListener('keydown', (event) => {
    const button = event.target.closest('.step');
    if (!button) return;

    let row = voices.indexOf(button.dataset.voice);
    let col = Number(button.dataset.step);
    const moves = {
      ArrowRight: () => (col = (col + 1) % STEPS),
      ArrowLeft: () => (col = (col - 1 + STEPS) % STEPS),
      ArrowDown: () => (row = (row + 1) % voices.length),
      ArrowUp: () => (row = (row - 1 + voices.length) % voices.length),
      Home: () => (col = 0),
      End: () => (col = STEPS - 1),
    };
    if (!moves[event.key]) return;

    event.preventDefault();
    moves[event.key]();
    const next = cells[voices[row]][col];
    button.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  });

  gridEl.addEventListener('click', (event) => {
    const button = event.target.closest('.step');
    if (!button) return;
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    for (const other of gridEl.querySelectorAll('.step[tabindex="0"]')) other.tabIndex = -1;
    button.tabIndex = 0;
  });
}

/* ---------- Wiring ---------- */

export function initGroove(root) {
  const notation = root.querySelector('[data-groove-notation]');
  const gridEl = root.querySelector('[data-groove-grid]');
  const controls = root.querySelector('[data-groove-controls]');
  const playButton = root.querySelector('[data-groove-play]');
  const playLabel = playButton.querySelector('[data-label]');
  const tempoInput = root.querySelector('[data-groove-tempo]');
  const tempoOutput = root.querySelector('[data-groove-tempo-output]');
  const resetButton = root.querySelector('[data-groove-reset]');

  const original = parseNotation(notation.textContent);
  const cells = buildGrid(gridEl, original);
  enableKeyboard(gridEl, cells);
  controls.hidden = false;
  gridEl.hidden = false;

  let ctx = null;
  let kit = null;
  let timer = null;
  let frame = null;
  let nextNoteTime = 0;
  let nextStep = 0;
  let queue = []; // steps scheduled on the audio clock, waiting to be drawn
  let shownStep = -1;

  const isOn = (voice, step) => cells[voice][step].getAttribute('aria-pressed') === 'true';
  const secondsPerStep = () => 60 / Number(tempoInput.value) / 4;

  function showStep(step) {
    if (step === shownStep) return;
    for (const buttons of Object.values(cells)) {
      buttons[shownStep]?.classList.remove('is-current');
      buttons[step]?.classList.add('is-current');
    }
    shownStep = step;
  }

  function schedule() {
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      for (const voice of Object.keys(VOICES)) {
        if (isOn(voice, nextStep)) kit[voice](nextNoteTime);
      }
      queue.push({ step: nextStep, time: nextNoteTime });
      nextNoteTime += secondsPerStep();
      nextStep = (nextStep + 1) % STEPS;
    }
  }

  function draw() {
    while (queue.length && queue[0].time <= ctx.currentTime) {
      showStep(queue.shift().step);
    }
    frame = requestAnimationFrame(draw);
  }

  async function start() {
    // Browsers only allow audio after a user gesture, so the context is created on first Play
    ctx ??= new AudioContext();
    kit ??= createKit(ctx);
    await ctx.resume();

    nextStep = 0;
    nextNoteTime = ctx.currentTime + 0.05;
    queue = [];
    timer = setInterval(schedule, LOOKAHEAD_MS);
    schedule();
    frame = requestAnimationFrame(draw);

    playButton.classList.add('is-playing');
    playLabel.textContent = 'Stop';
  }

  function stop() {
    clearInterval(timer);
    cancelAnimationFrame(frame);
    timer = null;
    showStep(-1);
    playButton.classList.remove('is-playing');
    playLabel.textContent = 'Play';
  }

  playButton.addEventListener('click', () => (timer ? stop() : start()));

  tempoInput.addEventListener('input', () => {
    tempoOutput.value = tempoInput.value;
  });

  resetButton.addEventListener('click', () => {
    for (const [voice, buttons] of Object.entries(cells)) {
      buttons.forEach((button, step) =>
        button.setAttribute('aria-pressed', String(Boolean(original[voice]?.[step]))),
      );
    }
  });

  // Don't keep drumming in a background tab
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && timer) stop();
  });
}
