// ===== ゲームのロジック（画面を使わない）=====
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 時刻の表示（21:00 → 6:00）
function clockOf(t) {
  const m = Math.floor(clamp(t / CFG.dur, 0, 1) * 9 * 60);
  const h = (21 + Math.floor(m / 60)) % 24;
  return { h, m: m % 60, text: h + ':' + String(m % 60).padStart(2, '0') };
}

const Game = {
  mode: 'title',          // title → play → over
  result: '', cause: '',  // result: 'win' | 'lose'、cause: 最後にお菓子を取った相手（'eat' 'ghost' 'pumpkin'）
  t: 0, dist: 0, seed: 1, rand: null,
  x: 50, keyDir: 0,
  candy: 0, eaten: 0, picked: 0, stolen: 0, eatT: 0,
  inv: 0, stun: 0, chain: 0, chainT: 0,
  lastHit: 'eat',
  objs: [], nextSeg: 0, lastGap: 50, noSpawn: false,
  events: [],

  reset(seed) {
    this.seed = seed == null ? (Date.now() & 0xffff) : seed;
    this.rand = mulberry32(this.seed);
    this.mode = 'title'; this.result = ''; this.cause = '';
    this.t = 0; this.dist = 0;
    this.x = 50; this.keyDir = 0;
    this.candy = CFG.candy0; this.eaten = 0; this.picked = 0; this.stolen = 0; this.eatT = 0;
    this.inv = 0; this.stun = 0; this.chain = 0; this.chainT = 99;
    this.lastHit = 'eat';
    this.objs = []; this.nextSeg = 30; this.lastGap = 50; this.noSpawn = false;
    this.events = [];
  },

  begin() {
    if (this.mode !== 'title') return;
    this.mode = 'play';
    this.events.push({ type: 'start' });
  },

  p() { return clamp(this.t / CFG.dur, 0, 1); },
  speed() { return lerp(CFG.speed0, CFG.speed1, this.p()) * (this.stun > 0 ? CFG.stunSlow : 1); },
  eatInterval() { return lerp(CFG.eat0, CFG.eat1, this.p()); },

  // 指（またはキー）で左右に動かす。dx は論理単位
  move(dx) {
    if (this.mode !== 'play') return;
    this.x = clamp(this.x + dx, CFG.roadL + CFG.childR, CFG.roadR - CFG.childR);
  },

  add(k, x, y, r) {
    if (k === 'candy' && this.rand() > CFG.candyKeep) return null;   // お菓子の量の調整
    const o = { k, x, y, r, dead: false, ph: this.rand() * 6.28 };
    this.objs.push(o);
    return o;
  },

  // 区画を並べる。obstacles は必ず通れる幅（ゲート 約15、散らばり 約15）を残す
  spawnSeg(y0) {
    const r = this.rand, p = this.p();
    const rnd = (a, b) => a + (b - a) * r();
    let kind;
    if (y0 < 150) kind = r() < 0.5 ? 'line' : 'wave';   // 最初は穏やか
    else {
      const w = [['line', 3], ['wave', 3], ['gate', 1.3 + p * 2], ['bait', 1 + p * 2], ['scatter', 1.2 + p]];
      let sum = 0; for (const a of w) sum += a[1];
      let v = r() * sum; kind = w[0][0];
      for (const a of w) { if (v < a[1]) { kind = a[0]; break; } v -= a[1]; }
    }
    const C = CFG;
    if (kind === 'line') {
      const cx = rnd(18, 82);
      for (let i = 0; i < 6; i++) this.add('candy', cx, y0 + 8 + i * 5.5, C.candyR);
    } else if (kind === 'wave') {
      const cx = rnd(32, 68);
      for (let i = 0; i < 8; i++) this.add('candy', cx + 18 * Math.sin(i * 0.85), y0 + 6 + i * 4.5, C.candyR);
    } else if (kind === 'gate') {
      const g = clamp(this.lastGap + rnd(-35, 35), 24, 76);
      this.lastGap = g;
      for (let px = 12; px <= 88; px += 9) if (Math.abs(px - g) >= 16) this.add('pumpkin', px, y0 + 22, C.pumpR);
      for (let i = 0; i < 5; i++) this.add('candy', g, y0 + 10 + i * 6, C.candyR);
    } else if (kind === 'bait') {
      const gx = r() < 0.5 ? 24 : 76, gy = y0 + 28;
      this.add('ghost', gx, gy, C.ghostR);
      for (let i = 0; i < 5; i++) {   // おばけのそばのお菓子（危ない）
        const a = -0.9 + i * 0.45;
        this.add('candy', gx + (gx < 50 ? 1 : -1) * 11 * Math.cos(a), gy + 11 * Math.sin(a), C.candyR);
      }
      const sx = 100 - gx;            // 反対側の安全なお菓子
      for (let i = 0; i < 3; i++) this.add('candy', sx, y0 + 8 + i * 6, C.candyR);
    } else if (kind === 'scatter') {
      const xs = [rnd(14, 24), rnd(44, 56), rnd(76, 86)];
      xs.forEach((px, i) => this.add('pumpkin', px, y0 + 16 + (i % 2) * 10 + rnd(0, 4), C.pumpR));
      for (let i = 0; i < 6; i++) {
        const gx = i % 2 ? 66 : 34;
        this.add('candy', gx + rnd(-3, 3), y0 + 12 + (i >> 1) * 8, C.candyR);
      }
    }
    // 夜が深まるほど、おばけが加わる
    if (kind !== 'bait') {
      const n = (r() < C.ghostBase + p * C.ghostGrow ? 1 : 0) + (p > 0.4 && r() < 0.6 ? 1 : 0);
      for (let i = 0; i < n; i++) this.add('ghost', rnd(20, 80), y0 + 36 + i * 4, C.ghostR);
    }
  },

  loseCandy(n, by) {
    const m = Math.min(this.candy, n);
    this.candy -= m; this.stolen += m;
    this.lastHit = by;
    if (this.candy <= 0) this.finish('lose', by);
    return m;
  },

  finish(result, cause) {
    if (this.mode !== 'play') return;
    this.mode = 'over'; this.result = result; this.cause = cause || '';
    this.events.push({ type: 'end', result, cause: this.cause });
  },

  step(dt) {
    if (this.mode !== 'play') return;
    const C = CFG;
    this.t += dt;
    if (this.t >= C.dur) { this.t = C.dur; this.finish('win', ''); return; }
    if (this.keyDir) this.move(this.keyDir * C.keySpeed * dt);
    this.dist += this.speed() * dt;
    this.inv = Math.max(0, this.inv - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.chainT += dt;

    if (!this.noSpawn) while (this.nextSeg < this.dist + C.ahead) { this.spawnSeg(this.nextSeg); this.nextSeg += C.segLen; }

    // 勝手に食べる
    this.eatT += dt;
    const iv = this.eatInterval();
    while (this.eatT >= iv && this.mode === 'play') {
      this.eatT -= iv;
      this.candy--; this.eaten++;
      this.events.push({ type: 'eat' });
      if (this.candy <= 0) { this.candy = 0; this.lastHit = 'eat'; this.finish('lose', 'eat'); }
    }
    if (this.mode !== 'play') return;

    // 物の動きと当たり
    for (const o of this.objs) {
      if (o.dead) continue;
      if (o.k === 'ghost') {
        if (o.flee) { o.y += 30 * dt; o.fade = (o.fade || 0) + dt; if (o.fade > 0.5) o.dead = true; continue; }
        if (o.y - this.dist < C.ghostWake) {
          const vx = clamp(this.x - o.x, -1, 1) * C.ghostChase + Math.sin(this.t * 2.2 + o.ph) * 9;
          o.x = clamp(o.x + vx * dt, C.roadL + 3, C.roadR - 3);
          o.y -= C.ghostDrop * dt;
        }
      }
      if (o.hit) continue;
      const dx = this.x - o.x, dy = this.dist - o.y, rr = C.childR + o.r;
      if (dx * dx + dy * dy >= rr * rr) continue;
      if (o.k === 'candy') {
        o.dead = true; this.candy++; this.picked++;
        this.chain = this.chainT <= C.chainTime ? this.chain + 1 : 1;
        this.chainT = 0;
        this.events.push({ type: 'pick', chain: this.chain, x: o.x, y: o.y });
      } else if (this.inv <= 0) {
        if (o.k === 'pumpkin') {
          o.hit = true;
          this.inv = C.inv; this.stun = C.stun;
          const m = this.loseCandy(C.pumpLoss, 'pumpkin');
          this.events.push({ type: 'hit', k: 'pumpkin', n: m, x: o.x, y: o.y });
        } else if (o.k === 'ghost') {
          o.flee = true;
          this.inv = C.inv;
          const m = this.loseCandy(C.ghostLoss, 'ghost');
          this.events.push({ type: 'hit', k: 'ghost', n: m, x: o.x, y: o.y });
        }
        if (this.mode !== 'play') return;
      }
    }
    // 後ろに過ぎた物を捨てる
    const lim = this.dist - 40;
    if (this.objs.length && this.objs.some(o => o.y < lim || o.dead)) this.objs = this.objs.filter(o => !o.dead && o.y >= lim);
  }
};
