'use strict';
// 만지기, 호감도(별), 살아 있는 움직임, 졸림

// ---------- affinity, petting, idle life ----------
var AFF_MAX = 10, affinity = 0, sleeping = false, lastTouch = Date.now(), celebrating = false;
var petting = false, pet = null, petMs = 0, lastHeartAt = 0, petEnd = null;
var SLEEPY = { text: '졸려요', symbol: 'sleepy' };
var PET = { text: '좋아요', symbol: 'yummy' };
var FULL = { text: '너무 좋아요', symbol: 'yummy' };
var elStars = $('stars');
var STAR = '<svg viewBox="0 0 100 100"><polygon points="50,8 62,38 94,38 68,58 78,90 50,70 22,90 32,58 6,38 38,38" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>';


function buildStars() {
  var h = '';
  for (var i = 0; i < AFF_MAX / 2; i++) h += '<span class="star">' + STAR + '</span>';
  elStars.innerHTML = h;
}
function showStars() {
  var list = elStars.children;
  for (var i = 0; i < list.length; i++) {
    var p = affinity - i * 2;
    list[i].className = 'star' + (p >= 2 ? ' full' : p === 1 ? ' half' : '');
  }
}
function addAffinity(n) {
  affinity = Math.min(AFF_MAX, affinity + n);
  store('affinity', affinity);
  showStars();
  if (affinity >= AFF_MAX) celebrate();
}
function celebrate() {
  if (celebrating) return;
  celebrating = true;
  var go = function () {
    if (!celebrating) return;
    if (busy || petting) { later(go, 500); return; }
    busy = true;
    setState('happy');
    sayBubble(FULL);
    floatHeart();
    later(function () {
      affinity = 0; store('affinity', 0); showStars();
      var it = grantItem();
      if (it) {
        sayBubble(GIFT); floatHeart();
        later(function () { setState('idle'); setBubble(idleBubble()); busy = false; celebrating = false; tutorShow(); }, 2200);
      } else {
        setState('idle'); setBubble(idleBubble());
        busy = false; celebrating = false;
      }
    }, 2200);
  };
  later(go, 300);
}

function endPet() {
  petting = false;
  clearTimeout(petEnd);
  petEnd = setTimeout(function () {
    if (busy || sleeping) return;
    setState('idle'); setBubble(idleBubble());
  }, 800);
}

elRabbit.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  // 밤에 토끼를 만지면 깨어남 (해 버튼과 같은 동작)
  if (night) { $('btnDn').click(); return; }
  if (tapFeed()) return;
  if (busy) return;
  try { elRabbit.setPointerCapture(e.pointerId); } catch (x) {}
  var part = e.target.closest ? e.target.closest('.ear-l, .ear-r, .nose, .nose-vis') : null;
  pet = { id: e.pointerId, x: e.clientX, y: e.clientY, dist: 0, part: part, active: false, last: Date.now() };
});
elRabbit.addEventListener('pointermove', function (e) {
  if (!pet || e.pointerId !== pet.id || busy) return;
  var now = Date.now();
  var d = Math.sqrt(Math.pow(e.clientX - pet.x, 2) + Math.pow(e.clientY - pet.y, 2));
  pet.dist += d; pet.x = e.clientX; pet.y = e.clientY;
  if (!pet.active && pet.dist > 40) {
    pet.active = true; petting = true;
    clearTimeout(petEnd);
    setState('pet'); sayBubble(PET);
  }
  if (pet.active) {
    petMs += Math.min(now - pet.last, 200);
    if (petMs >= 3000) { petMs -= 3000; addAffinity(1); }
    if (now - lastHeartAt > 500) { lastHeartAt = now; floatAt(e.clientX, e.clientY); }
  }
  pet.last = now;
});
function petUp(e) {
  if (!pet || e.pointerId !== pet.id) return;
  var p = pet; pet = null;
  if (p.active) { endPet(); return; }
  if (e.type === 'pointercancel' || busy || !p.part) return;
  if (p.part.classList.contains('nose') || p.part.classList.contains('nose-vis')) { playClass(rb(), 'sniff', 700); playClass(rb(), 'achoo', 800); }
  else playClass(p.part.closest('.ear-l, .ear-r'), 'wig', 700);
}
elRabbit.addEventListener('pointerup', petUp);
elRabbit.addEventListener('pointercancel', petUp);

// any touch wakes the rabbit
document.addEventListener('pointerdown', function () {
  lastTouch = Date.now();
  if (sleeping && !night) {
    sleeping = false;
    setState('idle'); setBubble(idleBubble());
    wakeMotion();
  }
}, true);

// 일어나는 모션: 하품하며 기지개 (눈 감은 채 입 벌림 -> 귀가 천천히 서고 눈을 뜸)
var WAKE_MS = 1400;
function wakeMotion() {
  playClass(rb(), 'yawn', WAKE_MS);
  later(function () {
    playClass(rb().querySelector('.ear-l'), 'wig', 700);
    playClass(rb().querySelector('.ear-r'), 'wig', 700);
  }, WAKE_MS);
}

setInterval(function () {
  if (busy || petting) return;
  if (!sleeping && Date.now() - lastTouch > 20000) {
    sleeping = true; setState('sleep'); setBubble(SLEEPY); return;
  }
  if (sleeping) return;
  var r = Math.random();
  if (r < 0.5) playClass(rb(), 'blink', 300);
  else if (r < 0.85) playClass(rb().querySelector(r < 0.7 ? '.ear-l' : '.ear-r'), 'wig', 700);
  else if (affinity >= 6) {
    setState('happy');
    later(function () { if (!busy && !sleeping && !petting) setState('idle'); }, 1000);
  }
}, 3500);
