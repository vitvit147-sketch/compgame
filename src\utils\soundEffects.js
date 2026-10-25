// src/utils/soundEffects.js - Звуковые эффекты через Web Audio API (без внешних mp3)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const sounds = {
  // Взрыв мины (мощный низкий гул + шумовой удар)
  playExplosion() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // 1. Гул сабвуфера
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);

      gain.gain.setValueAtTime(1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.7);

      // 2. Белый шум взрыва
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(t);

      // Мобильная вибрация
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 300, 100, 400]);
      }
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // Успешный ответ (яркий мажорный аккорд)
  playSuccess() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.4);
      });

      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 120]);
      }
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // Тик таймера
  playTick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // Звук нажатия на кнопку
  playTap() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // Вход игрока в комнату
  playPlayerJoin() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }
};
