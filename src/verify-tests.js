// ===== 自動テスト（画面なし。ボットで夜を走らせる）=====
(function () {
  const out = document.getElementById('out');
  let fail = 0;
  function check(name, cond, note) {
    if (!cond) fail++;
    const p = document.createElement('div');
    p.className = cond ? 'ok' : 'ng';
    p.textContent = (cond ? 'OK  ' : 'NG  ') + name + (note ? '  [' + note + ']' : '');
    out.appendChild(p);
  }
  function info(text) {
    const p = document.createElement('div');
    p.className = 'info'; p.textContent = '    ' + text;
    out.appendChild(p);
  }
  const H = CFG.h;
  function fresh(seed) { Game.reset(seed || 1); Game.begin(); Game.events.length = 0; }
  function clearWorld() { Game.objs = []; Game.noSpawn = true; }
  function put(k, x, y, r) { Game.objs.push({ k, x, y, r, dead: false, ph: 0 }); }
  function adv(sec) { for (let i = 0; i < Math.round(sec / H); i++) Game.step(H); }

  // --- お菓子の減り方 ---
  fresh(); clearWorld();
  adv(5);
  check('何も拾わないと 5 秒で約 4〜5 個減る（最初は 約1秒に1個）', Game.candy >= 4 && Game.candy <= 6, 'candy=' + Game.candy);
  fresh(); clearWorld();
  adv(9.9);
  check('何も拾わず 10 個を食べきると終わる（イタズラ側）', Game.mode !== 'play' && Game.result === 'lose' && Game.cause === 'eat', 't=' + Game.t.toFixed(1) + ' cause=' + Game.cause);
  // 夜が深まると減りが速い
  fresh(); clearWorld(); Game.t = 80; Game.candy = 100; const c0 = Game.candy; const e0 = Game.eatT;
  adv(5);
  check('夜の終わりは 5 秒で約 8 個以上減る（0.6〜0.65 秒に 1 個）', c0 - Game.candy >= 7, '減った=' + (c0 - Game.candy));

  // --- 拾う・取られる ---
  fresh(); clearWorld();
  put('candy', Game.x, Game.dist + 1, CFG.candyR);
  const cBefore = Game.candy;
  Game.step(H);
  check('お菓子に触れると +1', Game.candy === cBefore + 1 && Game.picked === 1, 'candy=' + Game.candy);

  fresh(); clearWorld();
  put('ghost', Game.x, Game.dist + 1, CFG.ghostR);
  Game.step(H);
  check('おばけに触れると 3 個取られ、無敵になる', Game.candy === CFG.candy0 - 3 && Game.inv > 0 && Game.lastHit === 'ghost', 'candy=' + Game.candy);
  const cAfter = Game.candy;
  put('pumpkin', Game.x, Game.dist + 0.5, CFG.pumpR);
  Game.step(H);
  check('無敵の間は続けて取られない', Game.candy === cAfter, 'candy=' + Game.candy);

  fresh(); clearWorld();
  put('pumpkin', Game.x, Game.dist + 1, CFG.pumpR);
  Game.step(H);
  check('カボチャに触れると 3 個落とし、よろける', Game.candy === CFG.candy0 - 3 && Game.stun > 0 && Game.lastHit === 'pumpkin', 'candy=' + Game.candy);

  fresh(); clearWorld(); Game.candy = 2;
  put('ghost', Game.x, Game.dist + 1, CFG.ghostR);
  Game.step(H);
  check('足りないときに取られると 0 になって終わり、最後に取った相手が記録される', Game.mode !== 'play' && Game.candy === 0 && Game.cause === 'ghost', 'cause=' + Game.cause);


  // --- 玄関・魔女 ---
  fresh(); clearWorld();
  put('house', Game.x, Game.dist + 1, 6);
  Game.step(H);
  const afterHouse = Game.candy;
  adv(0.05);
  check('玄関の前を通ると +8（1 回だけ）', afterHouse === CFG.candy0 + CFG.houseGive && Game.candy >= afterHouse - 1, 'candy=' + afterHouse);
  fresh(); clearWorld();
  { const w = { k: 'witch', x: Game.x, y: Game.dist + 1, r: 6, dead: false, ph: 0, dir: 1, launched: true }; Game.objs.push(w); }
  Game.step(H);
  check('魔女に触れると 5 個さらわれる', Game.candy === CFG.candy0 - 5 && Game.lastHit === 'witch', 'candy=' + Game.candy);
  {
    let early = 0, late = 0, gEarly = 0, gLate = 0, houses = 0;
    for (let seed = 1; seed <= 20; seed++) {
      Game.reset(seed); Game.begin(); Game.t = 10;
      for (let y = 150; y < 150 + 45 * 40; y += 45) Game.spawnSeg(y);
      early += Game.objs.filter(o => o.k === 'witch').length; gEarly += Game.objs.filter(o => o.k === 'ghost').length;
      houses += Game.objs.filter(o => o.k === 'house').length;
      Game.reset(seed); Game.begin(); Game.t = 72;
      for (let y = 150; y < 150 + 45 * 40; y += 45) Game.spawnSeg(y);
      late += Game.objs.filter(o => o.k === 'witch').length; gLate += Game.objs.filter(o => o.k === 'ghost').length;
    }
    check('魔女は夜中（約 2 時）から出る', early === 0 && late > 0, '序盤=' + early + ' 後半=' + late);
    check('玄関の家が出る', houses > 0, houses + ' 軒');
    check('夜が深まるほどおばけが増える', gLate > gEarly * 1.3, '序盤=' + gEarly + ' 後半=' + gLate);
  }
  {
    Game.reset(1); Game.begin();
    const a = Game.eatInterval(), sp0 = Game.speed(); Game.t = CFG.dur * 0.99;
    check('夜が深まるほど食べるペースと走る速さが上がる', Game.eatInterval() < a * 0.7 && Game.speed() > sp0, a.toFixed(2) + ' → ' + Game.eatInterval().toFixed(2));
  }
  // お菓子のない時間が続きすぎない
  {
    let worst = 0;
    for (let seed = 1; seed <= 30; seed++) {
      Game.reset(seed); Game.begin(); Game.t = 50;
      for (let y = 30; y < 30 + 45 * 80; y += 45) Game.spawnSeg(y);
      const ys = Game.objs.filter(o => o.k === 'candy' || o.k === 'house').map(o => o.y).sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i++) worst = Math.max(worst, ys[i] - ys[i - 1]);
    }
    check('お菓子のない道が続きすぎない（最大 ' + (CFG.speed1 * 3 | 0) + ' 以内 ≒ 3 秒）', worst <= CFG.speed1 * 3, '最大=' + worst.toFixed(0));
  }
  // --- 終わり方 ---
  for (const [cause, mk] of [['ghost', () => put('ghost', Game.x, Game.dist + 1, CFG.ghostR)], ['pumpkin', () => put('pumpkin', Game.x, Game.dist + 1, CFG.pumpR)],
      ['witch', () => Game.objs.push({ k: 'witch', x: Game.x, y: Game.dist + 1, r: 6, dead: false, ph: 0, dir: 1, launched: true })]]) {
    fresh(); clearWorld(); Game.candy = 1; mk(); Game.step(H);
    const okEnd = Game.mode === 'end' && Game.result === 'lose' && Game.cause === cause;
    adv(CFG.endLose + 0.1);
    check('最後に取った相手が「' + cause + '」ならイタズラもそれ（演出のあと結果へ）', okEnd && Game.mode === 'over', 'cause=' + Game.cause);
  }
  fresh(); clearWorld(); Game.candy = 1; adv(1.2);
  check('自分で食べきると「eat」のイタズラ', Game.cause === 'eat' && Game.mode !== 'play', 'cause=' + Game.cause);
  fresh(); clearWorld(); Game.eaten = 100;
  while (Game.mode === 'play') { Game.candy = 99; Game.step(H); }
  const fatAtEnd = Game.fat();
  adv(CFG.endWin + 0.1);
  check('生還すると夜明けの演出のあと結果へ。食べた数でまんまる', Game.result === 'win' && Game.mode === 'over' && fatAtEnd > 0.8, 'fat=' + fatAtEnd.toFixed(2));

  // --- 夜明け ---
  fresh(); clearWorld();
  while (Game.mode === 'play') { Game.candy = 99; Game.step(H); }
  check('90 秒で夜が明ける（生還）', Game.result === 'win' && Math.abs(Game.t - CFG.dur) < 0.01, 't=' + Game.t.toFixed(2));
  check('時計は 21:00 → 6:00', clockOf(0).text === '21:00' && clockOf(CFG.dur).text === '6:00', clockOf(45).text);

  // --- 通れない区画がない ---
  let blocked = 0, rows = 0;
  for (let seed = 1; seed <= 30; seed++) {
    Game.reset(seed); Game.begin(); Game.t = 60;
    for (let y = 150; y < 150 + 45 * 80; y += 45) Game.spawnSeg(y);
    const pm = Game.objs.filter(o => o.k === 'pumpkin').sort((a, b) => a.y - b.y);
    for (const a of pm) {
      // a の高さに重なるカボチャを集めて、道の端から端まで通れる隙間があるか調べる
      const near = pm.filter(b => Math.abs(b.y - a.y) < CFG.pumpR * 2 + CFG.childR * 2);
      const iv = near.map(b => [b.x - b.r - CFG.childR, b.x + b.r + CFG.childR]).sort((p, q) => p[0] - q[0]);
      let cur = CFG.roadL + CFG.childR, ok = false;
      for (const [l, r] of iv) { if (l - cur > 0.5) { ok = true; break; } cur = Math.max(cur, r); }
      if (!ok && CFG.roadR - CFG.childR - cur > 0.5) ok = true;
      rows++; if (!ok) blocked++;
    }
  }
  check('どの区画にも通れる幅がある（カボチャで道がふさがらない）', blocked === 0, rows + ' 件中 ふさがり ' + blocked);

  // --- ボット ---
  const MAXV = 90;
  function hazardPen(x, dy0, dy1) {
    let pen = 0;
    for (const o of Game.objs) {
      if (o.dead || o.hit || o.flee || (o.k !== 'pumpkin' && o.k !== 'ghost' && o.k !== 'witch')) continue;
      const dy = o.y - Game.dist;
      if (dy < -3 || dy > (o.k === 'witch' ? 90 : dy1)) continue;
      const ox = o.k === 'witch' ? Game.witchAt(o) : o.x;
      const gap = Math.abs(ox - x) - (o.r + CFG.childR);
      if (gap < 5) pen += (5 - gap) * 10 + (dy < 15 ? 20 : 0);
    }
    return pen;
  }
  function targetCandy() {
    let best = null, bd = 1e9;
    for (const o of Game.objs) {
      if (o.dead || o.used || (o.k !== 'candy' && o.k !== 'house')) continue;
      const dy = o.y - Game.dist;
      if (dy < 0 || dy > 45) continue;
      const key = o.k === 'house' ? dy - 40 : dy;   // 玄関は優先
      if (key < bd) { bd = key; best = o; }
    }
    return best;
  }
  function botMove(kind) {
    const cx = Game.x, xs = [];
    for (let x = CFG.roadL + CFG.childR; x <= CFG.roadR - CFG.childR + 0.01; x += 2.4) xs.push(x);
    let tx = cx;
    if (kind !== 'dodger') { const c = targetCandy(); if (c) tx = c.x; else tx = 50; }
    else tx = 50;
    let bx = cx, bc = 1e9;
    for (const x of xs) {
      const cost = Math.abs(x - tx) + (kind === 'collector' ? 0 : hazardPen(x, 0, 40)) + Math.abs(x - cx) * 0.02;
      if (cost < bc) { bc = cost; bx = x; }
    }
    Game.move(clamp(bx - cx, -MAXV * H, MAXV * H));
  }
  function runBot(kind, seed) {
    fresh(seed);
    let n = 0;
    while (Game.mode === 'play' && n++ < 100 * 60) { botMove(kind); Game.step(H); }
    return { win: Game.result === 'win', t: Game.t, cause: Game.cause, eaten: Game.eaten, picked: Game.picked, stolen: Game.stolen };
  }
  const SEEDS = 24;
  const stats = {};
  for (const kind of ['dodger', 'collector', 'both']) {
    const rs = [];
    for (let s = 1; s <= SEEDS; s++) rs.push(runBot(kind, s));
    const wins = rs.filter(r => r.win).length;
    const avg = rs.reduce((a, r) => a + r.t, 0) / rs.length;
    stats[kind] = { wins, avg, rs };
    info(kind + ': 生還 ' + wins + '/' + SEEDS + '、平均 ' + avg.toFixed(1) + ' 秒、拾い平均 ' + (rs.reduce((a, r) => a + r.picked, 0) / SEEDS).toFixed(0) + '、取られ平均 ' + (rs.reduce((a, r) => a + r.stolen, 0) / SEEDS).toFixed(0));
  }
  check('よけるだけのボットは朝まで持たない', stats.dodger.wins === 0, stats.dodger.wins + '/' + SEEDS);
  check('拾うだけのボットは、拾いつつよけるボットより生還が少ない', stats.collector.wins < stats.both.wins, stats.collector.wins + ' < ' + stats.both.wins);
  check('拾いつつよけるボットは朝まで届くことがある（生還 30% 以上。人間はボットより下手）', stats.both.wins >= SEEDS * 0.3, stats.both.wins + '/' + SEEDS);

  const sum = document.createElement('h2');
  sum.textContent = fail === 0 ? '全部 OK' : fail + ' 件 NG';
  sum.className = fail === 0 ? 'ok' : 'ng';
  out.appendChild(sum);
  window.__verifyFail = fail;
})();
