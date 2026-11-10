// ===== 描画（Phase 1 は仮の絵：丸と四角）=====
const $ = id => document.getElementById(id);
const cv = $('cv'), g = cv.getContext('2d');
const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic UI","Meiryo",sans-serif';
let S = 1, OX = 0, OY = 0, DPR = 1, nowT = 0, shakeT = 0;
const popups = [];

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  S = Math.min(w / CFG.W, h / CFG.H) * DPR;
  OX = (cv.width - CFG.W * S) / 2; OY = (cv.height - CFG.H * S) / 2;
}
const sx = x => OX + x * S;
const sy = y => OY + y * S;
const ly = o => CFG.childY - (o.y - Game.dist);   // 物の画面上の y

function addPopup(text, x, y, size, color, life) {
  popups.push({ text, x, y, size, color, life: life || 0.8, t: 0 });
}

function updateVisual(dt) {
  shakeT = Math.max(0, shakeT - dt);
  for (const p of popups) p.t += dt;
  for (let i = popups.length - 1; i >= 0; i--) if (popups[i].t > popups[i].life) popups.splice(i, 1);
}

function circle(x, y, r, fill, stroke, lw) {
  g.beginPath(); g.arc(sx(x), sy(y), r * S, 0, 6.2832);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = (lw || 0.6) * S; g.stroke(); }
}

function drawCandy(o, y) {
  circle(o.x, y, o.r * 0.85, '#ffd23f', '#b8860b');
  circle(o.x - 0.8, y - 0.8, o.r * 0.3, '#fff8', null);
}
function drawPumpkin(o, y) {
  circle(o.x, y, o.r, '#f07a1a', '#8a3d00', 0.8);
  g.fillStyle = '#3a1500';
  const e = o.r * 0.28;
  g.fillRect(sx(o.x - e * 1.6), sy(y - e * 0.8), e * S, e * S);
  g.fillRect(sx(o.x + e * 0.6), sy(y - e * 0.8), e * S, e * S);
  g.fillRect(sx(o.x - e * 1.2), sy(y + e * 0.7), e * 2.4 * S, e * 0.7 * S);
}
function drawGhost(o, y) {
  const w = Math.sin(nowT * 5 + o.ph) * 1.2;
  const a = o.flee ? Math.max(0, 1 - (o.fade || 0) / 0.5) : 1;
  g.globalAlpha = 0.9 * a;
  circle(o.x + w, y, o.r, '#f4f0ff', '#8a78c8', 0.7);
  g.fillStyle = '#2a1650';
  g.fillRect(sx(o.x + w - 2.2), sy(y - 1.2), 1.2 * S, 1.8 * S);
  g.fillRect(sx(o.x + w + 1), sy(y - 1.2), 1.2 * S, 1.8 * S);
  g.globalAlpha = 1;
}
// 玄関の明かりがついた家（道の端）
function drawHouse(o, y) {
  const left = o.x < 50, x0 = left ? 0 : 84, w = 16;
  g.fillStyle = '#4a2f6b'; g.fillRect(sx(x0), sy(y - 9), w * S, 18 * S);
  g.fillStyle = '#2a1650'; g.beginPath();   // 屋根
  g.moveTo(sx(x0 - 1), sy(y - 9)); g.lineTo(sx(x0 + w / 2), sy(y - 17)); g.lineTo(sx(x0 + w + 1), sy(y - 9)); g.fill();
  const lit = !o.used;
  g.fillStyle = lit ? '#ffcf5a' : '#6b5a8a';
  g.fillRect(sx(left ? x0 + 3 : x0 + 3), sy(y - 5), 4 * S, 4 * S);
  g.fillRect(sx(left ? x0 + 9 : x0 + 9), sy(y - 5), 4 * S, 4 * S);
  g.fillStyle = lit ? '#ff9a3d' : '#3a2858';   // 玄関のドア（明かりがついていると目立つ）
  g.fillRect(sx(left ? x0 + w - 5 : x0), sy(y + 1), 5 * S, 8 * S);
  if (lit) { g.globalAlpha = 0.25 + 0.1 * Math.sin(nowT * 4); circle(left ? 12 : 88, y + 4, 9, '#ffcf5a'); g.globalAlpha = 1; }
}
// 魔女のほうき：予告（通る列が光る）→ 横切る
function drawWitch(o, y) {
  const dy = o.y - Game.dist;
  if (!o.launched) {
    if (dy > CFG.witchWarn) return;
    g.globalAlpha = 0.18 + 0.12 * Math.sin(nowT * 14);
    g.fillStyle = '#ff5a5a'; g.fillRect(sx(CFG.roadL), sy(y - 6), (CFG.roadR - CFG.roadL) * S, 12 * S);
    g.globalAlpha = 0.9;
    const ex = o.dir > 0 ? CFG.roadL + 4 : CFG.roadR - 4;
    g.fillStyle = '#ff5a5a'; g.font = '900 ' + 9 * S + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('!', sx(ex), sy(y));
    g.globalAlpha = 1;
    return;
  }
  const a = o.flee ? Math.max(0, 1 - (o.fade || 0) / 0.5) : 1;
  g.globalAlpha = a;
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 1 * S;   // ほうき
  g.beginPath(); g.moveTo(sx(o.x - o.dir * 9), sy(y + 1)); g.lineTo(sx(o.x + o.dir * 9), sy(y + 1)); g.stroke();
  g.fillStyle = '#d6a64a'; g.fillRect(sx(o.x - o.dir * 14 - (o.dir > 0 ? 0 : -5)), sy(y - 1), 5 * S, 4 * S);
  circle(o.x, y - 2, 3.4, '#6b3fa0', '#2a1650', 0.5);   // 魔女
  g.fillStyle = '#2a1650'; g.beginPath();                 // とんがり帽子
  g.moveTo(sx(o.x - 4), sy(y - 4)); g.lineTo(sx(o.x + 4), sy(y - 4)); g.lineTo(sx(o.x), sy(y - 12)); g.fill();
  g.globalAlpha = 1;
}
// 終わりの演出の進み（0〜1）
function endK(span) { return Game.mode === 'over' ? 1 : Game.mode === 'end' ? clamp(Game.endT / span, 0, 1) : 0; }

function drawChild(x, y) {
  const blink = Game.inv > 0 && Math.floor(nowT * 14) % 2 === 0 && Game.mode === 'play';
  if (blink) g.globalAlpha = 0.35;
  // 生還すると、食べた数に合わせてまんまる
  const fatK = Game.result === 'win' ? Game.fat() * clamp((Game.mode === 'over' ? 9 : Game.endT - 1.0) / 1.6, 0, 1) : 0;
  const r = CFG.childR * (1 + fatK * 0.9);
  if (Game.result === 'lose' && Game.cause === 'witch' && endK(0.9) > 0.5) { drawFrog(x, y); g.globalAlpha = 1; return; }
  g.fillStyle = '#1a1a26';   // 黒猫の耳
  g.beginPath();
  g.moveTo(sx(x - r), sy(y - r * 0.4)); g.lineTo(sx(x - r * 0.9), sy(y - r * 1.6)); g.lineTo(sx(x - r * 0.2), sy(y - r * 0.9)); g.fill();
  g.beginPath();
  g.moveTo(sx(x + r), sy(y - r * 0.4)); g.lineTo(sx(x + r * 0.9), sy(y - r * 1.6)); g.lineTo(sx(x + r * 0.2), sy(y - r * 0.9)); g.fill();
  circle(x, y, r, '#2d2640', '#9b8cd6', 0.5);
  g.fillStyle = '#ffe14a';
  g.fillRect(sx(x - 1.8), sy(y - 0.9), 1 * S, 1 * S);
  g.fillRect(sx(x + 0.8), sy(y - 0.9), 1 * S, 1 * S);
  g.globalAlpha = 1;
  if (Game.result === 'lose') drawPrank(x, y);
}

function drawFrog(x, y) {
  const r = CFG.childR * 1.15;
  circle(x, y + 1, r, '#58b848', '#2c6b24', 0.6);
  circle(x - r * 0.55, y - r * 0.7, r * 0.42, '#fff', '#2c6b24', 0.4);
  circle(x + r * 0.55, y - r * 0.7, r * 0.42, '#fff', '#2c6b24', 0.4);
  circle(x - r * 0.55, y - r * 0.7, r * 0.18, '#222', null);
  circle(x + r * 0.55, y - r * 0.7, r * 0.18, '#222', null);
  g.strokeStyle = '#2c6b24'; g.lineWidth = 0.5 * S;
  g.beginPath(); g.arc(sx(x), sy(y + 1), r * 0.55, 0.2, Math.PI - 0.2); g.stroke();
}

// 負けたときの大げさなイタズラ（最後にお菓子を取った相手で変わる）
function drawPrank(x, y) {
  const k = endK(0.9), cause = Game.cause;
  const drop = (1 - k) * -26;
  const r = CFG.childR;
  if (cause === 'ghost') {          // シーツをかぶせられて、おばけの仲間に
    g.globalAlpha = 0.95;
    circle(x, y - 1 + drop, r * 1.55, '#f4f0ff', '#8a78c8', 0.6);
    g.fillStyle = '#f4f0ff'; g.fillRect(sx(x - r * 1.55), sy(y - 1 + drop), r * 3.1 * S, r * 1.5 * S);
    for (let i = 0; i < 4; i++) circle(x - r * 1.2 + i * r * 0.8, y + r * 0.5 + drop, r * 0.45, '#f4f0ff', null);
    g.fillStyle = '#2a1650';
    g.fillRect(sx(x - 1.8), sy(y - 1.4 + drop), 1.2 * S, 1.8 * S);
    g.fillRect(sx(x + 0.7), sy(y - 1.4 + drop), 1.2 * S, 1.8 * S);
    g.globalAlpha = 1;
  } else if (cause === 'pumpkin') { // 頭にカボチャをかぶせられる
    const py = y - r * 0.9 + drop;
    circle(x, py, r * 1.35, '#f07a1a', '#8a3d00', 0.8);
    g.fillStyle = '#3a1500';
    g.fillRect(sx(x - 2.2), sy(py - 1), 1.3 * S, 1.3 * S);
    g.fillRect(sx(x + 0.9), sy(py - 1), 1.3 * S, 1.3 * S);
    g.fillRect(sx(x - 1.6), sy(py + 1.2), 3.2 * S, 0.9 * S);
  } else if (cause === 'eat') {     // 寄ってきたお化けたちに顔じゅう落書き
    g.strokeStyle = '#111'; g.lineWidth = 0.55 * S;
    const n = Math.floor(k * 6);
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(sx(x - r * 0.8 + (i % 3) * r * 0.7), sy(y - r * 0.6 + (i >> 1) * r * 0.5));
      g.lineTo(sx(x - r * 0.2 + (i % 3) * r * 0.7), sy(y - r * 0.1 + (i >> 1) * r * 0.5)); g.stroke();
    }
    g.fillStyle = '#d33'; g.fillRect(sx(x - 2.2), sy(y + 0.6), 4.4 * S, 0.6 * S);
  }
  // 集まってくるおばけ
  if (cause !== 'witch') {
    g.globalAlpha = 0.9;
    for (let i = 0; i < 5; i++) {
      const ang = i * 1.26 + 0.4, d = lerp(48, 11, k);
      circle(x + Math.cos(ang) * d, y - 4 + Math.sin(ang) * d * 0.7, 3.2, '#f4f0ff', '#8a78c8', 0.4);
    }
    g.globalAlpha = 1;
  }
}

function render() {
  const C = CFG;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#1a1236'; g.fillRect(0, 0, cv.width, cv.height);
  if (shakeT > 0) g.translate((Math.random() - 0.5) * 2 * S, (Math.random() - 0.5) * 2 * S);
  // 空と道
  const p = Game.p();
  const sky = g.createLinearGradient(0, 0, 0, cv.height);
  sky.addColorStop(0, `rgb(${Math.round(lerp(26, 120, p * p))},${Math.round(lerp(18, 90, p * p))},${Math.round(lerp(54, 150, p * p))})`);
  sky.addColorStop(1, '#2a1b52');
  g.fillStyle = sky; g.fillRect(-S * 50, 0, cv.width + S * 100, cv.height);
  g.fillStyle = '#3a3258';
  g.fillRect(sx(C.roadL), 0, (C.roadR - C.roadL) * S, cv.height);
  g.fillStyle = '#2a2244';   // 道の縁
  g.fillRect(sx(C.roadL), 0, 0.8 * S, cv.height);
  g.fillRect(sx(C.roadR) - 0.8 * S, 0, 0.8 * S, cv.height);
  // 流れる印
  g.fillStyle = '#ffffff22';
  const off = Game.dist % 20;
  for (let y = -20; y < C.H + 20; y += 20) g.fillRect(sx(50) - 0.5 * S, sy(y + off), 1 * S, 8 * S);

  // 朝日が差す（生還）：物と子どもの下に敷く
  if (Game.result === 'win') {
    const k = endK(1.2);
    g.fillStyle = `rgba(255,214,120,${0.4 * k})`; g.fillRect(0, 0, cv.width, cv.height);
  }

  // 物
  for (const o of Game.objs) {
    const y = ly(o);
    if (y < -12 || y > C.H + 12) continue;
    if (o.k === 'candy') drawCandy(o, y);
    else if (o.k === 'pumpkin') drawPumpkin(o, y);
    else if (o.k === 'ghost') drawGhost(o, y);
    else if (o.k === 'house') drawHouse(o, y);
    else if (o.k === 'witch') drawWitch(o, y);
  }
  drawChild(Game.x, C.childY);

  // 月が沈み、朝日が差す
  if (p < 0.75) { g.globalAlpha = 1 - p / 0.75; circle(20, 24 + p * 60, 7, '#fff6c8', null); g.globalAlpha = 1; }

  // お菓子の数（袋の上）
  const low = Game.candy <= 3;
  const shake = low && Game.mode === 'play' ? Math.sin(nowT * 40) * 0.6 : 0;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 ' + (low ? 12 : 10) * S + 'px ' + FONT;
  g.lineWidth = 1.4 * S; g.strokeStyle = '#2a1650';
  g.fillStyle = low ? '#ff6b6b' : '#ffd23f';
  const nx = sx(Game.x + shake), ny = sy(C.childY - 10);
  g.strokeText(Game.candy, nx, ny); g.fillText(Game.candy, nx, ny);

  // 時計
  g.font = '900 ' + 8 * S + 'px ' + FONT;
  g.strokeStyle = '#2a1650'; g.fillStyle = '#fff';
  const ck = clockOf(Game.t).text;
  g.strokeText(ck, sx(50), sy(10)); g.fillText(ck, sx(50), sy(10));

  // ポップアップ
  for (const q of popups) {
    const k = q.t / q.life;
    g.globalAlpha = 1 - k * k;
    g.font = '900 ' + q.size * S + 'px ' + FONT;
    g.lineWidth = 1.2 * S; g.strokeStyle = '#2a1650'; g.fillStyle = q.color;
    const px = sx(q.x), py = sy(q.y - k * 10);
    g.strokeText(q.text, px, py); g.fillText(q.text, px, py);
    g.globalAlpha = 1;
  }
}
