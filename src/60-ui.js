// ===== 操作・ループ・結果 =====
const BEST_KEY = 'okashi-halloween-best';
function loadBest() { try { return parseFloat(localStorage.getItem(BEST_KEY)) || 0; } catch (_) { return 0; } }
function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (_) {} }
const fmt = n => n.toLocaleString('ja-JP');

let shownResult = false, last = 0;

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
}

function retry() {
  Game.reset();
  shownResult = false;
  popups.length = 0;
  $('result').classList.remove('show', 'wait');
  $('title').classList.remove('hide');
  Game.begin();   // 「もう一回」は前置きなしですぐ走る
  $('title').classList.add('hide');
}

function showResult() {
  shownResult = true;
  const win = Game.result === 'win';
  $('rHead').textContent = win ? '朝まで 生き延びた！' : 'お菓子が 切れた…';
  $('rSub').textContent = win ? '' : '（イタズラの絵は Phase 2 で入ります）';
  $('rClock').textContent = clockOf(Game.t).text;
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
      addPopup('+1', e.x, CFG.childY - (e.y - Game.dist) - 4, 5, '#ffd23f', 0.6);
    } else if (e.type === 'eat') {
      Snd.eat();
    } else if (e.type === 'hit') {
      Snd.hit(); shakeT = 0.2;
      addPopup('-' + e.n, Game.x, CFG.childY - 16, 9, '#ff6b6b', 0.9);
    } else if (e.type === 'end') {
      Snd.end(e.result === 'win');
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
