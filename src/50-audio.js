// ===== 効果音（WebAudio で合成。音声ファイルなし。Phase 3 で本格化）=====
const Snd = (() => {
  let ac = null, master = null;
  function init() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain(); master.gain.value = 0.35;
        master.connect(ac.destination);
      } catch (_) { ac = null; return; }
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function tone(f, dur, type, vol, slide) {
    if (!ac) return;
    const t0 = ac.currentTime;
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
    gn.gain.setValueAtTime(vol || 0.5, t0);
    gn.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(gn); gn.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  return {
    init,
    pick(chain) { tone(520 * Math.pow(1.0595, Math.min(chain, 12) * 2), 0.12, 'triangle', 0.5); },
    eat() { tone(180, 0.06, 'square', 0.12, 0.7); },
    hit() { tone(220, 0.28, 'sawtooth', 0.4, 0.4); },
    house() { [660, 830, 990].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.5), i * 70)); },
    witch() { tone(900, 0.5, 'sawtooth', 0.12, 0.35); },
    end(win) { if (win) { tone(660, 0.2, 'triangle', 0.5); setTimeout(() => tone(880, 0.3, 'triangle', 0.5), 160); } else tone(300, 0.6, 'sawtooth', 0.4, 0.3); }
  };
})();
