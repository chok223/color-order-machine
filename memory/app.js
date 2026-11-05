(function () {
  'use strict';

  var COLORS = [
    ['#E53935', '빨강', 'Red'], ['#FB8C00', '주황', 'Orange'], ['#FDD835', '노랑', 'Yellow'],
    ['#43A047', '초록', 'Green'], ['#4FC3F7', '하늘', 'Sky'], ['#1E88E5', '파랑', 'Blue'],
    ['#8E24AA', '보라', 'Purple'], ['#EC407A', '분홍', 'Pink'], ['#8D6E63', '갈색', 'Brown']
  ];
  var STORE = 'memory-game-settings';
  var DEFAULTS = { mode: 'follow', maxLen: 0, speed: 'normal', names: 'on' };
  var settings = load();

  var $ = function (id) { return document.getElementById(id); };
  var board = $('board'), startBtn = $('modes'), statusEl = $('status'), statusText = $('statusText');
  var levelEl = $('level'), retryBtn = $('retry'), winEl = $('win'), dotsEl = $('dots'), heartsEl = $('hearts'), celebrate = $('celebrate');
  var cells = [];

  // 진행 상태
  var runId = 0;          // 바뀌면 진행 중인 비동기 흐름이 멈춤
  var phase = 'idle';     // idle | show | input | success
  var seq = [], pos = 0, level = 1, hearts = 0;
  var wrongAt = -1, wrongCount = 0;
  var hintTimer = null;

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      return Object.assign({}, DEFAULTS, s || {});
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch (e) {} }

  function sleep(ms, id) {
    return new Promise(function (res, rej) {
      setTimeout(function () { id === runId ? res() : rej('cancel'); }, ms);
    });
  }
  function ignoreCancel(e) { if (e !== 'cancel') throw e; }

  // ---------- 화면 만들기 ----------
  var STAR = '<svg class="star" viewBox="0 0 100 100"><path d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 75 L21 94 L31 61 L4 40 L38 38 Z" fill="#fff" stroke="#5a3a1a" stroke-width="5" stroke-linejoin="round"/></svg>';
  COLORS.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.style.setProperty('--c', c[0]);
    b.setAttribute('aria-label', c[1]);
    b.innerHTML = STAR + '<span class="name">' + c[1] + ' / ' + c[2] + '</span>';
    b.addEventListener('pointerdown', function (e) { onTap(e, i); });
    board.appendChild(b);
    cells.push(b);
  });

  for (var h = 0; h < 3; h++) {
    heartsEl.insertAdjacentHTML('beforeend',
      '<svg class="heart" viewBox="0 0 100 90"><path d="M50 84 C10 56 4 30 22 16 C34 8 46 14 50 24 C54 14 66 8 78 16 C96 30 90 56 50 84 Z"/></svg>');
  }
  function drawHearts() {
    var hs = heartsEl.children;
    for (var i = 0; i < hs.length; i++) hs[i].classList.toggle('full', i < hearts);
  }
  function drawDots(total, done) {
    dotsEl.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('div');
      d.className = 'dot' + (i < done ? ' done' : '');
      dotsEl.appendChild(d);
    }
  }
  function setPhase(p) {
    phase = p;
    statusEl.dataset.state = p;
    statusText.textContent = p === 'show' ? '잘 봐요' : p === 'input' ? '눌러요' : '';
    board.classList.toggle('watching', p === 'show');
  }
  function applyNames() { document.body.classList.toggle('nonames', settings.names === 'off'); }

  // ---------- 빛 ----------
  function light(i, cls, ms, id) {
    cells[i].classList.add(cls);
    return sleep(ms, id).then(function () { cells[i].classList.remove(cls); });
  }
  function clearLights() {
    cells.forEach(function (c) { c.classList.remove('lit', 'hint', 'glow'); });
    clearTimeout(hintTimer);
  }

  // ---------- 순서 만들기 ----------
  function randCell(avoid) {
    var n;
    do { n = Math.floor(Math.random() * 9); } while (n === avoid);
    return n;
  }
  function nextSeq() {
    if (settings.mode === 'follow') return [randCell(seq.length ? seq[0] : -1)];
    // 기억하기: 이전 순서 + 새 칸 1개 (같은 칸이 연달아 나와도 됨)
    var max = +settings.maxLen; // 0 = 제한 없음
    if (!max || seq.length < max) return seq.concat(randCell(-1));
    var s = [];
    for (var i = 0; i < max; i++) s.push(randCell(-1));
    return s;
  }

  // ---------- 흐름 ----------
  function reset() {
    runId++;
    clearLights();
    celebrate.classList.remove('show');
    seq = []; pos = 0; level = 1; hearts = 0; wrongAt = -1; wrongCount = 0;
    drawHearts(); drawDots(0, 0);
    heartsEl.style.visibility = 'hidden';
    levelEl.textContent = '';
    setPhase('idle');
    startBtn.hidden = false;
    retryBtn.hidden = true;
    winEl.hidden = true;
  }

  function startGame() {
    startBtn.hidden = true;
    hearts = settings.mode === 'memory' ? 3 : 0; // 기억하기: 하트 = 목숨
    heartsEl.style.visibility = settings.mode === 'memory' ? 'visible' : 'hidden';
    drawHearts();
    stage();
  }

  function stage() {
    var id = ++runId;
    clearLights();
    seq = nextSeq();
    levelEl.textContent = settings.mode === 'memory' ? level + '단계' : '';
    pos = 0; wrongAt = -1; wrongCount = 0;
    drawDots(seq.length, 0);
    var p;
    if (settings.mode === 'follow') {
      p = sleep(level === 1 ? 2000 : 600, id).then(function () { beginInput(); cells[seq[0]].classList.add('lit'); });
    } else {
      p = sleep(level === 1 ? 2000 : 800, id).then(function () { return playSeq(id, 1); }).then(beginInput);
    }
    p.catch(ignoreCancel);
  }

  function beginInput() {
    setPhase('input');
    pos = 0;
    drawDots(seq.length, 0);
  }

  function playSeq(id, slowFactor) {
    setPhase('show');
    var lit = (settings.speed === 'slow' ? 1000 : 700) * slowFactor;
    var gap = 500 * slowFactor;
    var p = Promise.resolve();
    seq.forEach(function (c) {
      p = p.then(function () { return light(c, 'lit', lit, id); })
           .then(function () { return sleep(gap, id); });
    });
    return p;
  }

  function onTap(e, i) {
    e.preventDefault();
    if (phase !== 'input') return;
    if (e.isPrimary === false) return; // 첫 번째 터치만
    var id = runId;
    var target = seq[pos];
    if (i === target) {
      wrongAt = -1; wrongCount = 0;
      clearTimeout(hintTimer);
      cells[target].classList.remove('hint');
      pos++;
      drawDots(seq.length, pos);
      if (settings.mode === 'follow') {
        phase = 'success-wait';
        cells[i].classList.remove('lit');
        cells[i].classList.add('lit');
        sleep(400, id).then(function () { cells[i].classList.remove('lit'); succeed(id); }).catch(ignoreCancel);
      } else if (pos >= seq.length) {
        phase = 'success-wait';
        light(i, 'lit', 400, id).then(function () { return succeed(id); }).catch(ignoreCancel);
      } else {
        light(i, 'lit', 400, id).catch(ignoreCancel);
      }
    } else {
      // 틀림
      if (settings.mode === 'follow') return; // 눌러야 할 칸은 이미 빛나는 중
      phase = 'show-wait';
      hearts--;
      drawHearts();
      var out = hearts <= 0;
      sleep(out ? 800 : 700, id).then(function () {
        if (out) { setPhase('idle'); retryBtn.hidden = false; return; }
        return playSeq(id, 1).then(beginInput); // 같은 단계를 처음부터 다시
      }).catch(ignoreCancel);
    }
  }

  function succeed(id) {
    if (id !== runId) return Promise.reject('cancel');
    setPhase('success');
    var full = false;
    var big = settings.mode === 'memory' || full;
    var p = Promise.resolve();
    if (big) {
      cells.forEach(function (c) { c.classList.add('glow'); });
      celebrate.classList.add('show');
      p = sleep(500, id).then(function () { cells.forEach(function (c) { c.classList.remove('glow'); }); })
           .then(function () { return sleep(1000, id); })
           .then(function () { celebrate.classList.remove('show'); });
    } else {
      p = sleep(500, id);
    }
    return p.then(function () {
      if (settings.mode === 'memory' && seq.length >= 10) {
        setPhase('idle'); winEl.hidden = false; retryBtn.hidden = false; return;
      }
      if (full) { hearts = 0; drawHearts(); }
      level++;
      stage();
    }).catch(ignoreCancel);
  }

  // ---------- 멘토 설정 ----------
  var settingsEl = $('settings');
  var maxInput = $('maxLenInput');
  function syncSeg() {
    maxInput.value = +settings.maxLen > 0 ? settings.maxLen : '';
    document.querySelectorAll('.seg').forEach(function (seg) {
      var key = seg.dataset.key;
      seg.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', String(settings[key]) === b.dataset.v);
      });
    });
  }
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.parentNode.dataset.key;
      settings[key] = key === 'maxLen' ? +b.dataset.v : b.dataset.v;
      save(); syncSeg(); applyNames(); reset();
    });
  });
  maxInput.addEventListener('change', function () {
    var v = parseInt(maxInput.value, 10);
    settings.maxLen = (isNaN(v) || v < 1) ? 0 : Math.min(v, 99);
    save(); syncSeg(); reset();
  });
  $('closeSettings').addEventListener('click', function () { settingsEl.hidden = true; });

  // 제목 3초 꾹
  var pressTimer = null;
  var title = $('title');
  function cancelPress() { clearTimeout(pressTimer); }
  title.addEventListener('pointerdown', function () {
    cancelPress();
    pressTimer = setTimeout(function () { syncSeg(); settingsEl.hidden = false; }, 3000);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { title.addEventListener(t, cancelPress); });

  // ---------- 버튼, 실수 방지 ----------
  $('modeFollow').addEventListener('click', function () { settings.mode = 'follow'; startGame(); });
  $('modeMemory').addEventListener('click', function () { settings.mode = 'memory'; startGame(); });
  retryBtn.addEventListener('click', function () {
    retryBtn.hidden = true;
    winEl.hidden = true;
    hearts = 3; drawHearts(); seq = []; level = 1;
    stage();
  });
  $('reset').addEventListener('click', reset);

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('touchstart', function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}

  applyNames();
  reset();
})();
