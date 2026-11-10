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
// 遠くからでも「ここでお菓子がもらえる」と分かるように：大きく光る家・お菓子の山盛りのお皿・「おかし +8」の看板・矢印
function drawHouse(o, y) {
  const left = o.x < 50, x0 = left ? 0 : 84, w = 16, lit = !o.used, d = left ? 1 : -1;
  const pulse = 0.5 + 0.5 * Math.sin(nowT * 5);
  if (lit) glow(left ? 12 : 88, y + 4, 34, 'rgba(255,190,70,1)', 0.45 + 0.15 * pulse);
  rect(x0, y - 11, w, 22, lit ? '#6b3f8f' : '#4a3a68');
  rect(x0, y - 11, w, 8, 'rgba(0,0,0,0.3)');
  g.fillStyle = lit ? '#e8681a' : '#2a1650'; g.beginPath();                      // 屋根（明かりがついているとオレンジ）
  g.moveTo(sx(x0 - 1), sy(y - 10)); g.lineTo(sx(x0 + w / 2), sy(y - 19)); g.lineTo(sx(x0 + w + 1), sy(y - 10)); g.fill();
  rect(x0 + 2, y - 6, 4, 4, lit ? '#fff0a0' : '#6b5a8a'); rect(x0 + 10, y - 6, 4, 4, lit ? '#fff0a0' : '#6b5a8a');
  const dx = left ? x0 + w - 5.5 : x0 + 0.5;                                    // ドアは道側
  rect(dx - 0.5, y - 0.5, 6, 11.5, lit ? '#fff' : '#3a2858');
  rect(dx, y, 5, 11, lit ? '#ffb13d' : '#2a1c44');
  if (lit) circle(dx + (left ? 1 : 4), y + 6, 0.5, '#fff', null);
  // お菓子のお皿（山盛り）
  const bx = left ? 19.5 : 80.5, by = y + 8;
  g.fillStyle = lit ? '#8a5a2b' : '#4a3a2a';
  g.beginPath(); g.arc(sx(bx), sy(by), 5.6 * S, 0, Math.PI); g.fill();
  if (lit) {
    const cols = ['#ff5fa0', '#ffd23f', '#6ad0ff', '#7ddc5a', '#ff8a3d', '#c08aff', '#fff'];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i + 0.5) / 9 * Math.PI, rr0 = (i % 3 === 1 ? 2.8 : 4.2);
      circle(bx + Math.cos(a) * rr0 * (i < 6 ? 1 : 0.5), by - 0.2 + Math.sin(a) * rr0 * (i < 6 ? 0.9 : 0.6) - (i >= 6 ? 1.6 : 0), 1.6, cols[i % 7], null);
    }
    glow(bx, by - 2, 10, 'rgba(255,240,150,1)', 0.4 + 0.2 * pulse);
    // 看板「おかし +8」
    const bob = Math.sin(nowT * 5) * 1.1, sxc = left ? 31 : 69, syc = y - 21 + bob, bw = 34, bh = 12;
    g.fillStyle = '#ff7a1a'; g.strokeStyle = '#fff'; g.lineWidth = 0.9 * S;
    rr(g, sx(sxc - bw / 2), sy(syc - bh / 2), bw * S, bh * S, 3.2 * S); g.fill(); g.stroke();
    g.beginPath();                                                                // 吹き出しのしっぽ（家のほうへ）
    g.moveTo(sx(sxc - d * 10), sy(syc + bh / 2 - 0.5)); g.lineTo(sx(sxc - d * 17), sy(syc + bh / 2 + 5)); g.lineTo(sx(sxc - d * 5), sy(syc + bh / 2 - 0.5)); g.closePath(); g.fill(); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + 6 * S + 'px ' + FONT;
    g.lineWidth = 1.3 * S; g.strokeStyle = '#8a2f00'; g.fillStyle = '#fff';
    g.strokeText('おかし +' + CFG.houseGive, sx(sxc + 1.5), sy(syc + 0.4)); g.fillText('おかし +' + CFG.houseGive, sx(sxc + 1.5), sy(syc + 0.4));
    circle(sxc - bw / 2 + 4.2, syc, 2, '#ff5fa0', '#fff', 0.4);
    // 矢印（家のほうへ）
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = clamp(0.25 + 0.75 * Math.max(0, Math.sin(nowT * 7 - i * 0.9)), 0, 1);
      const ax = (left ? 40 : 60) - d * i * 5.5;
      g.fillStyle = '#ffd23f'; g.beginPath();
      g.moveTo(sx(ax - d * 3), sy(y + 2)); g.lineTo(sx(ax + d * 1.5), sy(y - 2)); g.lineTo(sx(ax + d * 1.5), sy(y + 6)); g.fill();
    }
    g.globalAlpha = 1;
  } else {
    circle(left ? 14 : 86, y + 3, 2, '#ffe0b8', null);                          // 住人が手を振る
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
  // カボチャのバケツ（持ち手つき）。お菓子が入っていて、減ると中身も減る
  drawBucket(x - r * 2.1, y + r * 0.7, candy);
  g.globalAlpha = 1;
  if (Game.result === 'lose') drawPrank(x, y);
}

// ハロウィンのお菓子入れ（ジャック・オ・ランタンのバケツ）
function drawBucket(bx, by, candy) {
  const bw = 3.3, bh = 3;
  const cols = ['#ff5fa0', '#ffd23f', '#6ad0ff', '#7ddc5a', '#c08aff', '#fff'];
  g.strokeStyle = '#2a2a3a'; g.lineWidth = 0.45 * S; g.lineCap = 'round';           // 持ち手
  g.beginPath(); g.arc(sx(bx), sy(by - bh * 0.6), bw * 0.95 * S, Math.PI, 0); g.stroke();
  const n = candy <= 0 ? 0 : Math.min(7, 1 + Math.ceil(candy / 4));                  // 中身のお菓子
  for (let i = 0; i < n; i++) circle(bx - bw * 0.7 + (i % 4) * bw * 0.47, by - bh * 0.7 - (i >= 4 ? 1.1 : 0), 0.95, cols[i % 6], null);
  g.fillStyle = '#e8681a'; g.strokeStyle = '#8a3d00'; g.lineWidth = 0.4 * S;         // バケツ本体（かぼちゃ色）
  g.beginPath(); g.moveTo(sx(bx - bw), sy(by - bh * 0.7)); g.lineTo(sx(bx + bw), sy(by - bh * 0.7));
  g.lineTo(sx(bx + bw * 0.75), sy(by + bh)); g.lineTo(sx(bx - bw * 0.75), sy(by + bh)); g.closePath(); g.fill(); g.stroke();
  rect(bx - bw - 0.2, by - bh * 0.85, bw * 2 + 0.4, 0.9, '#c4560f');                // ふち
  g.fillStyle = '#3a1500';                                                           // ジャック・オ・ランタンの顔
  g.beginPath(); g.moveTo(sx(bx - bw * 0.55), sy(by - 0.2)); g.lineTo(sx(bx - bw * 0.15), sy(by - 0.2)); g.lineTo(sx(bx - bw * 0.35), sy(by - 1)); g.fill();
  g.beginPath(); g.moveTo(sx(bx + bw * 0.55), sy(by - 0.2)); g.lineTo(sx(bx + bw * 0.15), sy(by - 0.2)); g.lineTo(sx(bx + bw * 0.35), sy(by - 1)); g.fill();
  rect(bx - bw * 0.4, by + 0.7, bw * 0.8, 0.6, '#3a1500');
}

// ---------- 画面の上の表示 ----------
let meterV = CFG.candy0, meterFlash = 0, meterFlashCol = '#fff', prevCandy = CFG.candy0;
const METER_MAX = 20;

// お菓子メーター：キャラの頭上に浮かぶバー（飴のアイコン＋残量バー＋数）。減ると縮み、少ないと赤く点滅
function drawCandyMeter(cx, low) {
  const C = CFG;
  if (Game.candy > prevCandy) { meterFlash = 0.35; meterFlashCol = '#fff6a0'; }
  else if (Game.candy < prevCandy && Game.mode === 'play') { meterFlash = Game.candy < prevCandy - 1 ? 0.4 : 0.12; meterFlashCol = '#ff8080'; }
  prevCandy = Game.candy;
  meterV += (Game.candy - meterV) * 0.25;
  meterFlash = Math.max(0, meterFlash - 1 / 60);
  const lvl = meterV / METER_MAX;
  const mid = clamp(cx, 22, 78) + (low && Game.mode === 'play' ? Math.sin(nowT * 40) * 0.5 : 0);
  const W = 38, H = 7.2, x0 = mid - W / 2, y0 = C.childY - 22;
  const col = Game.candy <= 3 ? '#ff5a5a' : Game.candy <= 7 ? '#ffd23f' : '#7ddc5a';
  // 土台
  g.fillStyle = 'rgba(26,18,54,0.78)'; rr(g, sx(x0), sy(y0), W * S, H * S, H / 2 * S); g.fill();
  g.strokeStyle = low ? `rgba(255,90,90,${0.6 + 0.4 * Math.sin(nowT * 12)})` : 'rgba(255,255,255,0.35)'; g.lineWidth = 0.6 * S; g.stroke();
  // 残量バー
  const bx0 = x0 + 9.5, bw = 20, by0 = y0 + 1.9, bh = H - 3.8;
  g.fillStyle = 'rgba(255,255,255,0.15)'; rr(g, sx(bx0), sy(by0), bw * S, bh * S, bh / 2 * S); g.fill();
  const fw = Math.max(bh, bw * clamp(lvl, 0, 1));
  if (Game.candy > 0) { g.fillStyle = col; rr(g, sx(bx0), sy(by0), fw * S, bh * S, bh / 2 * S); g.fill(); }
  if (meterFlash > 0) { g.globalAlpha = meterFlash * 2; g.fillStyle = meterFlashCol; rr(g, sx(bx0), sy(by0), bw * S, bh * S, bh / 2 * S); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(26,18,54,0.7)';                                            // 目盛り（5 個ごと）
  for (let i = 1; i < 4; i++) g.fillRect(sx(bx0 + bw * i / 4) - 0.2 * S, sy(by0), 0.4 * S, bh * S);
  // 飴のアイコン（左）
  const ix = x0 + 4.4, iy = y0 + H / 2;
  g.fillStyle = '#ff5fa0';
  g.beginPath(); g.moveTo(sx(ix - 3.6), sy(iy - 1.8)); g.lineTo(sx(ix - 1.2), sy(iy)); g.lineTo(sx(ix - 3.6), sy(iy + 1.8)); g.fill();
  g.beginPath(); g.moveTo(sx(ix + 3.6), sy(iy - 1.8)); g.lineTo(sx(ix + 1.2), sy(iy)); g.lineTo(sx(ix + 3.6), sy(iy + 1.8)); g.fill();
  circle(ix, iy, 2.1, '#ff8ec0', '#fff', 0.35);
  // 数（右）
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 ' + 5.2 * S + 'px ' + FONT;
  g.lineWidth = 1.1 * S; g.strokeStyle = '#2a1650'; g.fillStyle = low ? '#ff8a8a' : '#fff';
  const tx = x0 + W - 4.6, ty = y0 + H / 2 + 0.3;
  g.strokeText(Game.candy, sx(tx), sy(ty)); g.fillText(Game.candy, sx(tx), sy(ty));
  if (low && Game.mode === 'play') {
    g.globalAlpha = 0.6 + 0.4 * Math.sin(nowT * 12); g.font = '900 ' + 4.4 * S + 'px ' + FONT;
    g.lineWidth = 1 * S; g.fillStyle = '#ff6b6b';
    g.strokeText('あぶない！', sx(mid), sy(y0 - 3.4)); g.fillText('あぶない！', sx(mid), sy(y0 - 3.4));
    g.globalAlpha = 1;
  }
}

// 夜 → 朝のタイムライン：左の月（21:00）から右の朝日（6:00）へ。印の丸は時計の文字盤で、いまの時刻と進みを示す
function drawTimeline() {
  const p = Game.p(), ck = clockOf(Game.t), day = p > 0.78;
  const bx0 = 26, bw = 48, by = 15.5, bh = 3.4;
  g.fillStyle = 'rgba(26,18,54,0.62)'; rr(g, sx(9), sy(2), 82 * S, 24 * S, 6 * S); g.fill();
  // バー（夜の紫 → 朝のオレンジ）
  const grad = g.createLinearGradient(sx(bx0), 0, sx(bx0 + bw), 0);
  grad.addColorStop(0, '#5b4bb5'); grad.addColorStop(0.7, '#b05a9a'); grad.addColorStop(1, '#ffb347');
  g.fillStyle = 'rgba(255,255,255,0.16)'; rr(g, sx(bx0), sy(by), bw * S, bh * S, bh / 2 * S); g.fill();
  g.fillStyle = grad; rr(g, sx(bx0), sy(by), Math.max(bh, bw * p) * S, bh * S, bh / 2 * S); g.fill();
  // 左：月と 21:00
  circle(15, 14.6, 3.6, '#fff6c8', null); circle(16.5, 13.6, 3, '#2d2252', null);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d9c8ff'; g.font = '900 ' + 3.6 * S + 'px ' + FONT;
  g.fillText('21:00', sx(15), sy(21.6));
  // 右：朝日と「朝 6:00」（ここまで生き延びればゴール）
  const sxr = 85, syr = 14.6;
  g.strokeStyle = '#ffb347'; g.lineWidth = 0.6 * S;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + nowT * 0.5; g.beginPath(); g.moveTo(sx(sxr + Math.cos(a) * 4.6), sy(syr + Math.sin(a) * 4.6)); g.lineTo(sx(sxr + Math.cos(a) * 6.2), sy(syr + Math.sin(a) * 6.2)); g.stroke(); }
  circle(sxr, syr, 3.6, '#ffb347', '#fff', 0.5);
  g.fillStyle = '#ffd9a0'; g.fillText('朝 6:00', sx(85), sy(21.6));
  // 印（時計の文字盤）：いまの時刻
  const mx = bx0 + bw * p, my = by + bh / 2;
  circle(mx, my, 4.6, '#fff', '#2a1650', 0.8);
  const hAng = ((ck.h % 12) + ck.m / 60) * Math.PI / 6 - Math.PI / 2, mAng = ck.m * Math.PI / 30 - Math.PI / 2;
  g.strokeStyle = '#2a1650'; g.lineCap = 'round';
  g.lineWidth = 0.7 * S; g.beginPath(); g.moveTo(sx(mx), sy(my)); g.lineTo(sx(mx + Math.cos(hAng) * 2.3), sy(my + Math.sin(hAng) * 2.3)); g.stroke();
  g.lineWidth = 0.45 * S; g.beginPath(); g.moveTo(sx(mx), sy(my)); g.lineTo(sx(mx + Math.cos(mAng) * 3.3), sy(my + Math.sin(mAng) * 3.3)); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; circle(mx + Math.cos(a) * 3.9, my + Math.sin(a) * 3.9, 0.22, '#8a78c8', null); }
  // 印の上に、いまの時刻の数字
  g.font = '900 ' + 6.2 * S + 'px ' + FONT; g.lineWidth = 1.3 * S; g.strokeStyle = '#2a1650'; g.fillStyle = '#fff';
  g.strokeText(ck.text, sx(clamp(mx, 40, 60)), sy(8.4)); g.fillText(ck.text, sx(clamp(mx, 40, 60)), sy(8.4));
  g.textAlign = 'center';
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

  // お菓子メーター（キャラの頭上）と、夜 → 朝のタイムライン（画面の上）
  if (Game.mode !== 'title') drawCandyMeter(Game.x, Game.candy <= 3);
  drawTimeline();

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
