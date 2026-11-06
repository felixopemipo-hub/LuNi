/*
 * LuNi Story Audio Add-on
 * - Prefers available English female-sounding system voices.
 * - Uses browser speech synthesis for narration.
 * - Generates a soft, original ambient lullaby with Web Audio (no external audio file).
 * - Background music starts only after the visitor clicks a control, as required by browsers.
 *
 * Add story-audio.css and this file to story.html. See README.txt.
 */
(() => {
  'use strict';

  if (window.__luniStoryAudioLoaded) return;
  window.__luniStoryAudioLoaded = true;

  const FEMALE_NAMES = [
    'samantha', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'ava',
    'fiona', 'susan', 'allison', 'joanna', 'kendra', 'kimberly', 'salli',
    'ivy', 'amy', 'emma', 'libby', 'aria', 'jenny', 'zira', 'natasha',
    'olivia', 'nicky', 'google uk english female', 'female'
  ];
  const MALE_NAMES = [
    'daniel', 'david', 'james', 'george', 'thomas', 'guy', 'ryan',
    'male', 'aaron', 'alex', 'fred', 'jorge', 'lee', 'mark'
  ];

  const state = {
    voices: [],
    voice: null,
    utterance: null,
    paragraphs: [],
    paragraphIndex: 0,
    speaking: false,
    paused: false,
    audioContext: null,
    musicBus: null,
    musicTimer: null,
    musicOn: true,
    musicGain: 0.12,
    noteIndex: 0,
    selectedVoiceName: 'auto'
  };

  const $ = (selector, root = document) => root.querySelector(selector);

  function findStoryElement() {
    const candidates = [
      '[data-story-text]', '#storyContent', '#story-content', '#storyText',
      '#story-text', '.story-content', '.story-text', '.story-body',
      '.story__content', 'main article', 'article', 'main'
    ];
    for (const selector of candidates) {
      const element = $(selector);
      if (element && element.innerText && element.innerText.trim().length > 120) {
        if (element.id === 'luni-audio-controls' || element.closest('#luni-audio-controls')) continue;
        return element;
      }
    }
    return null;
  }

  function getStoryParagraphs() {
    const root = findStoryElement();
    if (!root) return [];

    // Prefer actual paragraph blocks to preserve pauses and avoid speaking navigation.
    const blocks = [...root.querySelectorAll('p, li, blockquote')]
      .filter(el => !el.closest('#luni-audio-controls'))
      .map(el => (el.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(text => text.length > 0);

    if (blocks.join(' ').length > 120) return blocks;

    const text = (root.innerText || '')
      .replace(/\b(Listen|Read aloud|Play narration|Stop narration|Music on|Music off)\b/gi, '')
      .replace(/\n{2,}/g, '\n\n')
      .trim();
    return text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  }

  function scoreVoice(voice) {
    const name = (voice.name || '').toLowerCase();
    const lang = (voice.lang || '').toLowerCase();
    let score = 0;
    if (lang.startsWith('en-gb')) score += 32;
    else if (lang.startsWith('en-us')) score += 28;
    else if (lang.startsWith('en')) score += 20;
    else score -= 100;

    if (FEMALE_NAMES.some(token => name.includes(token))) score += 100;
    if (MALE_NAMES.some(token => name.includes(token))) score -= 120;
    if (/natural|neural|premium|enhanced/.test(name)) score += 8;
    if (voice.default) score += 2;
    return score;
  }

  function chooseVoice() {
    const selected = state.voices.find(v => v.name === state.selectedVoiceName);
    if (selected) return selected;
    const english = state.voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
    const pool = english.length ? english : state.voices;
    return pool.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
  }

  function populateVoiceSelect() {
    const select = $('#luni-voice-select');
    if (!select) return;
    const previous = state.selectedVoiceName;
    const english = state.voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
    const list = english.length ? english : state.voices;
    select.innerHTML = '';

    const auto = document.createElement('option');
    auto.value = 'auto';
    auto.textContent = 'Best available female voice';
    select.appendChild(auto);

    list.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      select.appendChild(option);
    });

    select.value = list.some(v => v.name === previous) ? previous : 'auto';
    state.voice = chooseVoice();
    updateVoiceNote();
  }

  function updateVoiceNote() {
    const note = $('#luni-voice-note');
    if (!note) return;
    const voice = chooseVoice();
    if (!voice) {
      note.textContent = 'No system voice is available yet. Try refreshing the page.';
      return;
    }
    const isFemaleMatch = FEMALE_NAMES.some(token => voice.name.toLowerCase().includes(token));
    note.textContent = isFemaleMatch
      ? `Selected: ${voice.name}`
      : `Selected: ${voice.name}. Your browser has not exposed a clearly identified female English voice; choose one from the list if available.`;
  }

  function setButtonState() {
    const play = $('#luni-narration-toggle');
    if (!play) return;
    play.textContent = state.speaking
      ? (state.paused ? 'Resume narration' : 'Pause narration')
      : '▶ Listen to story';
    play.setAttribute('aria-label', play.textContent);
  }

  function setMusicButton() {
    const button = $('#luni-music-toggle');
    if (!button) return;
    button.textContent = state.musicOn ? '♫ Music: On' : '♫ Music: Off';
    button.setAttribute('aria-pressed', String(state.musicOn));
  }

  function updateMusicLevel() {
    if (!state.musicBus || !state.audioContext) return;
    const speakingDuck = state.speaking && !state.paused ? 0.30 : 1;
    const target = state.musicOn ? state.musicGain * speakingDuck : 0;
    state.musicBus.gain.setTargetAtTime(target, state.audioContext.currentTime, 0.35);
  }

  async function ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!state.audioContext) {
      state.audioContext = new AudioContextClass();
      state.musicBus = state.audioContext.createGain();
      state.musicBus.gain.value = 0;
      state.musicBus.connect(state.audioContext.destination);
    }
    if (state.audioContext.state === 'suspended') await state.audioContext.resume();
    return true;
  }

  function playSoftNote(frequency, startTime, duration, volume = 0.10, waveform = 'sine') {
    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(state.musicBus);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.04);
  }

  function scheduleLullabyBar() {
    if (!state.audioContext || !state.musicOn) return;
    const ctx = state.audioContext;
    const now = ctx.currentTime + 0.04;
    const chords = [
      [130.81, 164.81, 196.00], // C major
      [110.00, 130.81, 164.81], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66]  // G major
    ];
    const chord = chords[state.noteIndex % chords.length];
    chord.forEach((frequency, i) => playSoftNote(frequency, now, 3.7, 0.018 - i * 0.002, 'sine'));
    const melody = [523.25, 392.00, 440.00, 659.25, 587.33, 392.00, 523.25, 392.00];
    const note = melody[state.noteIndex % melody.length];
    playSoftNote(note, now + 0.35, 1.7, 0.045, 'sine');
    playSoftNote(note * 1.5, now + 1.55, 1.25, 0.018, 'sine');
    state.noteIndex += 1;
  }

  async function startMusic() {
    state.musicOn = true;
    setMusicButton();
    const ready = await ensureAudio();
    if (!ready) {
      const note = $('#luni-audio-note');
      if (note) note.textContent = 'Background music is not supported by this browser.';
      return;
    }
    updateMusicLevel();
    if (!state.musicTimer) {
      scheduleLullabyBar();
      state.musicTimer = window.setInterval(scheduleLullabyBar, 3800);
    }
  }

  async function stopMusic() {
    state.musicOn = false;
    setMusicButton();
    updateMusicLevel();
    if (state.musicTimer) {
      window.clearInterval(state.musicTimer);
      state.musicTimer = null;
    }
  }

  function finishNarration() {
    state.speaking = false;
    state.paused = false;
    state.utterance = null;
    setButtonState();
    updateMusicLevel();
  }

  function speakNextParagraph() {
    if (!state.speaking || state.paused) return;
    if (state.paragraphIndex >= state.paragraphs.length) {
      finishNarration();
      return;
    }
    const text = state.paragraphs[state.paragraphIndex++];
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-GB';
    utterance.rate = 0.91;
    utterance.pitch = 1.08;
    utterance.volume = 1;
    utterance.onend = () => speakNextParagraph();
    utterance.onerror = event => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        const note = $('#luni-audio-note');
        if (note) note.textContent = `Narration error: ${event.error}. Try another voice.`;
      }
      if (state.speaking && state.paragraphIndex >= state.paragraphs.length) finishNarration();
      else if (state.speaking) speakNextParagraph();
    };
    state.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  async function startNarration() {
    if (!('speechSynthesis' in window)) {
      const note = $('#luni-audio-note');
      if (note) note.textContent = 'Narration is not supported in this browser.';
      return;
    }
    const paragraphs = getStoryParagraphs();
    if (!paragraphs.length) {
      const note = $('#luni-audio-note');
      if (note) note.textContent = 'I could not find the story text. See README.txt to set the story content selector.';
      return;
    }
    if (state.musicOn) await startMusic();
    window.speechSynthesis.cancel();
    state.paragraphs = paragraphs;
    state.paragraphIndex = 0;
    state.speaking = true;
    state.paused = false;
    setButtonState();
    updateMusicLevel();
    speakNextParagraph();
  }

  function toggleNarration() {
    if (!state.speaking) {
      startNarration();
      return;
    }
    if (state.paused) {
      window.speechSynthesis.resume();
      state.paused = false;
    } else {
      window.speechSynthesis.pause();
      state.paused = true;
    }
    setButtonState();
    updateMusicLevel();
  }

  function stopNarration() {
    window.speechSynthesis?.cancel();
    finishNarration();
  }

  function buildControls() {
    if ($('#luni-audio-controls')) return;
    const panel = document.createElement('section');
    panel.id = 'luni-audio-controls';
    panel.setAttribute('aria-label', 'Story audio controls');
    panel.innerHTML = `
      <div class="luni-audio-heading">
        <span class="luni-audio-sparkle" aria-hidden="true">✦</span>
        <div><strong>Storytime audio</strong><small>Gentle narration and a soft original lullaby</small></div>
      </div>
      <div class="luni-audio-actions">
        <button type="button" id="luni-narration-toggle" class="luni-audio-primary">▶ Listen to story</button>
        <button type="button" id="luni-narration-stop" class="luni-audio-secondary">Stop</button>
        <button type="button" id="luni-music-toggle" class="luni-audio-secondary" aria-pressed="true">♫ Music: On</button>
      </div>
      <label class="luni-voice-label" for="luni-voice-select">Narrator voice</label>
      <select id="luni-voice-select" class="luni-voice-select"><option value="auto">Best available female voice</option></select>
      <small id="luni-voice-note" class="luni-audio-note">Looking for an available female English voice…</small>
      <small id="luni-audio-note" class="luni-audio-note" aria-live="polite">Music starts when you press Listen or Music.</small>
    `;

    const target = findStoryElement();
    const heading = $('h1');
    if (target && target.parentNode) target.parentNode.insertBefore(panel, target);
    else if (heading && heading.parentNode) heading.parentNode.insertBefore(panel, heading.nextSibling);
    else document.body.prepend(panel);

    $('#luni-narration-toggle').addEventListener('click', toggleNarration);
    $('#luni-narration-stop').addEventListener('click', stopNarration);
    $('#luni-music-toggle').addEventListener('click', () => state.musicOn ? stopMusic() : startMusic());
    $('#luni-voice-select').addEventListener('change', event => {
      state.selectedVoiceName = event.target.value;
      state.voice = chooseVoice();
      updateVoiceNote();
      if (state.speaking && !state.paused) {
        const currentParagraph = Math.max(0, state.paragraphIndex - 1);
        window.speechSynthesis.cancel();
        state.paragraphIndex = currentParagraph;
        speakNextParagraph();
      }
    });
  }

  function init() {
    buildControls();
    if ('speechSynthesis' in window) {
      state.voices = window.speechSynthesis.getVoices();
      populateVoiceSelect();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        state.voices = window.speechSynthesis.getVoices();
        populateVoiceSelect();
      });
    }
    setButtonState();
    setMusicButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
