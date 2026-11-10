// ===== 効果音（WebAudio で合成。音声ファイルなし・BGMなし。もぐもぐのリズムが音楽の代わり）=====
const Snd = (() => {
  let ac = null, master = null, noiseBuf = null;
  function init() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        const comp = ac.createDynamicsCompressor();   // 重なっても割れないように
        comp.threshold.value = -14; comp.ratio.value = 6;
        master = ac.createGain(); master.gain.value = 0.55;
        master.connect(comp); comp.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (_) { ac = null; return; }
    }
    if (ac.state === 'suspended') ac.resume();
  }
  const now = () => ac.currentTime;
  // 音程のある音。slide は終わりの周波数の倍率、vib は震え
  function tone(f, dur, o) {
    if (!ac) return;
    o = o || {};
    const t0 = now() + (o.delay || 0);
    const osc = ac.createOscillator(), gn = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f * o.slide), t0 + dur);
    if (o.vib) {
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = f * 0.04;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }
    const v = o.vol == null ? 0.4 : o.vol;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gn); gn.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  // 雑音（もぐもぐ・風切り）
  function noise(dur, o) {
    if (!ac) return;
    o = o || {};
    const t0 = now() + (o.delay || 0);
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = o.type || 'bandpass';
    fl.frequency.setValueAtTime(o.f || 1200, t0); fl.Q.value = o.q || 1;
    if (o.sweep) fl.frequency.exponentialRampToValueAtTime(o.sweep, t0 + dur);
    const gn = ac.createGain(); gn.gain.setValueAtTime(o.vol || 0.3, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(gn); gn.connect(master);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.02);
  }
  const PENTA = [0, 2, 4, 7, 9];   // 連続で拾うと音が上がっていく
  function chainFreq(n) { const i = Math.min(n - 1, 14); return 523 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12); }

  return {
    init,
    pick(chain) { const f = chainFreq(chain); tone(f, 0.14, { type: 'triangle', vol: 0.45 }); tone(f * 2, 0.1, { type: 'sine', vol: 0.18, delay: 0.02 }); },
    eat(low) {
      noise(0.05, { f: 1800, q: 2, vol: 0.3 }); tone(160, 0.06, { type: 'square', vol: 0.08, slide: 0.6 });
      if (low) { tone(880, 0.07, { type: 'square', vol: 0.15 }); tone(880, 0.07, { type: 'square', vol: 0.15, delay: 0.12 }); }   // 残りわずか
    },
    hitPumpkin() { tone(140, 0.25, { type: 'sine', vol: 0.55, slide: 0.45 }); tone(300, 0.15, { type: 'square', vol: 0.12, slide: 0.5 }); noise(0.12, { f: 400, vol: 0.3 }); },
    hitGhost() { tone(620, 0.55, { type: 'sine', vol: 0.4, slide: 0.4, vib: 9 }); tone(930, 0.5, { type: 'sine', vol: 0.15, slide: 0.4, vib: 9, delay: 0.03 }); },
    hitWitch() { noise(0.3, { f: 3000, sweep: 400, vol: 0.35, q: 1.5 }); tone(200, 0.4, { type: 'sawtooth', vol: 0.2, slide: 0.5 }); },
    house() { [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.4, delay: i * 0.075 })); },
    witch() { noise(0.7, { f: 500, sweep: 2600, vol: 0.18, q: 1.2 }); tone(300, 0.7, { type: 'sine', vol: 0.08, slide: 2.2, vib: 14 }); },
    dawn() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.4, delay: i * 0.16 })); tone(2400, 0.12, { type: 'sine', vol: 0.1, delay: 0.9, slide: 1.3 }); tone(2800, 0.1, { type: 'sine', vol: 0.1, delay: 1.1, slide: 1.3 }); },
    prank() {   // 大げさなイタズラ：ずっこけ音とボヨン
      tone(500, 0.6, { type: 'sawtooth', vol: 0.3, slide: 0.35, vib: 6 });
      tone(160, 0.3, { type: 'sine', vol: 0.5, slide: 3, delay: 0.55 }); tone(300, 0.25, { type: 'triangle', vol: 0.3, slide: 0.5, delay: 0.85 });
    },
    stamp() { tone(300, 0.18, { type: 'sine', vol: 0.4, slide: 0.5 }); }
  };
})();
