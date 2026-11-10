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
function drawChild(x, y) {
  const blink = Game.inv > 0 && Math.floor(nowT * 14) % 2 === 0;
  if (blink) g.globalAlpha = 0.35;
  const r = CFG.childR;
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

  // 物
  for (const o of Game.objs) {
    const y = ly(o);
    if (y < -12 || y > C.H + 12) continue;
    if (o.k === 'candy') drawCandy(o, y);
    else if (o.k === 'pumpkin') drawPumpkin(o, y);
    else if (o.k === 'ghost') drawGhost(o, y);
  }
  drawChild(Game.x, C.childY);

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
