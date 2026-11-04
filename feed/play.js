'use strict';
// 놀이: 공 굴리기, 숨바꼭질

// ---------- play: ball and hide-and-seek ----------
function attachPlay(card, play) {
  var d = null;
  card.addEventListener('pointerdown', function (e) {
    if (busy || d) return;
    e.preventDefault();
    try { card.setPointerCapture(e.pointerId); } catch (x) {}
    d = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, ghost: null };
    card.classList.add('hold');
  });
  card.addEventListener('pointermove', function (e) {
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.sqrt(Math.pow(e.clientX - d.sx, 2) + Math.pow(e.clientY - d.sy, 2)) > 10) {
      d.moved = true;
      if (play.id === 'ball') { card.classList.add('away'); d.ghost = makeGhost('ball', e.clientX, e.clientY); }
    }
    if (d.ghost) { d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; }
  });
  function end(e, cancelled) {
    if (!d || e.pointerId !== d.id) return;
    var s = d; d = null;
    card.classList.remove('hold');
    try { card.releasePointerCapture(e.pointerId); } catch (x) {}
    if (s.ghost) { s.ghost.remove(); card.classList.remove('away'); }
    if (cancelled) return;
    if (!s.moved) speakFood(play);
    if (play.id === 'ball') {
      var from = s.moved ? { x: e.clientX, y: e.clientY } : cardCenter(card);
      playBall(from.x, from.y, card);
    } else {
      startHide();
    }
  }
  card.addEventListener('pointerup', function (e) { end(e, false); });
  card.addEventListener('pointercancel', function (e) { end(e, true); });
}

function playBall(x, y, card) {
  if (busy) return;
  busy = true; deselect();
  card.classList.add('away');
  var g = makeGhost('ball', x, y);
  var r = elRabbit.getBoundingClientRect();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      g.classList.add('anim');
      g.style.left = (r.left + r.width * 0.2) + 'px';
      g.style.top = (r.top + r.height * 0.9) + 'px';
      g.style.transform = 'translate(-50%, -50%) scale(1.15) rotate(540deg)';
    });
  });
  later(function () {
    setState('happy'); sayBubble(PLAY); addAffinity(1);
    g.style.left = (r.right + 30) + 'px';
    g.style.top = (r.top + r.height * 0.7) + 'px';
    g.style.transform = 'translate(-50%, -50%) scale(1.15) rotate(1260deg)';
  }, 750);
  later(function () { g.style.opacity = '0'; }, 1500);
  later(function () {
    g.remove(); card.classList.remove('away');
    setState('idle'); setBubble(idleBubble());
    busy = false;
  }, 2200);
}

var lastSpot = -1;
function startHide() {
  if (busy) return;
  busy = true; deselect();
  var z = elZone.getBoundingClientRect();
  var w = Math.min(z.width * 0.27, 200), h = w * 1.1;
  var spots = [0.03, 0.365, 0.70];
  var target;
  do { target = Math.floor(Math.random() * 3); } while (target === lastSpot);
  lastSpot = target;
  elRabbit.style.visibility = 'hidden';
  $('bubble').classList.add('seek');
  seeking = true;
  sayBubble(SEEK, true);
  var bushes = [], wrong = 0, done = false;
  spots.forEach(function (fx, i) {
    var el = document.createElement('div');
    el.className = 'hbush';
    el.style.left = (z.width * fx) + 'px';
    el.style.bottom = '14px';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.innerHTML = SVG.bushBig + (i === target ? '<svg class="peek" viewBox="0 0 120 80"><ellipse cx="38" cy="44" rx="16" ry="38" fill="#fff" stroke="' + INK + '" stroke-width="5"/><ellipse cx="82" cy="44" rx="16" ry="38" fill="#fff" stroke="' + INK + '" stroke-width="5"/><ellipse cx="38" cy="50" rx="7" ry="22" fill="#ffc2d4"/><ellipse cx="82" cy="50" rx="7" ry="22" fill="#ffc2d4"/></svg>' : '');
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (i === target) { found(); return; }
      playClass(el, 'bounce', 700);
      hint();
      sayBubble(NOTHERE, true);
      clearTimeout(msgTimer);
      msgTimer = setTimeout(function () { if (!done) sayBubble(SEEK, true); }, 2200);
    });
    elZone.appendChild(el);
    bushes.push(el);
  });
  var hintTimer = null, msgTimer = null;
  function hint() {
    if (done) return;
    var el = bushes[target];
    clearTimeout(hintTimer);
    el.classList.remove('hint');
    void el.offsetWidth;
    el.classList.add('hint');
    hintTimer = setTimeout(function () { el.classList.remove('hint'); }, 1900);
  }
  function found() {
    if (done) return;
    done = true;
    clearTimeout(hintTimer); clearTimeout(msgTimer);
    var tb = bushes[target].getBoundingClientRect(), rr = elRabbit.getBoundingClientRect();
    elRabbit.style.transition = 'none';
    elRabbit.style.translate = ((tb.left + tb.width / 2) - (rr.left + rr.width / 2)) + 'px 0';
    elRabbit.style.scale = '0.55';
    elRabbit.style.visibility = '';
    void elRabbit.offsetWidth;
    bushes.forEach(function (el) { el.classList.add('out'); });
    later(function () {
      elRabbit.style.transition = 'translate .9s ease, scale .9s ease';
      elRabbit.style.translate = '0 0';
      elRabbit.style.scale = '1';
      seeking = false;
      $('bubble').classList.remove('seek');
      setState('happy'); sayBubble(PEEK); addAffinity(2); floatHeart();
    }, 500);
    later(function () {
      elRabbit.style.transition = ''; elRabbit.style.translate = ''; elRabbit.style.scale = '';
      bushes.forEach(function (el) { el.remove(); });
    }, 1500);
    later(function () { setState('idle'); setBubble(idleBubble()); busy = false; }, 2800);
  }
  later(hint, 8000);
  later(found, 30000);
}
