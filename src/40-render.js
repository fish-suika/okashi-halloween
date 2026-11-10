// ===== 描画（ハロウィンの夜）。絵は全部 Canvas で描く =====
const $ = id => document.getElementById(id);
const cv = $('cv'), g = cv.getContext('2d');
const FONT = '"Hiragino Maru Gothic ProN","Yu Gothic UI","Meiryo",sans-serif';
let S = 1, OX = 0, OY = 0, DPR = 1, nowT = 0, shakeT = 0, munchT = 0, vw = 0, vh = 0;
const popups = [], parts = [];

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth; vh = window.innerHeight;
  cv.width = Math.round(vw * DPR); cv.height = Math.round(vh * DPR);
  S = Math.min(vw / CFG.W, vh / CFG.H) * DPR;
  OX = (cv.width - CFG.W * S) / 2; OY = (cv.height - CFG.H * S) / 2;
}
const sx = x => OX + x * S;
const sy = y => OY + y * S;
const ly = o => CFG.childY - (o.y - Game.dist);   // 物の画面上の y（論理座標）
// 画面に見えている論理座標の範囲（横長・縦長の端末でも背景を端まで描くため）
function view() { return { x0: -OX / S, x1: (cv.width - OX) / S, y0: -OY / S, y1: (cv.height - OY) / S }; }
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

function addPopup(text, x, y, size, color, life) { popups.push({ text, x, y, size, color, life: life || 0.8, t: 0 }); }
function burst(x, y, color, n, speed, life) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.2832, v = (0.4 + Math.random() * 0.6) * (speed || 30);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8, life: (life || 0.6) * (0.6 + Math.random() * 0.5), t: 0, color, size: 0.7 + Math.random() * 0.9 });
  }
}

function updateVisual(dt) {
  shakeT = Math.max(0, shakeT - dt);
  munchT = Math.max(0, munchT - dt);
  for (const p of popups) p.t += dt;
  for (let i = popups.length - 1; i >= 0; i--) if (popups[i].t > popups[i].life) popups.splice(i, 1);
  for (const p of parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t > parts[i].life) parts.splice(i, 1);
  // 朝日のきらきら
  if (Game.result === 'win' && Game.mode !== 'title' && Math.random() < 0.5) {
    const v = view();
    parts.push({ x: v.x0 + Math.random() * (v.x1 - v.x0), y: Math.random() * 60, vx: 0, vy: 6, life: 1.2, t: 0, color: '#fff6c8', size: 0.8 });
  }
}

function circle(x, y, r, fill, stroke, lw) {
  g.beginPath(); g.arc(sx(x), sy(y), r * S, 0, 6.2832);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = (lw || 0.6) * S; g.stroke(); }
}
function rect(x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(sx(x), sy(y), w * S, h * S); }
function glow(x, y, r, color, a) {
  const gr = g.createRadialGradient(sx(x), sy(y), 0, sx(x), sy(y), r * S);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = a; g.fillStyle = gr; g.fillRect(sx(x - r), sy(y - r), r * 2 * S, r * 2 * S); g.globalAlpha = 1;
}
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// ---------- 背景 ----------
const HOUSE_COL = ['#4a2f6b', '#3b3f7a', '#5a2f5a', '#2f4a6b', '#6b3f4a', '#3f5a4a'];
function drawSideHouses(v) {
  const C = CFG, top = Game.dist + C.childY - v.y1 - 40, bot = Game.dist + C.childY - v.y0 + 40;
  for (let i = Math.floor(top / 38); i <= Math.ceil(bot / 38); i++) {
    const y = C.childY - (i * 38 - Game.dist);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 6; row++) {
        const edge = side < 0 ? C.roadL - 4 - row * 22 : C.roadR + 4 + row * 22;   // 道に近い側の端
        const x0 = side < 0 ? edge - 16 : edge, x1 = x0 + 16;
        if (x1 < v.x0 - 2 || x0 > v.x1 + 2) continue;
        const h = hash(i * 7 + row, side + 3);
        if (h < 0.12) {   // 木
          circle((x0 + x1) / 2, y, 7 + h * 10, '#241d3d', null);
          circle((x0 + x1) / 2 - 2, y - 2, 5, '#2c2348', null);
          continue;
        }
        const wall = HOUSE_COL[Math.floor(h * 97) % HOUSE_COL.length];
        rect(x0, y - 12, 16, 24, wall);
        rect(x0, y - 12, 16, 9, 'rgba(0,0,0,0.35)');           // 屋根の影
        rect(x0 + 1, y - 12, 14, 1.2, 'rgba(255,255,255,0.12)');   // 屋根のふち
        const lit = hash(i + row * 31, side * 5 + 11) < 0.55;
        const fx = side < 0 ? x1 - 3.5 : x0 + 0.5;               // 道に向いた壁の窓
        rect(fx, y - 7, 3, 3.5, lit ? '#ffcf5a' : '#262040');
        rect(fx, y + 1, 3, 3.5, lit && h > 0.5 ? '#ffb347' : '#262040');
        if (row === 0 && lit) glow(side < 0 ? C.roadL + 1 : C.roadR - 1, y, 14, 'rgba(255,200,90,0.9)', 0.22);
        if (row === 0 && h > 0.6) {                                // 玄関先のカボチャ
          const px = side < 0 ? C.roadL - 2.2 : C.roadR + 2.2;
          circle(px, y + 6, 1.9, '#f07a1a', null);
          glow(px, y + 6, 5, 'rgba(255,180,60,0.9)', 0.35);
        }
      }
    }
  }
}

function drawBackground(v) {
  const C = CFG, p = Game.p();
  // 空（画面の上ほど遠く）。夜が明けるにつれて地平線が赤く → 明るく
  const k = p * p;
  const sky = g.createLinearGradient(0, 0, 0, cv.height);
  sky.addColorStop(0, `rgb(${Math.round(lerp(18, 150, k))},${Math.round(lerp(12, 110, k))},${Math.round(lerp(44, 160, k))})`);
  sky.addColorStop(0.45, `rgb(${Math.round(lerp(34, 120, k))},${Math.round(lerp(24, 80, k))},${Math.round(lerp(72, 120, k))})`);
  sky.addColorStop(1, '#2a1f4a');
  g.fillStyle = sky; g.fillRect(0, 0, cv.width, cv.height);
  // 星
  g.fillStyle = '#fff';
  for (let i = 0; i < 40; i++) {
    const a = 1 - p * 1.3;
    if (a <= 0) break;
    g.globalAlpha = a * (0.4 + 0.4 * Math.sin(nowT * 2 + i));
    const x = (hash(i, 1) * (v.x1 - v.x0)) + v.x0, y = hash(i, 2) * 50 + v.y0;
    g.fillRect(sx(x), sy(y), 0.7 * S, 0.7 * S);
  }
  g.globalAlpha = 1;
  // 両側の地面（歩道）
  g.fillStyle = '#2b2447'; g.fillRect(0, 0, sx(C.roadL), cv.height); g.fillRect(sx(C.roadR), 0, cv.width, cv.height);
  g.fillStyle = '#4a4268';
  g.fillRect(sx(C.roadL - 4), 0, 4 * S, cv.height); g.fillRect(sx(C.roadR), 0, 4 * S, cv.height);
  drawSideHouses(v);
  // 道
  g.fillStyle = '#3a3258'; g.fillRect(sx(C.roadL), 0, (C.roadR - C.roadL) * S, cv.height);
  g.fillStyle = '#2f2750';   // 縁と、道のひび
  g.fillRect(sx(C.roadL), 0, 0.8 * S, cv.height); g.fillRect(sx(C.roadR) - 0.8 * S, 0, 0.8 * S, cv.height);
  g.fillStyle = '#ffffff22';
  const off = ((Game.dist % 24) + 24) % 24;
  for (let y = v.y0 - 24; y < v.y1 + 24; y += 24) rect(49.5, y + off, 1, 9, '#ffffff22');
  // 遠くのもや
  const fog = g.createLinearGradient(0, 0, 0, cv.height * 0.35);
  fog.addColorStop(0, 'rgba(26,18,54,0.7)'); fog.addColorStop(1, 'rgba(26,18,54,0)');
  g.fillStyle = fog; g.fillRect(0, 0, cv.width, cv.height * 0.35);
  // 月（沈んでいく）と朝日
  if (p < 0.78) { const my = 16 + p * 22; g.globalAlpha = 1 - p / 0.78; glow(20, my, 16, 'rgba(255,246,200,1)', 0.35); circle(20, my, 6, '#fff6c8', null); circle(18.4, my - 1.2, 1.3, 'rgba(200,190,150,0.5)', null); circle(21.5, my + 1.6, 0.9, 'rgba(200,190,150,0.5)', null); g.globalAlpha = 1; }
  if (p > 0.8) {
    const s = clamp((p - 0.8) / 0.2, 0, 1);
    glow(50, 6 - (1 - s) * -14, 70, 'rgba(255,190,110,1)', 0.55 * s);
  }
  // 朝日の色（生還）：物と子どもの下に敷く
  if (Game.result === 'win') { g.fillStyle = `rgba(255,214,120,${0.38 * endK(1.2)})`; g.fillRect(0, 0, cv.width, cv.height); }
}

// ---------- 物 ----------
function drawCandy(o, y) {
  const kind = Math.floor(o.ph / 6.2832 * 5), r = o.r * 0.85, b = Math.sin(nowT * 5 + o.ph) * 0.35;
  y += b;
  glow(o.x, y, r * 2.2, 'rgba(255,230,140,1)', 0.28);
  if (kind === 0) {          // 包み飴
    g.fillStyle = '#ff5fa0';
    g.beginPath(); g.moveTo(sx(o.x - r * 1.9), sy(y - r * 0.8)); g.lineTo(sx(o.x - r * 0.6), sy(y)); g.lineTo(sx(o.x - r * 1.9), sy(y + r * 0.8)); g.fill();
    g.beginPath(); g.moveTo(sx(o.x + r * 1.9), sy(y - r * 0.8)); g.lineTo(sx(o.x + r * 0.6), sy(y)); g.lineTo(sx(o.x + r * 1.9), sy(y + r * 0.8)); g.fill();
    circle(o.x, y, r * 0.9, '#ff8ec0', '#c93a7a', 0.4);
  } else if (kind === 1) {   // ぐるぐるキャンディ
    circle(o.x, y, r, '#fff', '#e64a4a', 0.5);
    circle(o.x, y, r * 0.55, '#e64a4a', null); circle(o.x, y, r * 0.2, '#fff', null);
  } else if (kind === 2) {   // チョコ
    rect(o.x - r, y - r * 0.7, r * 2, r * 1.4, '#6b3a1e'); rect(o.x - r * 0.6, y - r * 0.4, r * 1.2, r * 0.8, '#8a4e2a');
  } else if (kind === 3) {   // クッキー
    circle(o.x, y, r, '#d9a45a', '#a8702a', 0.4);
    circle(o.x - r * 0.35, y - r * 0.2, r * 0.17, '#5a3418', null); circle(o.x + r * 0.3, y + r * 0.25, r * 0.17, '#5a3418', null); circle(o.x + r * 0.1, y - r * 0.4, r * 0.13, '#5a3418', null);
  } else {                    // 星の飴
    g.fillStyle = '#ffd23f'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, rad = i % 2 ? r * 0.5 : r * 1.1; g.lineTo(sx(o.x + Math.cos(a) * rad), sy(y + Math.sin(a) * rad)); }
    g.closePath(); g.fill(); g.strokeStyle = '#b8860b'; g.lineWidth = 0.4 * S; g.stroke();
  }
}
function drawPumpkin(o, y) {
  const r = o.r;
  circle(o.x, y + r * 0.9, r * 0.95, 'rgba(0,0,0,0.25)', null);   // 影
  circle(o.x - r * 0.45, y, r * 0.75, '#e8681a', '#8a3d00', 0.5);
  circle(o.x + r * 0.45, y, r * 0.75, '#e8681a', '#8a3d00', 0.5);
  circle(o.x, y, r * 0.8, '#f07a1a', '#8a3d00', 0.6);
  rect(o.x - 0.6, y - r - 1.2, 1.2, 2.2, '#4a7a2a');              // へた
  glow(o.x, y, r * 1.6, 'rgba(255,200,60,1)', 0.35);
  g.fillStyle = '#ffe27a';                                           // 光る顔
  g.beginPath(); g.moveTo(sx(o.x - r * 0.55), sy(y - r * 0.15)); g.lineTo(sx(o.x - r * 0.2), sy(y - r * 0.15)); g.lineTo(sx(o.x - r * 0.38), sy(y - r * 0.55)); g.fill();
  g.beginPath(); g.moveTo(sx(o.x + r * 0.55), sy(y - r * 0.15)); g.lineTo(sx(o.x + r * 0.2), sy(y - r * 0.15)); g.lineTo(sx(o.x + r * 0.38), sy(y - r * 0.55)); g.fill();
  g.beginPath(); g.moveTo(sx(o.x - r * 0.55), sy(y + r * 0.2)); g.lineTo(sx(o.x + r * 0.55), sy(y + r * 0.2));
  g.lineTo(sx(o.x + r * 0.35), sy(y + r * 0.55)); g.lineTo(sx(o.x - r * 0.35), sy(y + r * 0.55)); g.fill();
}
function drawGhostBody(x, y, r, a, face) {
  g.globalAlpha = a;
  glow(x, y, r * 2, 'rgba(190,170,255,1)', 0.3 * a);
  g.fillStyle = '#f4f0ff'; g.strokeStyle = '#8a78c8'; g.lineWidth = 0.5 * S;
  g.beginPath();
  g.arc(sx(x), sy(y - r * 0.15), r * S, Math.PI, 0);
  g.lineTo(sx(x + r), sy(y + r * 0.9));
  for (let i = 0; i < 4; i++) g.quadraticCurveTo(sx(x + r - (i + 0.5) * r * 0.5), sy(y + r * 0.9 + (i % 2 ? -1 : 1.2)), sx(x + r - (i + 1) * r * 0.5), sy(y + r * 0.9));
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#2a1650';
  if (face === 'scared') {   // 逃げるとき
    rect(x - r * 0.5, y - r * 0.4, r * 0.3, r * 0.15, '#2a1650'); rect(x + r * 0.25, y - r * 0.4, r * 0.3, r * 0.15, '#2a1650');
    circle(x, y + r * 0.25, r * 0.15, '#2a1650', null);
  } else {
    circle(x - r * 0.35, y - r * 0.25, r * 0.17, '#2a1650', null); circle(x + r * 0.35, y - r * 0.25, r * 0.17, '#2a1650', null);
    g.beginPath(); g.ellipse(sx(x), sy(y + r * 0.2), r * 0.18 * S, r * 0.26 * S, 0, 0, 6.2832); g.fill();   // 「お菓子ちょうだい」の口
    rect(x - r * 0.62, y + r * 0.05, r * 0.28, r * 0.15, 'rgba(255,140,170,0.6)'); rect(x + r * 0.34, y + r * 0.05, r * 0.28, r * 0.15, 'rgba(255,140,170,0.6)');
  }
  g.globalAlpha = 1;
}
function drawGhost(o, y) {
  const w = Math.sin(nowT * 3 + o.ph) * 1.4, bob = Math.sin(nowT * 4 + o.ph) * 0.8;
  const a = o.flee ? Math.max(0, 1 - (o.fade || 0) / 0.6) : 0.95;
  drawGhostBody(o.x + w, y + bob, o.r, a, o.flee ? 'scared' : '');
  if (!o.flee && o.y - Game.dist < 40 && o.y - Game.dist > 0) {   // せがむ吹き出し
    g.globalAlpha = 0.85; g.font = '900 ' + 3.4 * S + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 0.9 * S; g.strokeStyle = '#2a1650'; g.fillStyle = '#fff';
    g.strokeText('ちょうだい', sx(o.x + w), sy(y - o.r * 1.9)); g.fillText('ちょうだい', sx(o.x + w), sy(y - o.r * 1.9));
    g.globalAlpha = 1;
  }
}

// 玄関の明かりがついた家（道の端）。ドアに近づくと住人が「どうぞ」
function drawHouse(o, y) {
  const left = o.x < 50, x0 = left ? 0 : 84, w = 16, lit = !o.used;
  rect(x0, y - 11, w, 22, '#5a3a80');
  rect(x0, y - 11, w, 8, 'rgba(0,0,0,0.3)');
  g.fillStyle = '#2a1650'; g.beginPath();
  g.moveTo(sx(x0 - 1), sy(y - 10)); g.lineTo(sx(x0 + w / 2), sy(y - 19)); g.lineTo(sx(x0 + w + 1), sy(y - 10)); g.fill();
  rect(x0 + 2, y - 6, 4, 4, lit ? '#ffcf5a' : '#6b5a8a'); rect(x0 + 10, y - 6, 4, 4, lit ? '#ffcf5a' : '#6b5a8a');
  const dx = left ? x0 + w - 5.5 : x0 + 0.5;                                  // ドアは道側
  rect(dx, y, 5, 11, lit ? '#ff9a3d' : '#3a2858');
  if (lit) {
    glow(left ? 14 : 86, y + 5, 16, 'rgba(255,200,90,1)', 0.45 + 0.1 * Math.sin(nowT * 4));
    circle(left ? 11 : 89, y + 10, 2.2, '#f07a1a', null);                      // 玄関先のカボチャ
  } else {
    // 住人がドアから手を振る
    circle(left ? 14 : 86, y + 3, 2, '#ffe0b8', null);
  }
}

// 魔女のほうき：予告（通る列が光る）→ 横切る
function drawWitch(o, y) {
  const dy = o.y - Game.dist, C = CFG;
  if (!o.launched) {
    if (dy > C.witchWarn) return;
    const pulse = 0.5 + 0.5 * Math.sin(nowT * 16);
    g.globalAlpha = 0.14 + 0.14 * pulse;
    rect(C.roadL, y - 7, C.roadR - C.roadL, 14, '#ff5a5a');
    g.globalAlpha = 0.55 + 0.4 * pulse;
    const ex = o.dir > 0 ? C.roadL + 5 : C.roadR - 5;
    g.fillStyle = '#ff5a5a'; g.font = '900 ' + 10 * S + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 1.2 * S; g.strokeStyle = '#2a1650'; g.strokeText('!', sx(ex), sy(y)); g.fillText('!', sx(ex), sy(y));
    g.globalAlpha = 1;
    return;
  }
  const a = o.flee ? Math.max(0, 1 - (o.fade || 0) / 0.5) : 1, d = o.dir;
  g.globalAlpha = a;
  for (let i = 1; i <= 5; i++) { g.globalAlpha = a * (0.5 - i * 0.09); circle(o.x - d * (8 + i * 3), y + 1 + Math.sin(nowT * 20 + i) * 0.8, 1.2 - i * 0.12, '#c8a6ff', null); }
  g.globalAlpha = a;
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 1 * S;                              // ほうきの柄
  g.beginPath(); g.moveTo(sx(o.x - d * 9), sy(y + 1.5)); g.lineTo(sx(o.x + d * 8), sy(y + 1.5)); g.stroke();
  g.fillStyle = '#d6a64a'; g.beginPath();                                      // 穂
  g.moveTo(sx(o.x - d * 8), sy(y + 1.5)); g.lineTo(sx(o.x - d * 14), sy(y - 1)); g.lineTo(sx(o.x - d * 14), sy(y + 4)); g.fill();
  circle(o.x, y - 1.5, 3.2, '#6b3fa0', '#2a1650', 0.5);                        // 魔女
  circle(o.x + d * 1.2, y - 1.8, 0.7, '#7aff7a', null);
  g.fillStyle = '#2a1650'; g.beginPath();                                      // とんがり帽子
  g.moveTo(sx(o.x - 4.5), sy(y - 3.8)); g.lineTo(sx(o.x + 4.5), sy(y - 3.8)); g.lineTo(sx(o.x - d * 1.5), sy(y - 12)); g.fill();
  rect(o.x - 2.4, y - 5.2, 4.8, 1, '#ffb347');
  g.globalAlpha = 1;
}

// ---------- 子ども ----------
function endK(span) { return Game.mode === 'over' ? 1 : Game.mode === 'end' ? clamp(Game.endT / span, 0, 1) : 0; }

function drawChild(x, y) {
  const blink = Game.inv > 0 && Math.floor(nowT * 14) % 2 === 0 && Game.mode === 'play';
  const fatK = Game.result === 'win' ? Game.fat() * clamp((Game.mode === 'over' ? 9 : Game.endT - 1.0) / 1.6, 0, 1) : 0;
  const frog = Game.result === 'lose' && Game.cause === 'witch' && endK(0.9) > 0.5;
  if (frog) { drawFrog(x, y); drawPrank(x, y); return; }
  if (blink) g.globalAlpha = 0.35;
  const r = CFG.childR * (1 + fatK * 0.9);
  const run = Game.mode === 'play' || Game.mode === 'title' ? Math.sin(Game.dist * 0.55) : 0;
  const candy = Game.candy, scared = candy <= 3 && Game.mode === 'play', worried = candy <= 6 && Game.mode === 'play';
  circle(x, y + r * 0.9, r * 0.95, 'rgba(0,0,0,0.28)', null);                 // 影
  // しっぽ（猫）
  g.strokeStyle = '#1a1a26'; g.lineWidth = 1.2 * S; g.lineCap = 'round';
  g.beginPath(); g.moveTo(sx(x), sy(y + r * 0.7)); g.quadraticCurveTo(sx(x + Math.sin(nowT * 7) * 3.5), sy(y + r + 3), sx(x + Math.sin(nowT * 7 + 1) * 4.5), sy(y + r + 6)); g.stroke();
  // 足
  rect(x - r * 0.6 + run * 0.9, y + r * 0.55, r * 0.5, r * 0.7, '#1a1a26'); rect(x + r * 0.1 - run * 0.9, y + r * 0.55, r * 0.5, r * 0.7, '#1a1a26');
  // 耳
  g.fillStyle = '#1a1a26';
  g.beginPath(); g.moveTo(sx(x - r * 0.95), sy(y - r * 0.3)); g.lineTo(sx(x - r * 0.8), sy(y - r * 1.65)); g.lineTo(sx(x - r * 0.1), sy(y - r * 0.85)); g.fill();
  g.beginPath(); g.moveTo(sx(x + r * 0.95), sy(y - r * 0.3)); g.lineTo(sx(x + r * 0.8), sy(y - r * 1.65)); g.lineTo(sx(x + r * 0.1), sy(y - r * 0.85)); g.fill();
  g.fillStyle = '#ff8fb8';
  g.beginPath(); g.moveTo(sx(x - r * 0.8), sy(y - r * 0.55)); g.lineTo(sx(x - r * 0.72), sy(y - r * 1.25)); g.lineTo(sx(x - r * 0.3), sy(y - r * 0.85)); g.fill();
  g.beginPath(); g.moveTo(sx(x + r * 0.8), sy(y - r * 0.55)); g.lineTo(sx(x + r * 0.72), sy(y - r * 1.25)); g.lineTo(sx(x + r * 0.3), sy(y - r * 0.85)); g.fill();
  // 体と顔
  circle(x, y, r, '#2d2640', '#9b8cd6', 0.5);
  circle(x, y + r * 0.1, r * 0.78, '#ffe0c8', null);
  // 目と口（お菓子が減るほど焦った顔）
  const ey = y - r * 0.15, ex = r * 0.36;
  if (scared) {
    circle(x - ex, ey, r * 0.24, '#fff', '#222', 0.25); circle(x + ex, ey, r * 0.24, '#fff', '#222', 0.25);
    circle(x - ex, ey, r * 0.1, '#222', null); circle(x + ex, ey, r * 0.1, '#222', null);
    circle(x + r * 0.9, y - r * 0.5 + ((nowT * 12) % 3), r * 0.18, '#7ad2ff', null);   // 汗
    g.strokeStyle = '#222'; g.lineWidth = 0.4 * S; g.beginPath();
    g.moveTo(sx(x - r * 0.3), sy(y + r * 0.5)); g.quadraticCurveTo(sx(x - r * 0.1), sy(y + r * 0.35), sx(x), sy(y + r * 0.5)); g.quadraticCurveTo(sx(x + r * 0.1), sy(y + r * 0.65), sx(x + r * 0.3), sy(y + r * 0.5)); g.stroke();
  } else {
    circle(x - ex, ey, r * 0.13, '#222', null); circle(x + ex, ey, r * 0.13, '#222', null);
    if (worried) { g.strokeStyle = '#222'; g.lineWidth = 0.35 * S; g.beginPath(); g.moveTo(sx(x - ex - r * 0.2), sy(ey - r * 0.3)); g.lineTo(sx(x - ex + r * 0.15), sy(ey - r * 0.2)); g.moveTo(sx(x + ex + r * 0.2), sy(ey - r * 0.3)); g.lineTo(sx(x + ex - r * 0.15), sy(ey - r * 0.2)); g.stroke(); }
    if (munchT > 0) circle(x, y + r * 0.45, r * 0.2, '#b8434a', null);                  // もぐもぐ
    else { g.strokeStyle = '#222'; g.lineWidth = 0.35 * S; g.beginPath(); g.arc(sx(x), sy(y + r * 0.35), r * 0.2 * S, 0.2, Math.PI - 0.2); g.stroke(); }
  }
  circle(x - r * 0.62, y + r * 0.25, r * 0.14, 'rgba(255,120,150,0.55)', null); circle(x + r * 0.62, y + r * 0.25, r * 0.14, 'rgba(255,120,150,0.55)', null);
  // お菓子袋（減るほどしぼむ）
  const bag = 1.5 + clamp(candy / 24, 0, 1) * 2.6, bx = x - r * 1.9, by = y + r * 0.5;
  circle(bx, by, bag, '#e8681a', '#8a3d00', 0.4);
  rect(bx - 0.5, by - bag - 1, 1, 1.4, '#ffd23f');
  circle(bx - bag * 0.3, by - bag * 0.25, bag * 0.22, 'rgba(255,255,255,0.4)', null);
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

// 負けたときの大げさなイタズラ（0 にした相手で変わる）
function drawPrank(x, y) {
  const k = endK(0.9), cause = Game.cause, drop = (1 - k) * -26, r = CFG.childR;
  if (cause === 'ghost') {          // シーツをかぶせられて、おばけの仲間に
    drawGhostBody(x, y - 1 + drop, r * 1.7, 0.96, '');
  } else if (cause === 'pumpkin') { // 頭にカボチャをかぶせられる
    const py = y - r * 0.9 + drop;
    circle(x, py, r * 1.4, '#f07a1a', '#8a3d00', 0.8);
    rect(x - 0.6, py - r * 1.4 - 1.2, 1.2, 2.2, '#4a7a2a');
    g.fillStyle = '#ffe27a';
    g.beginPath(); g.moveTo(sx(x - 2.4), sy(py - 0.3)); g.lineTo(sx(x - 0.8), sy(py - 0.3)); g.lineTo(sx(x - 1.6), sy(py - 1.8)); g.fill();
    g.beginPath(); g.moveTo(sx(x + 2.4), sy(py - 0.3)); g.lineTo(sx(x + 0.8), sy(py - 0.3)); g.lineTo(sx(x + 1.6), sy(py - 1.8)); g.fill();
    rect(x - 1.8, py + 0.9, 3.6, 1, '#ffe27a');
  } else if (cause === 'eat') {     // 寄ってきたお化けたちに顔じゅう落書き
    g.strokeStyle = '#111'; g.lineWidth = 0.5 * S;
    const n = Math.floor(k * 7);
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(sx(x - r * 0.8 + (i % 3) * r * 0.7), sy(y - r * 0.6 + (i >> 1) * r * 0.4));
      g.lineTo(sx(x - r * 0.2 + (i % 3) * r * 0.7), sy(y - r * 0.2 + (i >> 1) * r * 0.4)); g.stroke();
    }
    if (k > 0.6) { g.strokeStyle = '#d33'; g.beginPath(); g.moveTo(sx(x - 2.4), sy(y + 0.7)); g.quadraticCurveTo(sx(x), sy(y + 2.6), sx(x + 2.4), sy(y + 0.7)); g.stroke(); }   // ひげ・くちびる
  }
  if (cause !== 'witch') {          // 集まってくるおばけ
    for (let i = 0; i < 5; i++) {
      const ang = i * 1.26 + 0.4, d = lerp(48, 12, k);
      drawGhostBody(x + Math.cos(ang) * d, y - 4 + Math.sin(ang) * d * 0.7, 3, 0.9, '');
    }
  }
}

// ---------- 全体 ----------
function render() {
  const C = CFG, v = view();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#1a1236'; g.fillRect(0, 0, cv.width, cv.height);
  if (shakeT > 0) g.translate((Math.random() - 0.5) * 2 * S, (Math.random() - 0.5) * 2 * S);
  drawBackground(v);

  for (const o of Game.objs) {
    const y = ly(o);
    if (y < v.y0 - 22 || y > v.y1 + 22) continue;
    if (o.k === 'candy') drawCandy(o, y);
    else if (o.k === 'pumpkin') drawPumpkin(o, y);
    else if (o.k === 'ghost') drawGhost(o, y);
    else if (o.k === 'house') drawHouse(o, y);
    else if (o.k === 'witch') drawWitch(o, y);
  }
  drawChild(Game.x, C.childY);

  // きらきら
  for (const q of parts) {
    g.globalAlpha = clamp(1 - q.t / q.life, 0, 1);
    circle(q.x, q.y, q.size, q.color, null);
  }
  g.globalAlpha = 1;

  // お菓子が少ないと、画面のふちが赤くなる
  if (Game.mode === 'play' && Game.candy <= 3) {
    const a = 0.18 + 0.12 * Math.sin(nowT * 8);
    const vg = g.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.35, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.7);
    vg.addColorStop(0, 'rgba(255,40,60,0)'); vg.addColorStop(1, `rgba(255,40,60,${a})`);
    g.fillStyle = vg; g.fillRect(0, 0, cv.width, cv.height);
  }

  // お菓子の数（袋と顔の上）
  const low = Game.candy <= 3;
  const shake = low && Game.mode === 'play' ? Math.sin(nowT * 40) * 0.6 : 0;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 ' + (low ? 12 : 10) * S + 'px ' + FONT;
  g.lineWidth = 1.4 * S; g.strokeStyle = '#2a1650';
  g.fillStyle = low ? '#ff6b6b' : '#ffd23f';
  const nx = sx(Game.x + shake), ny = sy(C.childY - 11);
  if (Game.mode !== 'title') { g.strokeText(Game.candy, nx, ny); g.fillText(Game.candy, nx, ny); }

  // 時計
  const ck = clockOf(Game.t).text, day = Game.p() > 0.78;
  g.font = '900 ' + 7 * S + 'px ' + FONT;
  const tw = g.measureText(ck).width + 12 * S, th = 11 * S, tx = sx(50) - tw / 2, ty = sy(5);
  g.fillStyle = 'rgba(26,18,54,0.6)'; rr(g, tx, ty, tw, th, th / 2); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(ck, tx + 9 * S, ty + th / 2 + 0.3 * S);
  circle(50 - tw / S / 2 + 4.2, 10.5, 2.2, day ? '#ffb347' : '#fff6c8', null);
  if (!day) circle(50 - tw / S / 2 + 5.1, 10, 1.9, 'rgb(40,30,80)', null);
  g.textAlign = 'center';

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
