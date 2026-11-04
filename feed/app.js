'use strict';
// 먹이 주기, 배부름 게이지, 처음부터, 소리 토글, 시작

function buildCards() {
  FOODS.forEach(function (f) {
    var c = document.createElement('div');
    c.className = 'card ' + f.id;
    c.dataset.food = f.id;
    c.innerHTML = SVG[f.id] + '<div class="label">' + f.ko + '<br>' + f.en + '</div>';
    elFoods.appendChild(c);
    attachDrag(c, f);
  });
  PLAYS.forEach(function (p) {
    var c = document.createElement('div');
    c.className = 'card ' + p.id;
    c.dataset.food = p.id;
    c.innerHTML = SVG[p.id] + '<div class="label">' + p.ko + '<br>' + p.en + '</div>';
    elFoods.appendChild(c);
    attachPlay(c, p);
  });
}

function attachDrag(card, food) {
  var drag = null;

  card.addEventListener('pointerdown', function (e) {
    if (busy || drag) return;
    e.preventDefault();
    try { card.setPointerCapture(e.pointerId); } catch (x) {}
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, ghost: null };
    card.classList.add('hold');
  });

  card.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.sqrt(dx * dx + dy * dy) > 10) {
      drag.moved = true;
      deselect();
      card.classList.add('away');
      drag.ghost = makeGhost(food.id, e.clientX, e.clientY);
    }
    if (drag.moved) {
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      var near = overRabbit(e.clientX, e.clientY);
      elRabbit.classList.toggle('drop-ready', near);
      if (!busy) setState(near && !locked ? 'open' : 'idle');
    }
  });

  function finish(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    card.classList.remove('hold');
    elRabbit.classList.remove('drop-ready');
    try { card.releasePointerCapture(e.pointerId); } catch (x) {}

    if (!d.moved) {
      if (cancelled) return;
      if (selected === food.id) { deselect(); }
      else { select(food); speakFood(food); }
      return;
    }
    if (!cancelled && overRabbit(e.clientX, e.clientY) && !busy) {
      eat(food, d.ghost);
    } else {
      setState('idle');
      var home = cardCenter(card);
      d.ghost.classList.add('anim');
      d.ghost.style.left = home.x + 'px';
      d.ghost.style.top = home.y + 'px';
      later(function () {
        if (d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
        card.classList.remove('away');
      }, 620);
    }
  }
  card.addEventListener('pointerup', function (e) { finish(e, false); });
  card.addEventListener('pointercancel', function (e) { finish(e, true); });
}

function select(food) {
  selected = food.id;
  Array.prototype.forEach.call(elFoods.children, function (c) {
    c.classList.toggle('selected', c.dataset.food === food.id);
  });
}
function deselect() {
  selected = null;
  Array.prototype.forEach.call(elFoods.children, function (c) { c.classList.remove('selected'); });
}

function tapFeed() {
  if (busy || !selected) return false;
  var food = FOODS.filter(function (f) { return f.id === selected; })[0];
  if (locked) { deselect(); refuse(food, null); return true; }
  var card = cardOf(food.id);
  var from = cardCenter(card);
  var g = makeGhost(food.id, from.x, from.y);
  deselect();
  card.classList.add('away');
  setState('open');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var m = mouthPoint();
      g.classList.add('anim');
      g.style.left = m.x + 'px'; g.style.top = m.y + 'px';
      later(function () { eat(food, g); }, 600);
    });
  });
  return true;
}

// ---------- fullness gauge ----------
var elBelly = $('belly');
function buildCells() {
  var h = '<span class="bicon">' + SVG.apple + '</span>';
  for (var i = 0; i < MAX_CELLS; i++) h += '<span class="cell"></span>';
  elBelly.innerHTML = h;
}
function showCells() {
  var list = elBelly.querySelectorAll('.cell');
  for (var i = 0; i < list.length; i++) list[i].classList.toggle('on', i < cells);
  elBelly.classList.toggle('locked', locked);
}
function addCell() {
  cells = Math.min(MAX_CELLS, cells + 1);
  decayAt = Date.now();
  if (cells >= MAX_CELLS) locked = true;
  showCells();
}
function refuse(food, ghost) {
  busy = true;
  setState('idle');
  var card = cardOf(food.id);
  playClass(rb(), 'shake', 900);
  sayBubble(FULLB);
  if (ghost) {
    var home = cardCenter(card);
    ghost.classList.add('anim');
    ghost.style.left = home.x + 'px';
    ghost.style.top = home.y + 'px';
  }
  later(function () { if (ghost && ghost.parentNode) ghost.remove(); card.classList.remove('away'); }, 650);
  later(function () { busy = false; }, 1000);
  later(function () { if (!busy && !sleeping) setBubble(idleBubble()); }, 2500);
}
setInterval(function () {
  if (cells <= 0) { decayAt = Date.now(); return; }
  if (Date.now() - decayAt < DECAY_MS) return;
  decayAt = Date.now();
  cells--;
  if (locked && cells <= UNLOCK_AT) locked = false;
  showCells();
  if (cells === 1) becomeHungry();
}, 1000);

function eat(food, ghost) {
  if (locked) { refuse(food, ghost); return; }
  busy = true;
  var m = mouthPoint();
  setState('open');
  ghost.classList.add('anim');
  ghost.style.left = m.x + 'px';
  ghost.style.top = m.y + 'px';
  ghost.style.transform = 'translate(-50%, -50%) scale(0.1)';
  ghost.style.opacity = '0';

  later(function () {
    if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    setState('chew');
  }, 500);

  later(function () {
    setState('happy');
    sayBubble(YUMMY);
    addAffinity(2);
    addCell();
    floatHeart();
  }, 1500);

  later(function () {
    var card = cardOf(food.id);
    card.classList.remove('away');
  }, 1700);

  later(function () {
    setState('idle');
    busy = false;
  }, 2500);

  later(function () {
    if (cells >= MAX_CELLS) {
      sayBubble(FULLB);
      later(function () { if (!busy && !sleeping) setBubble(idleBubble()); }, 2500);
    } else {
      sayBubble(idleBubble());
    }
  }, 3500);
}

elReset.addEventListener('click', function () {
  clearTimers();
  busy = false; celebrating = false; seeking = false; cells = 0; locked = false; showCells(); deselect();
  $('bubble').classList.remove('seek');
  if (night) { night = false; document.body.classList.remove('night'); sleeping = false; $('btnDn').innerHTML = SVG.moon; }
  Array.prototype.forEach.call(document.querySelectorAll('.hbush'), function (el) { el.remove(); });
  elRabbit.style.visibility = ''; elRabbit.style.translate = ''; elRabbit.style.scale = ''; elRabbit.style.transition = '';
  Array.prototype.forEach.call(document.querySelectorAll('.ghost'), function (g) { g.remove(); });
  Array.prototype.forEach.call(elFoods.children, function (c) { c.classList.remove('away'); });
  setState('idle');
  setBubble(idleBubble());
  try { window.speechSynthesis.cancel(); } catch (e) {}
});

var pressTimer = null;
function showSpeaker() {
  elSpeaker.innerHTML = SVG.speaker(soundOn);
  elSpeaker.classList.add('show');
  setTimeout(function () { elSpeaker.classList.remove('show'); }, 2000);
}
elTitle.addEventListener('pointerdown', function () {
  clearTimeout(pressTimer);
  pressTimer = setTimeout(function () {
    soundOn = !soundOn;
    saveSound();
    showSpeaker();
    if (soundOn) speak('소리 켜짐', 'ko-KR');
    else { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }, 3000);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
  elTitle.addEventListener(ev, function () { clearTimeout(pressTimer); });
});

document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
document.addEventListener('dblclick', function (e) { e.preventDefault(); });
document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
document.addEventListener('selectstart', function (e) { e.preventDefault(); });

elRabbit.innerHTML = SVG.rabbit;
buildCards();
setBubble(idleBubble());

affinity = Math.max(0, Math.min(AFF_MAX, parseInt(load('affinity'), 10) || 0));
buildStars();
showStars();
applyLook();
showBg();
$('btnCloset').innerHTML = ACC_ICON_CLOSET;
$('btnBg').innerHTML = SVG.scene;
$('btnDn').innerHTML = SVG.moon;
buildCells();
showCells();
if (load('visited')) {
  setState('happy');
  setBubble({ text: '반가워요', symbol: 'yummy' });
  later(function () { setState('idle'); setBubble(idleBubble()); }, 2500);
}
store('visited', 1);
