// ===== 操作・ループ・結果 =====
const BEST_KEY = 'okashi-halloween-best';
function loadBest() { try { return parseFloat(localStorage.getItem(BEST_KEY)) || 0; } catch (_) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (_) {} }
const fmt = n => n.toLocaleString('ja-JP');

let shownResult = false, last = 0;
// 最後にお菓子を取った相手ごとのイタズラ
const PRANK_TEXT = {
  ghost: 'シーツをかぶせられて、おばけの仲間に',
  pumpkin: '頭に カボチャを かぶせられた',
  witch: 'カエルに されちゃった',
  eat: '顔じゅう 落書きされた'
};
const PRANK_POP = { ghost: 'おばけの 仲間入り！', pumpkin: 'カボチャ ずきん！', witch: 'ケロッ！', eat: 'らくがき！' };

function bindUI() {
  // 指を動かした量で子どもを動かす（指の位置には合わせない）
  let dragId = null, lastX = 0;
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    Snd.init();
    if (Game.mode === 'title') { Game.begin(); }
    dragId = e.pointerId; lastX = e.clientX;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== dragId) return;
    const dx = (e.clientX - lastX) / (S / DPR);   // 論理単位
    lastX = e.clientX;
    Game.move(dx * CFG.dragGain);
  });
  const up = e => { if (e.pointerId === dragId) dragId = null; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  window.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); Game.keyDir = -1; if (Game.mode === 'title') { Snd.init(); Game.begin(); } }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); Game.keyDir = 1; if (Game.mode === 'title') { Snd.init(); Game.begin(); } }
    else if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (Game.mode === 'title') { Snd.init(); Game.begin(); }
      else if (Game.mode === 'over' && !$('result').classList.contains('wait')) { Snd.init(); retry(); }
    }
  });
  window.addEventListener('keyup', e => {
    const k = e.key;
    if ((k === 'ArrowLeft' || k === 'a' || k === 'A') && Game.keyDir < 0) Game.keyDir = 0;
    if ((k === 'ArrowRight' || k === 'd' || k === 'D') && Game.keyDir > 0) Game.keyDir = 0;
  });
  window.addEventListener('resize', resize);
  window.addEventListener('contextmenu', e => e.preventDefault());
  $('retry').addEventListener('click', () => { Snd.init(); retry(); });
  $('share').addEventListener('click', share);
}

function retry() {
  Game.reset();
  shownResult = false;
  popups.length = 0; parts.length = 0; munchT = 0; meterV = CFG.candy0; prevCandy = CFG.candy0; meterFlash = 0;
  $('result').classList.remove('show', 'wait');
  $('title').classList.remove('hide');
  Game.begin();   // 「もう一回」は前置きなしですぐ走る
  $('title').classList.add('hide');
}

function showResult() {
  shownResult = true;
  const win = Game.result === 'win';
  $('rHead').textContent = win ? '朝まで 生き延びた！' : 'お菓子が 切れた…';
  const f = Game.fat();
  $('rSub').textContent = win ? (f >= 0.75 ? 'ぱんぱんの まんまる！' : f >= 0.45 ? 'ちょっと まるくなった' : 'ほっそり 生還') : PRANK_TEXT[Game.cause] || '';
  $('rClock').textContent = clockOf(Game.t).text;
  $('rLeft').textContent = fmt(Game.candy);
  $('rEaten').textContent = fmt(Game.eaten);
  $('rPicked').textContent = fmt(Game.picked);
  $('rStolen').textContent = fmt(Game.stolen);
  const best = loadBest();
  const isBest = Game.t > best + 0.01;
  if (isBest) saveBest(Game.t);
  $('rBest').textContent = isBest && best > 0 ? 'ベスト こうしん！' : best > 0 ? 'ベスト ' + clockOf(Math.max(best, Game.t)).text : '';
  const el = $('result');
  el.classList.add('show', 'wait');   // 指が離れる前にボタンを押してしまわないように、少しの間は触れない
  setTimeout(() => el.classList.remove('wait'), 700);
}

function reactToEvents() {
  for (const e of Game.events) {
    if (e.type === 'start') {
      $('title').classList.add('hide');
    } else if (e.type === 'pick') {
      Snd.pick(e.chain);
      const py = CFG.childY - (e.y - Game.dist);
      burst(e.x, py, '#ffe27a', 5, 22, 0.45);
      addPopup(e.chain >= 3 ? e.chain + 'れんぞく！' : '+1', e.x, py - 4, e.chain >= 3 ? 5.5 : 5, e.chain >= 5 ? '#ff9ad6' : '#ffd23f', 0.6);
    } else if (e.type === 'eat') {
      Snd.eat(Game.candy <= 3 && Game.mode === 'play');
      munchT = 0.16;
    } else if (e.type === 'hit') {
      shakeT = 0.2;
      if (e.k === 'pumpkin') { Snd.hitPumpkin(); addPopup('つまずいた！', Game.x, CFG.childY - 22, 6, '#ffb347', 0.9); }
      else if (e.k === 'ghost') { Snd.hitGhost(); addPopup('「ちょうだい！」', Game.x, CFG.childY - 22, 6, '#e8e0ff', 0.9); }
      else { Snd.hitWitch(); addPopup('さらわれた！', Game.x, CFG.childY - 22, 6, '#d6a6ff', 0.9); }
      burst(Game.x, CFG.childY, '#ff6b6b', 8, 34, 0.5);
      addPopup('-' + e.n, Game.x, CFG.childY - 16, 9, '#ff6b6b', 0.9);
    } else if (e.type === 'house') {
      Snd.house();
      const py = CFG.childY - (e.y - Game.dist);
      burst(e.x < 50 ? 14 : 86, py + 4, '#ffd23f', 16, 40, 0.8);
      addPopup('どうぞ！ +' + e.n, e.x < 50 ? 34 : 66, py - 6, 7, '#ffcf5a', 1.1);
    } else if (e.type === 'witch') {
      Snd.witch();
    } else if (e.type === 'end') {
      if (e.result === 'win') { Snd.dawn(); addPopup('朝に なった！', 50, 70, 11, '#fff6c8', 2.4); }
      else { Snd.prank(); addPopup(PRANK_POP[e.cause] || 'イタズラ！', 50, 100, 10, '#ff9a3d', 1.8); }
    }
  }
  Game.events.length = 0;
}

function frame(ts) {
  const dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
  last = ts; nowT += dt;
  Game.step(dt);
  reactToEvents();
  if (Game.mode === 'over' && !shownResult) showResult();
  updateVisual(dt);
  render();
  requestAnimationFrame(frame);
}

// ===== 共有（戦利品の袋のカード）=====
function shareText() {
  const win = Game.result === 'win';
  const tag = ' #お菓子を食べ続けないと死ぬゲーム';
  if (win) return 'お菓子を食べ続けないと死ぬゲームで、朝まで生き延びた！ 食べたお菓子は ' + fmt(Game.eaten) + ' 個、のこり ' + fmt(Game.candy) + ' 個。' + tag;
  return 'お菓子を食べ続けないと死ぬゲームで、' + clockOf(Game.t).text + ' に力尽きた…（' + (PRANK_TEXT[Game.cause] || 'イタズラされた') + '）' + tag;
}
function shareUrl() {
  const web = /^https?:/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)/.test(location.host);
  return web ? location.origin + location.pathname : CFG.shareUrl;
}
function makeShareImage() {
  return new Promise(resolve => {
    const Wd = 1080, Ht = 1350, win = Game.result === 'win';
    const cc = document.createElement('canvas');
    cc.width = Wd; cc.height = Ht;
    const c = cc.getContext('2d');
    const bg = c.createLinearGradient(0, 0, 0, Ht);
    bg.addColorStop(0, '#1a1236'); bg.addColorStop(1, win ? '#7a4a6b' : '#3a2060');
    c.fillStyle = bg; c.fillRect(0, 0, Wd, Ht);
    c.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) { c.globalAlpha = 0.3 + hash(i, 5) * 0.5; c.fillRect(hash(i, 1) * Wd, hash(i, 2) * 500, 5, 5); }
    c.globalAlpha = 1;
    c.fillStyle = '#2a1650'; c.strokeStyle = '#ffb347'; c.lineWidth = 10;
    rr(c, 90, 150, Wd - 180, Ht - 330, 50); c.fill(); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#ffb347'; c.font = 'bold 44px ' + FONT; c.fillText('ハロウィンの夜', Wd / 2, 110);
    c.font = '900 54px ' + FONT; c.fillText('お菓子を食べ続けないと死ぬゲーム', Wd / 2, 250);
    c.fillStyle = '#fff'; c.font = '900 92px ' + FONT; c.fillText(win ? '朝まで 生き延びた！' : 'お菓子が 切れた…', Wd / 2, 400);
    c.fillStyle = '#d9c8ff'; c.font = '52px ' + FONT; c.fillText(win ? (Game.fat() >= 0.75 ? 'ぱんぱんの まんまる！' : '無事に 朝を むかえた') : (PRANK_TEXT[Game.cause] || ''), Wd / 2, 480);
    c.fillStyle = '#ffd23f'; c.font = '900 210px ' + FONT; c.fillText(clockOf(Game.t).text, Wd / 2, 700);
    c.fillStyle = '#d9c8ff'; c.font = '44px ' + FONT; c.fillText('生き延びた時刻', Wd / 2, 760);
    const rows = [['食べた数', fmt(Game.eaten) + ' 個'], ['拾った数', fmt(Game.picked) + ' 個'], ['のこったお菓子', fmt(Game.candy) + ' 個']];
    rows.forEach(([a, b], i) => {
      const y = 880 + i * 100;
      c.strokeStyle = '#ffffff44'; c.lineWidth = 3; c.setLineDash([12, 10]); c.beginPath(); c.moveTo(170, y + 28); c.lineTo(Wd - 170, y + 28); c.stroke(); c.setLineDash([]);
      c.textAlign = 'left'; c.fillStyle = '#d9c8ff'; c.font = '48px ' + FONT; c.fillText(a, 180, y);
      c.textAlign = 'right'; c.fillStyle = '#fff'; c.font = 'bold 56px ' + FONT; c.fillText(b, Wd - 180, y);
    });
    // 戦利品の袋（のこった数だけお菓子が入っている）
    const bx = 130, by = 1215;
    c.fillStyle = '#e8681a'; c.beginPath(); c.arc(bx, by, 52, 0, 6.2832); c.fill();
    c.fillStyle = '#ffd23f'; c.fillRect(bx - 8, by - 72, 16, 22);
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = 'bold 44px ' + FONT; c.fillText(Math.min(Game.candy, 99), bx, by + 15);
    c.textAlign = 'center'; c.fillStyle = '#d9c8ff'; c.font = '38px ' + FONT;
    c.fillText(shareUrl(), Wd / 2 + 60, Ht - 60);
    cc.toBlob(resolve, 'image/png');
  });
}
async function share() {
  const text = shareText(), url = shareUrl();
  try {
    if (navigator.canShare && navigator.share) {
      const blob = await makeShareImage();
      const file = new File([blob], 'okashi-halloween.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) await navigator.share({ text, url, files: [file] });
      else await navigator.share({ text, url });
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return;
  }
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank', 'noopener');
}
