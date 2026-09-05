import { useEffect, useRef, useState } from 'react';

export function useTrainSound(active) {
  const audio = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  async function toggle() {
    if (enabled) { setEnabled(false); return; }
    try {
      if (!audio.current) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) throw new Error('unsupported');
        const context = new Context();
        const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          last = (last + Math.random() * 0.04 - 0.02) / 1.02;
          const rhythm = 0.22 + 0.5 * Math.exp(-((i / context.sampleRate) % 0.7) * 30);
          data[i] = last * rhythm;
        }
        const source = context.createBufferSource();
        source.buffer = buffer; source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 650;
        const gain = context.createGain(); gain.gain.value = 0;
        source.connect(filter); filter.connect(gain); gain.connect(context.destination);
        source.start(); audio.current = { context, gain };
      }
      await audio.current.context.resume();
      setEnabled(true); setError('');
    } catch { setError('このブラウザでは車内音を再生できません。'); }
  }
  useEffect(() => {
    if (!audio.current) return;
    const { context, gain } = audio.current;
    gain.gain.setTargetAtTime(enabled && active ? 0.8 : 0, context.currentTime, 0.05);
  }, [active, enabled]);
  useEffect(() => () => { audio.current?.context.close(); audio.current = null; }, []);
  return { enabled, error, toggle };
}
